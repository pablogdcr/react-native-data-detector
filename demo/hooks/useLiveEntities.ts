import { useEffect, useMemo, useRef, useState } from 'react';
import { useDetectedEntities, type DetectedEntity } from 'react-native-data-detector';

import { APPEAR_DELAY_MS, DETECT_THROTTLE_MS, SETTLE_MS } from '../constants';
import { useThrottledValue } from './useThrottledValue';

export type Phase = 'settling' | 'settled';

export type Segment =
  | { kind: 'plain'; text: string; key: string }
  | { kind: 'entity'; entity: DetectedEntity; phase: Phase; key: string };

function canonicalValue(e: DetectedEntity): string {
  return (
    e.data?.url ??
    e.data?.phoneNumber ??
    e.data?.email ??
    e.data?.address ??
    e.data?.date ??
    e.text.trim()
  );
}

function prune(prev: Set<string>, present: Set<string>): Set<string> {
  const next = new Set([...prev].filter((k) => present.has(k)));
  return next.size === prev.size ? prev : next;
}

type Slot = { key: string; entity: DetectedEntity; value: string };

/**
 * Turns the library's raw entities into an ordered, phase-tagged segment model:
 * plain (during a short appear delay) → settling (grey pill) → settled (chip),
 * the last step gated on the value holding still for SETTLE_MS.
 */
export function useLiveEntities(text: string) {
  // throttled, so detection re-runs periodically while typing instead of only
  // once typing stops
  const throttledText = useThrottledValue(text, DETECT_THROTTLE_MS);
  const { entities, isDetecting } = useDetectedEntities(throttledText, { debounceMs: 0 });

  // detection ran against a stale copy of the text, so offsets can be off
  // mid-keystroke — only trust an entity whose slice still matches
  const validEntities = useMemo(
    () =>
      entities
        .filter((e) => text.substring(e.start, e.end) === e.text)
        .sort((a, b) => a.start - b.start),
    [entities, text],
  );

  // Stable keys via overlap-matching against the previous render: as you append
  // letters an entity's range grows or gets re-segmented, and keeping the key
  // keeps the React node (and its running animation) alive.
  const prevSlots = useRef<{ key: string; type: string; start: number; end: number }[]>([]);
  const slots = useMemo<Slot[]>(() => {
    const prev = prevSlots.current;
    const taken = new Set<number>();
    const out: Slot[] = validEntities.map((e) => {
      let key: string | null = null;
      for (let i = 0; i < prev.length; i += 1) {
        if (taken.has(i)) continue;
        const p = prev[i];
        if (p.type === e.type && e.start <= p.end && e.end >= p.start) {
          key = p.key;
          taken.add(i);
          break;
        }
      }
      if (key == null) key = `${e.type}:${e.start}`;
      return { key, entity: e, value: canonicalValue(e) };
    });
    prevSlots.current = out.map((s) => ({
      key: s.key,
      type: s.entity.type,
      start: s.entity.start,
      end: s.entity.end,
    }));
    return out;
  }, [validEntities]);

  // per-slot timing: first seen, current value, when the value last changed
  const meta = useRef<Map<string, { firstSeenAt: number; value: string; changedAt: number }>>(
    new Map(),
  );
  const [shownKeys, setShownKeys] = useState<Set<string>>(() => new Set());
  const [settledKeys, setSettledKeys] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const now = Date.now();
    const present = new Set(slots.map((s) => s.key));
    const reverted: string[] = [];
    slots.forEach(({ key, value }) => {
      const m = meta.current.get(key);
      if (!m) {
        meta.current.set(key, { firstSeenAt: now, value, changedAt: now });
      } else if (m.value !== value) {
        m.value = value;
        m.changedAt = now; // value grew, settle clock restarts
        reverted.push(key);
      }
    });
    for (const k of [...meta.current.keys()]) {
      if (!present.has(k)) meta.current.delete(k);
    }
    setShownKeys((prev) => prune(prev, present));
    setSettledKeys((prev) => {
      const next = new Set([...prev].filter((k) => present.has(k) && !reverted.includes(k)));
      return next.size === prev.size ? prev : next;
    });
  }, [slots]);

  // one timer, armed for whichever phase boundary is due next
  useEffect(() => {
    const evaluate = () => {
      const now = Date.now();
      setShownKeys((prev) => {
        let changed = false;
        const next = new Set(prev);
        meta.current.forEach((m, k) => {
          if (!next.has(k) && now - m.firstSeenAt >= APPEAR_DELAY_MS) {
            next.add(k);
            changed = true;
          }
        });
        return changed ? next : prev;
      });
      setSettledKeys((prev) => {
        let changed = false;
        const next = new Set(prev);
        meta.current.forEach((m, k) => {
          if (
            !next.has(k) &&
            now - m.firstSeenAt >= APPEAR_DELAY_MS &&
            now - m.changedAt >= SETTLE_MS
          ) {
            next.add(k);
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    };

    const now = Date.now();
    let soonest = Infinity;
    meta.current.forEach((m, k) => {
      if (!shownKeys.has(k)) soonest = Math.min(soonest, m.firstSeenAt + APPEAR_DELAY_MS - now);
      if (!settledKeys.has(k)) soonest = Math.min(soonest, m.changedAt + SETTLE_MS - now);
    });
    if (!Number.isFinite(soonest)) return;

    const id = setTimeout(evaluate, Math.max(0, soonest));
    return () => clearTimeout(id);
  }, [slots, shownKeys, settledKeys]);

  // slots still inside their appear delay render as ordinary text
  const segments = useMemo<Segment[]>(() => {
    const out: Segment[] = [];
    let cursor = 0;

    for (const { key, entity: e } of slots) {
      if (e.start < cursor) continue; // overlap
      const settled = settledKeys.has(key);
      const shown = shownKeys.has(key);
      if (!settled && !shown) continue;

      if (e.start > cursor) {
        out.push({ kind: 'plain', text: text.slice(cursor, e.start), key: `plain:${cursor}` });
      }
      out.push({ kind: 'entity', entity: e, phase: settled ? 'settled' : 'settling', key });
      cursor = e.end;
    }

    if (cursor < text.length) {
      out.push({ kind: 'plain', text: text.slice(cursor), key: `plain:${cursor}` });
    }
    return out;
  }, [text, slots, shownKeys, settledKeys]);

  return { segments, isDetecting };
}

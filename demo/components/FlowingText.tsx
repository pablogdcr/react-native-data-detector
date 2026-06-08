import { memo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { DetectedEntity } from 'react-native-data-detector';

import type { Phase, Segment } from '../hooks/useLiveEntities';
import { C, TYPO } from '../theme';
import { Caret } from './Caret';
import { EntitySpan } from './EntitySpan';

interface Props {
  segments: Segment[];
  /** character index (into the raw text) where the caret is drawn */
  caretIndex: number;
  onCaretMove: (index: number) => void;
}

function tokenize(text: string): string[] {
  return text.split(/(\s+)/).filter((t) => t.length > 0);
}

const Word = memo(function Word({
  text,
  offset,
  onCaretMove,
}: {
  text: string;
  offset: number;
  onCaretMove: (index: number) => void;
}) {
  return (
    <Text style={styles.word} allowFontScaling={false} onPress={() => onCaretMove(offset)}>
      {text}
    </Text>
  );
});

type Atom =
  | { kind: 'word'; key: string; text: string; start: number }
  | { kind: 'break'; key: string }
  | { kind: 'chip'; key: string; entity: DetectedEntity; phase: Phase; start: number; end: number };

/**
 * Renders the string as a wrapping flex row of word tokens interleaved with
 * entity chips — a single <Text> couldn't carry the tappable chip Views inline.
 * The caret is its own node with a stable key so its blink never restarts.
 */
export function FlowingText({ segments, caretIndex, onCaretMove }: Props) {
  const atoms: Atom[] = [];
  let off = 0;
  for (const seg of segments) {
    if (seg.kind === 'plain') {
      // newlines become a zero-height full-width break; rendering "\n" as a text
      // token would make that line two lines tall
      const lines = seg.text.split('\n');
      let local = off;
      lines.forEach((line, li) => {
        if (li > 0) {
          atoms.push({ kind: 'break', key: `${seg.key}:br${li}` });
          local += 1;
        }
        for (const tok of tokenize(line)) {
          atoms.push({ kind: 'word', key: `${seg.key}:${local}`, text: tok, start: local });
          local += tok.length;
        }
      });
      off += seg.text.length;
    } else {
      const len = seg.entity.end - seg.entity.start;
      atoms.push({ kind: 'chip', key: seg.key, entity: seg.entity, phase: seg.phase, start: off, end: off + len });
      off += len;
    }
  }

  const items: ReactNode[] = [];
  const caret = <Caret key="caret" />;
  let placed = false;

  for (const atom of atoms) {
    if (atom.kind === 'break') {
      items.push(<View key={atom.key} style={styles.break} />);
      continue;
    }
    if (atom.kind === 'word') {
      const end = atom.start + atom.text.length;
      if (!placed && caretIndex <= atom.start) {
        items.push(caret);
        placed = true;
      }
      if (!placed && caretIndex < end) {
        // caret falls inside the word: split it
        const rel = caretIndex - atom.start;
        items.push(
          <Word key={`${atom.key}:a`} text={atom.text.slice(0, rel)} offset={atom.start} onCaretMove={onCaretMove} />,
        );
        items.push(caret);
        items.push(
          <Word key={`${atom.key}:b`} text={atom.text.slice(rel)} offset={atom.start + rel} onCaretMove={onCaretMove} />,
        );
        placed = true;
        continue;
      }
      items.push(<Word key={atom.key} text={atom.text} offset={atom.start} onCaretMove={onCaretMove} />);
      continue;
    }
    if (!placed && caretIndex <= atom.start) {
      items.push(caret);
      placed = true;
    }
    items.push(
      <EntitySpan
        key={atom.key}
        entity={atom.entity}
        phase={atom.phase}
        start={atom.start}
        end={atom.end}
        onCaretMove={onCaretMove}
      />,
    );
    if (!placed && caretIndex <= atom.end) {
      items.push(caret);
      placed = true;
    }
  }

  if (!placed) items.push(caret);

  // box-none so taps on empty gaps fall through to the hidden input
  return (
    <View style={styles.row} pointerEvents="box-none">
      {items}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  word: {
    color: C.text,
    fontSize: TYPO.fontSize,
    lineHeight: TYPO.lineHeight,
    fontWeight: TYPO.fontWeight,
  },
  break: {
    width: '100%',
    height: 0,
  },
});

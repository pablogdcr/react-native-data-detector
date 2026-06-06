import { useEffect, useRef, useState } from 'react';

import { detect as detectFn } from './ReactNativeDataDetector';
import type {
  DetectedEntity,
  DetectionType,
  ModelLanguage,
  ModelStatus,
} from './ReactNativeDataDetector.types';
import { DEFAULT_LANGUAGE, useModelLifecycle } from './useModelLifecycle';

export interface UseDetectedEntitiesOptions {
  /** Debounce applied to `text` before detecting, in ms. Defaults to `300`. */
  debounceMs?: number;
  /** Which entity types to detect. Defaults to all types. */
  types?: DetectionType[];
  /**
   * Which language model to use (Android only, defaults to `'en'`). Ignored on iOS.
   */
  language?: ModelLanguage;
  /** When `false`, detection is paused and the last result is kept. Defaults to `true`. */
  enabled?: boolean;
  /**
   * When `true` (default), download the model on mount if needed (Android).
   * No effect on iOS.
   */
  autoPrepare?: boolean;
}

export interface UseDetectedEntitiesResult {
  /** Entities detected in the (debounced) `text`. Empty until the first result. */
  entities: DetectedEntity[];
  /** `true` while a detection for the latest text is in flight. */
  isDetecting: boolean;
  /** Current model download state. */
  status: ModelStatus;
  /** The last detection or model error, or `null`. */
  error: Error | null;
}

/**
 * React hook for **reactive** data detection: pass a (possibly changing) string and
 * get back the detected entities, recomputed as the text changes. Debounced and
 * cancellation-safe (last write wins), so it is suited to as-you-type input.
 *
 * Manages model readiness internally (auto-downloads on Android). For **imperative**
 * detection where you call `detect` yourself, use {@link useDataDetector} instead.
 *
 * @example
 * const { entities, isDetecting } = useDetectedEntities(text, { debounceMs: 250 });
 */
export function useDetectedEntities(
  text: string,
  options?: UseDetectedEntitiesOptions,
): UseDetectedEntitiesResult {
  const debounceMs = options?.debounceMs ?? 300;
  const language = options?.language ?? DEFAULT_LANGUAGE;
  const enabled = options?.enabled ?? true;
  const autoPrepare = options?.autoPrepare ?? true;
  const types = options?.types;

  const { status, isReady, error: modelError } = useModelLifecycle(language, autoPrepare);

  const [entities, setEntities] = useState<DetectedEntity[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectError, setDetectError] = useState<Error | null>(null);

  // Debounce the incoming text.
  const [debouncedText, setDebouncedText] = useState(text);
  useEffect(() => {
    if (!enabled) return;
    const id = setTimeout(() => setDebouncedText(text), debounceMs);
    return () => clearTimeout(id);
  }, [text, debounceMs, enabled]);

  // `types` is an array; depend on a stable string key and read the latest value
  // from a ref so a new array identity each render doesn't re-trigger detection.
  const typesKey = types ? types.join(',') : '';
  const typesRef = useRef(types);
  typesRef.current = types;

  // Monotonic id so only the most recent detection can commit its result.
  const runId = useRef(0);

  useEffect(() => {
    if (!enabled || !isReady) return;

    if (!debouncedText) {
      runId.current += 1; // invalidate any in-flight detection
      setEntities([]);
      setIsDetecting(false);
      setDetectError(null);
      return;
    }

    const myRun = ++runId.current;
    setIsDetecting(true);
    setDetectError(null);

    detectFn(debouncedText, { types: typesRef.current, language })
      .then((res) => {
        if (myRun !== runId.current) return; // a newer run superseded this one
        setEntities(res);
        setIsDetecting(false);
      })
      .catch((e) => {
        if (myRun !== runId.current) return;
        setDetectError(e instanceof Error ? e : new Error(String(e)));
        setIsDetecting(false);
      });
  }, [debouncedText, isReady, enabled, language, typesKey]);

  return {
    entities,
    isDetecting,
    status,
    error: detectError ?? modelError,
  };
}

import { useCallback } from 'react';

import { detect as detectFn } from './ReactNativeDataDetector';
import type {
  DetectedEntity,
  DetectionType,
  ModelLanguage,
  ModelStatus,
} from './ReactNativeDataDetector.types';
import { DEFAULT_LANGUAGE, useModelLifecycle } from './useModelLifecycle';

export interface UseDataDetectorOptions {
  /**
   * Which language model to use (Android only, defaults to `'en'`). Ignored on iOS.
   * Changing this re-checks/prepares the model for the new language.
   */
  language?: ModelLanguage;
  /**
   * When `true` (default), the hook downloads the model on mount if it is not
   * already available (Android). Set to `false` to manage downloads yourself via
   * the returned `prepare()`. No effect on iOS, which is always ready.
   */
  autoPrepare?: boolean;
}

export interface UseDataDetectorResult {
  /**
   * Detects entities in `text` using the hook's configured language. Safe to call
   * before the model is ready — on Android the underlying call downloads the model
   * on demand if needed.
   */
  detect: (text: string, options?: { types?: DetectionType[] }) => Promise<DetectedEntity[]>;
  /** Manually (re)download the model for the configured language. */
  prepare: () => Promise<void>;
  /** Current model download state. */
  status: ModelStatus;
  /** `true` when the model is available and `detect()` can run offline. */
  isReady: boolean;
  /** The last preparation error, or `null`. */
  error: Error | null;
}

/**
 * React hook for **imperative** data detection: it tracks model availability and,
 * on Android, downloads the language model automatically, then hands you a `detect`
 * function to call when you want (e.g. once per chat message).
 *
 * For **reactive** detection of a changing string (as-you-type), use
 * {@link useDetectedEntities} instead.
 *
 * On iOS the model is always available, so `status` settles on `'ready'` and
 * `autoPrepare` has no effect.
 *
 * @example
 * const { detect, status, isReady } = useDataDetector();
 * // later: const entities = await detect(text, { types: ['email'] });
 */
export function useDataDetector(options?: UseDataDetectorOptions): UseDataDetectorResult {
  const language = options?.language ?? DEFAULT_LANGUAGE;
  const autoPrepare = options?.autoPrepare ?? true;

  const { status, isReady, prepare, error } = useModelLifecycle(language, autoPrepare);

  const detect = useCallback(
    (text: string, opts?: { types?: DetectionType[] }): Promise<DetectedEntity[]> =>
      detectFn(text, { types: opts?.types, language }),
    [language],
  );

  return { detect, prepare, status, isReady, error };
}

import { useCallback, useEffect, useRef, useState } from 'react';

import { detect as detectFn, getModelStatus, prepareModel } from './ReactNativeDataDetector';
import type {
  DetectedEntity,
  DetectionType,
  ModelLanguage,
  ModelStatus,
} from './ReactNativeDataDetector.types';

const DEFAULT_LANGUAGE: ModelLanguage = 'en';

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
 * React hook for data detection that tracks model availability and, on Android,
 * downloads the language model automatically.
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

  const [status, setStatus] = useState<ModelStatus>('notDownloaded');
  const [error, setError] = useState<Error | null>(null);

  // The language the hook currently cares about. Lets late-resolving promises
  // from a previous language (after a switch or unmount) be ignored.
  const activeLanguage = useRef(language);

  const prepare = useCallback(async () => {
    setError(null);
    setStatus('downloading');
    try {
      await prepareModel({ language });
      if (activeLanguage.current === language) setStatus('ready');
    } catch (e) {
      const err = e instanceof Error ? e : new Error(String(e));
      if (activeLanguage.current === language) {
        setError(err);
        setStatus('error');
      }
      throw err;
    }
  }, [language]);

  useEffect(() => {
    activeLanguage.current = language;
    let active = true;

    (async () => {
      setError(null);
      try {
        const current = await getModelStatus({ language });
        if (!active) return;
        if (current === 'ready') {
          setStatus('ready');
          return;
        }
        if (!autoPrepare) {
          setStatus(current);
          return;
        }
        setStatus('downloading');
        await prepareModel({ language });
        if (active) setStatus('ready');
      } catch (e) {
        if (active) {
          setError(e instanceof Error ? e : new Error(String(e)));
          setStatus('error');
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [language, autoPrepare]);

  const detect = useCallback(
    (text: string, opts?: { types?: DetectionType[] }): Promise<DetectedEntity[]> =>
      detectFn(text, { types: opts?.types, language }),
    [language],
  );

  return { detect, prepare, status, isReady: status === 'ready', error };
}

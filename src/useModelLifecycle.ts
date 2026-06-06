import { useCallback, useEffect, useRef, useState } from 'react';

import { getModelStatus, prepareModel } from './ReactNativeDataDetector';
import type { ModelLanguage, ModelStatus } from './ReactNativeDataDetector.types';

export const DEFAULT_LANGUAGE: ModelLanguage = 'en';

export interface ModelLifecycle {
  /** Current model download state. */
  status: ModelStatus;
  /** `true` when the model is available and `detect()` can run offline. */
  isReady: boolean;
  /** Manually (re)download the model for the configured language. */
  prepare: () => Promise<void>;
  /** The last preparation error, or `null`. */
  error: Error | null;
}

/**
 * Internal hook shared by {@link useDataDetector} and {@link useDetectedEntities}.
 * Tracks model availability for a language and, on Android, downloads it
 * automatically on mount when `autoPrepare` is set. On iOS the model is always
 * available, so `status` settles on `'ready'`.
 *
 * Not part of the public API.
 */
export function useModelLifecycle(language: ModelLanguage, autoPrepare: boolean): ModelLifecycle {
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

  return { status, isReady: status === 'ready', prepare, error };
}

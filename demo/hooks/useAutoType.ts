import { useCallback, useEffect, useRef, useState } from 'react';

import { AUTO_TYPE_INTERVAL_MS, AUTO_TYPE_PUNCTUATION_PAUSE_MS } from '../constants';

// Plays a script into `setText` one character at a time, for hands-free screen
// recordings. Entities highlight live as the text grows — typing never stalls
// to wait for detection.
export function useAutoType(setText: (value: string) => void, script: string) {
  const [isRunning, setIsRunning] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runningRef = useRef(false);

  const stop = useCallback(() => {
    runningRef.current = false;
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setIsRunning(false);
  }, []);

  const start = useCallback(() => {
    if (runningRef.current) return;
    runningRef.current = true;
    setIsRunning(true);
    setText('');

    let i = 0;
    const tick = () => {
      if (!runningRef.current) return;
      if (i >= script.length) {
        runningRef.current = false;
        setIsRunning(false);
        return;
      }
      const next = script.slice(0, i + 1);
      setText(next);
      const justTyped = next[next.length - 1];
      i += 1;

      const delay = /[.,!?]/.test(justTyped)
        ? AUTO_TYPE_PUNCTUATION_PAUSE_MS
        : AUTO_TYPE_INTERVAL_MS;

      timer.current = setTimeout(tick, delay);
    };

    timer.current = setTimeout(tick, 350);
  }, [script, setText]);

  useEffect(() => () => stop(), [stop]);

  return { isRunning, start, stop };
}

import { useEffect, useRef, useState } from 'react';

// Throttled copy of `value`: updates immediately on the first change, then at
// most once per `intervalMs`, always flushing the latest value on the trailing
// edge. (A debounce would never fire during sustained typing.)
export function useThrottledValue<T>(value: T, intervalMs: number): T {
  const [throttled, setThrottled] = useState(value);
  const lastRun = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const now = Date.now();
    const elapsed = now - lastRun.current;

    const flush = () => {
      lastRun.current = Date.now();
      setThrottled(value);
    };

    if (elapsed >= intervalMs) {
      flush();
    } else {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, intervalMs - elapsed);
    }

    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [value, intervalMs]);

  return throttled;
}

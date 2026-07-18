// hooks/useScrollHintToast.ts
import { useRef, useState, useCallback, useEffect } from "react";

const SHORT_COOLDOWN_MS = 10_000; // once every 10 seconds
const LONG_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_PER_WINDOW = 5; // 5 times per hour

export function useScrollHintToast() {
  const [visible, setVisible] = useState(false);
  const lastShownRef = useRef<number>(0);
  const hourlyTimestampsRef = useRef<number[]>([]);

  const tryShowToast = useCallback(() => {
    const now = Date.now();

    if (now - lastShownRef.current < SHORT_COOLDOWN_MS) return;

    hourlyTimestampsRef.current = hourlyTimestampsRef.current.filter(
      (t) => now - t < LONG_WINDOW_MS,
    );

    if (hourlyTimestampsRef.current.length >= MAX_PER_WINDOW) return;

    lastShownRef.current = now;
    hourlyTimestampsRef.current.push(now);
    setVisible(true);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const timeout = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(timeout);
  }, [visible]);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      const isVerticalIntent = Math.abs(e.deltaY) > Math.abs(e.deltaX);
      if (isVerticalIntent && !e.shiftKey) {
        tryShowToast();
      }
    },
    [tryShowToast],
  );

  return { visible, handleWheel };
}

import { useRef, useEffect, useCallback } from "react";

interface UseSwipeDownOptions {
  threshold?: number;
  onSwipeDown: () => void;
  enabled?: boolean;
}

export function useSwipeDown({
  threshold = 60,
  onSwipeDown,
  enabled = true,
}: UseSwipeDownOptions) {
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enabled) return;
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  }, [enabled]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!enabled) return;
    if (touchStartY.current === null || touchStartX.current === null) return;

    const touchEndY = e.changedTouches[0].clientY;
    const touchEndX = e.changedTouches[0].clientX;
    
    const deltaY = touchEndY - touchStartY.current;
    const deltaX = Math.abs(touchEndX - touchStartX.current);

    // Swipe down: deltaY > threshold and vertical movement is dominant
    if (deltaY > threshold && deltaY > deltaX) {
      console.log('[useSwipeDown] Swipe detected, minimizing');
      onSwipeDown();
    }

    touchStartY.current = null;
    touchStartX.current = null;
  }, [threshold, onSwipeDown, enabled]);

  return {
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
  };
}

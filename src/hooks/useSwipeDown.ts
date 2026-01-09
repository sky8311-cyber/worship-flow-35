import { useRef, useEffect, RefObject } from "react";

interface UseSwipeDownOptions {
  threshold?: number;
  onSwipeDown: () => void;
}

export function useSwipeDown<T extends HTMLElement = HTMLDivElement>({
  threshold = 60,
  onSwipeDown,
}: UseSwipeDownOptions): RefObject<T> {
  const ref = useRef<T>(null);
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
      touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartY.current === null || touchStartX.current === null) return;

      const touchEndY = e.changedTouches[0].clientY;
      const touchEndX = e.changedTouches[0].clientX;
      
      const deltaY = touchEndY - touchStartY.current;
      const deltaX = Math.abs(touchEndX - touchStartX.current);

      // Swipe down: deltaY > threshold and vertical movement is dominant
      if (deltaY > threshold && deltaY > deltaX) {
        onSwipeDown();
      }

      touchStartY.current = null;
      touchStartX.current = null;
    };

    element.addEventListener("touchstart", handleTouchStart, { passive: true });
    element.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener("touchstart", handleTouchStart);
      element.removeEventListener("touchend", handleTouchEnd);
    };
  }, [threshold, onSwipeDown]);

  return ref;
}

import { useEffect, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface UseEdgeSwipeOptions {
  edgeThreshold?: number; // How close to edge the touch must start (px)
  swipeThreshold?: number; // Minimum swipe distance to trigger (px)
  onSwipe: () => void;
}

export function useEdgeSwipe({
  edgeThreshold = 30,
  swipeThreshold = 50,
  onSwipe,
}: UseEdgeSwipeOptions) {
  const isMobile = useIsMobile();
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    if (!isMobile) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      // Only track if touch starts near the left edge
      if (touch.clientX <= edgeThreshold) {
        touchStartX.current = touch.clientX;
        touchStartY.current = touch.clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Prevent default to avoid scrolling while swiping from edge
      if (touchStartX.current !== null) {
        const touch = e.touches[0];
        const deltaX = touch.clientX - touchStartX.current;
        const deltaY = Math.abs(touch.clientY - (touchStartY.current || 0));
        
        // If horizontal swipe is dominant, prevent scroll
        if (deltaX > 10 && deltaX > deltaY) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === null) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartX.current;
      const deltaY = Math.abs(touch.clientY - (touchStartY.current || 0));

      // Trigger if swiped right past threshold and horizontal movement > vertical
      if (deltaX >= swipeThreshold && deltaX > deltaY) {
        onSwipe();
      }

      // Reset
      touchStartX.current = null;
      touchStartY.current = null;
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", handleTouchMove, { passive: false });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [isMobile, edgeThreshold, swipeThreshold, onSwipe]);
}

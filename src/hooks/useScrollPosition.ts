import { useEffect, useRef } from "react";

const STORAGE_PREFIX = "k-worship-scroll-";

export const useScrollPosition = (pageKey: string) => {
  const isRestored = useRef(false);

  // Restore scroll position on page entry
  useEffect(() => {
    if (isRestored.current) return;
    
    const saved = localStorage.getItem(`${STORAGE_PREFIX}${pageKey}`);
    if (saved) {
      const position = parseInt(saved, 10);
      // Delay restoration to wait for content to load
      setTimeout(() => {
        window.scrollTo(0, position);
      }, 100);
    }
    isRestored.current = true;
  }, [pageKey]);

  // Save scroll position (debounced)
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        localStorage.setItem(
          `${STORAGE_PREFIX}${pageKey}`, 
          window.scrollY.toString()
        );
      }, 200);
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(timeoutId);
    };
  }, [pageKey]);

  // Save final position before unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      localStorage.setItem(
        `${STORAGE_PREFIX}${pageKey}`, 
        window.scrollY.toString()
      );
    };
    
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [pageKey]);
};

// Clear scroll position utility (for cleanup)
export const clearScrollPosition = (pageKey: string) => {
  localStorage.removeItem(`${STORAGE_PREFIX}${pageKey}`);
};

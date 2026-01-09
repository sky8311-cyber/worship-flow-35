import { useState, useEffect, useRef } from "react";

export const useScrollDirection = (threshold: number = 10) => {
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const difference = currentScrollY - lastScrollY.current;
      
      // Only update if scrolled past threshold to avoid jittery behavior
      if (Math.abs(difference) > threshold) {
        setIsScrollingDown(difference > 0 && currentScrollY > 50);
        lastScrollY.current = currentScrollY;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [threshold]);

  return isScrollingDown;
};

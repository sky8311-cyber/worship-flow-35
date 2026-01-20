import { useRef, useEffect, useState, ReactNode } from "react";

// Fixed internal canvas dimensions (Cyworld-style)
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 500;

interface RoomCanvasProps {
  children: ReactNode | ((scale: number) => ReactNode);
  className?: string;
}

/**
 * Fixed 800x500 internal canvas that scales to fit container.
 * All children render at fixed pixel coordinates within this canvas.
 * The container scales via CSS transform to maintain aspect ratio.
 * 
 * Children can be a function receiving the current scale for interactive elements.
 */
export function RoomCanvas({ children, className = "" }: RoomCanvasProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (wrapperRef.current) {
        const containerWidth = wrapperRef.current.offsetWidth;
        const newScale = containerWidth / CANVAS_WIDTH;
        setScale(newScale);
      }
    };

    updateScale();
    
    const resizeObserver = new ResizeObserver(updateScale);
    if (wrapperRef.current) {
      resizeObserver.observe(wrapperRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  return (
    <div 
      ref={wrapperRef}
      className={`relative w-full overflow-hidden ${className}`}
      style={{
        // Container height based on scaled canvas
        height: CANVAS_HEIGHT * scale,
      }}
    >
      <div
        className="room-canvas absolute top-0 left-0 origin-top-left"
        style={{
          width: CANVAS_WIDTH,
          height: CANVAS_HEIGHT,
          transform: `scale(${scale})`,
        }}
      >
        {typeof children === 'function' ? children(scale) : children}
      </div>
    </div>
  );
}

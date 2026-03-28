import { useCallback, useRef } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

const GRID_SNAP = 20;
const MIN_W = 80;
const MIN_H = 60;

const snap = (v: number) => Math.round(v / GRID_SNAP) * GRID_SNAP;

type Dir = "n" | "s" | "e" | "w" | "ne" | "nw" | "se" | "sw";

const HANDLES: { dir: Dir; cursor: string; style: React.CSSProperties }[] = [
  { dir: "nw", cursor: "nw-resize", style: { top: -4, left: -4 } },
  { dir: "n", cursor: "n-resize", style: { top: -4, left: "50%", marginLeft: -4 } },
  { dir: "ne", cursor: "ne-resize", style: { top: -4, right: -4 } },
  { dir: "w", cursor: "w-resize", style: { top: "50%", left: -4, marginTop: -4 } },
  { dir: "e", cursor: "e-resize", style: { top: "50%", right: -4, marginTop: -4 } },
  { dir: "sw", cursor: "sw-resize", style: { bottom: -4, left: -4 } },
  { dir: "s", cursor: "s-resize", style: { bottom: -4, left: "50%", marginLeft: -4 } },
  { dir: "se", cursor: "se-resize", style: { bottom: -4, right: -4 } },
];

interface ResizeHandleProps {
  posX: number;
  posY: number;
  sizeW: number;
  sizeH: number;
  onResize: (updates: { pos_x?: number; pos_y?: number; size_w?: number; size_h?: number }) => void;
}

export function ResizeHandle({ posX, posY, sizeW, sizeH, onResize }: ResizeHandleProps) {
  const isMobile = useIsMobile();
  const dotSize = isMobile ? 14 : 8;
  const dotOffset = isMobile ? -7 : -4;

  const ref = useRef<{
    dir: Dir;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW: number;
    origH: number;
  } | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent, dir: Dir) => {
    e.stopPropagation();
    e.preventDefault();
    ref.current = {
      dir,
      startX: e.clientX,
      startY: e.clientY,
      origX: posX,
      origY: posY,
      origW: sizeW,
      origH: sizeH,
    };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [posX, posY, sizeW, sizeH]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!ref.current) return;
    const { dir, startX, startY, origX, origY, origW, origH } = ref.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    let newX = origX, newY = origY, newW = origW, newH = origH;

    if (dir.includes("e")) newW = snap(Math.max(MIN_W, origW + dx));
    if (dir.includes("w")) {
      const dw = snap(origW - dx);
      if (dw >= MIN_W) { newW = dw; newX = snap(Math.max(0, origX + dx)); }
    }
    if (dir.includes("s")) newH = snap(Math.max(MIN_H, origH + dy));
    if (dir.includes("n")) {
      const dh = snap(origH - dy);
      if (dh >= MIN_H) { newH = dh; newY = snap(Math.max(0, origY + dy)); }
    }

    onResize({ pos_x: newX, pos_y: newY, size_w: newW, size_h: newH });
  }, [onResize]);

  const handlePointerUp = useCallback(() => {
    ref.current = null;
  }, []);

  // Compute mobile-adjusted handle positions
  const mobileHandles = HANDLES.map(({ dir, cursor, style }) => {
    const adjusted: React.CSSProperties = { ...style };
    if ('top' in adjusted && typeof adjusted.top === 'number') adjusted.top = dotOffset;
    if ('bottom' in adjusted && typeof adjusted.bottom === 'number') adjusted.bottom = dotOffset;
    if ('left' in adjusted && typeof adjusted.left === 'number') adjusted.left = dotOffset;
    if ('right' in adjusted && typeof adjusted.right === 'number') adjusted.right = dotOffset;
    if (adjusted.marginLeft) adjusted.marginLeft = -(dotSize / 2);
    if (adjusted.marginTop) adjusted.marginTop = -(dotSize / 2);
    return { dir, cursor, style: adjusted };
  });

  return (
    <>
      {mobileHandles.map(({ dir, cursor, style }) => (
        <div
          key={dir}
          className="absolute z-10"
          style={{
            ...style,
            width: dotSize,
            height: dotSize,
            borderRadius: "50%",
            backgroundColor: "white",
            border: "2px solid #b8902a",
            cursor,
            touchAction: "none",
          }}
          onPointerDown={(e) => handlePointerDown(e, dir)}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
      ))}
    </>
  );
}

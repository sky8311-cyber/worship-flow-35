import { useState, useRef, useEffect } from "react";
import { RotateCw, Move } from "lucide-react";
import { getFurnitureSprite } from "./FurnitureSprites";
import { calculateZIndex, clampToFloor, GRID } from "./hooks/useFurnitureEditor";
import { cn } from "@/lib/utils";

interface FurniturePlacement {
  id: string;
  furniture_id: string;
  position_x: number;
  position_y: number;
  z_index: number;
  rotation?: number;
  furniture: {
    id: string;
    name: string;
    image_url: string;
    category: string;
    width_px: number | null;
    height_px: number | null;
    default_slot: string | null;
    layer: string | null;
  };
}

interface DraggableFurnitureProps {
  placement: FurniturePlacement;
  isEditMode: boolean;
  canvasScale: number;
  onPositionChange: (id: string, x: number, y: number) => void;
  onRotate: (id: string, currentRotation: number) => void;
}

export function DraggableFurniture({
  placement,
  isEditMode,
  canvasScale,
  onPositionChange,
  onRotate,
}: DraggableFurnitureProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [localPosition, setLocalPosition] = useState({
    x: placement.position_x,
    y: placement.position_y,
  });
  const elementRef = useRef<HTMLDivElement>(null);

  // Sync local position with placement
  useEffect(() => {
    if (!isDragging) {
      setLocalPosition({
        x: placement.position_x,
        y: placement.position_y,
      });
    }
  }, [placement.position_x, placement.position_y, isDragging]);

  const baseWidth = placement.furniture.width_px || 50;
  const baseHeight = placement.furniture.height_px || 50;
  const rotation = placement.rotation || 0;

  // Calculate scale based on Y position (further back = smaller)
  const yProgress = (localPosition.y - GRID.MIN_Y) / (GRID.MAX_Y - GRID.MIN_Y);
  const scale = 0.6 + yProgress * 0.4; // 0.6 at back, 1.0 at front
  
  const scaledWidth = baseWidth * scale;
  const scaledHeight = baseHeight * scale;

  const SpriteComponent = getFurnitureSprite(placement.furniture.image_url) ||
    getFurnitureSprite(placement.furniture.name);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.stopPropagation();
    
    const rect = elementRef.current?.getBoundingClientRect();
    if (!rect) return;

    // Calculate offset from click position to element center
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height;
    
    setDragOffset({
      x: (e.clientX - centerX) / canvasScale,
      y: (e.clientY - centerY) / canvasScale,
    });
    setIsDragging(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !elementRef.current) return;

    const canvas = elementRef.current.closest('.room-canvas');
    if (!canvas) return;

    const canvasRect = canvas.getBoundingClientRect();
    
    // Calculate position relative to canvas
    const relativeX = (e.clientX - canvasRect.left) / canvasScale - dragOffset.x;
    const relativeY = (e.clientY - canvasRect.top) / canvasScale - dragOffset.y;

    // Clamp to floor bounds
    const clamped = clampToFloor(relativeX, relativeY);
    setLocalPosition(clamped);
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      onPositionChange(placement.id, localPosition.x, localPosition.y);
    }
  };

  // Global mouse event listeners for dragging
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset, localPosition]);

  // Touch support
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isEditMode) return;
    e.stopPropagation();
    
    const touch = e.touches[0];
    const rect = elementRef.current?.getBoundingClientRect();
    if (!rect) return;

    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height;
    
    setDragOffset({
      x: (touch.clientX - centerX) / canvasScale,
      y: (touch.clientY - centerY) / canvasScale,
    });
    setIsDragging(true);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging || !elementRef.current) return;
    e.preventDefault();

    const touch = e.touches[0];
    const canvas = elementRef.current.closest('.room-canvas');
    if (!canvas) return;

    const canvasRect = canvas.getBoundingClientRect();
    
    const relativeX = (touch.clientX - canvasRect.left) / canvasScale - dragOffset.x;
    const relativeY = (touch.clientY - canvasRect.top) / canvasScale - dragOffset.y;

    const clamped = clampToFloor(relativeX, relativeY);
    setLocalPosition(clamped);
  };

  const handleTouchEnd = () => {
    if (isDragging) {
      setIsDragging(false);
      onPositionChange(placement.id, localPosition.x, localPosition.y);
    }
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleTouchEnd);
      return () => {
        window.removeEventListener('touchmove', handleTouchMove);
        window.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, dragOffset, localPosition]);

  const handleRotateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    onRotate(placement.id, rotation);
  };

  return (
    <div
      ref={elementRef}
      className={cn(
        "absolute transition-shadow select-none",
        isDragging && "opacity-90 z-[1000]",
        isEditMode && !isDragging && "cursor-grab hover:ring-2 hover:ring-primary/50 hover:ring-offset-2 rounded-lg",
        isDragging && "cursor-grabbing"
      )}
      style={{
        left: localPosition.x,
        top: localPosition.y,
        transform: `translate(-50%, -100%) rotate(${rotation}deg)`,
        zIndex: isDragging ? 1000 : calculateZIndex(localPosition.y),
        width: scaledWidth,
        height: scaledHeight,
        touchAction: isEditMode ? 'none' : 'auto',
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {/* Furniture sprite */}
      {SpriteComponent ? (
        <SpriteComponent
          width={scaledWidth}
          height={scaledHeight}
          className={cn(
            "drop-shadow-md transition-transform",
            isDragging && "scale-105"
          )}
        />
      ) : (
        <span
          className="flex items-center justify-center"
          style={{ fontSize: Math.min(scaledWidth, scaledHeight) * 0.8 }}
        >
          {placement.furniture.image_url}
        </span>
      )}

      {/* Edit mode controls */}
      {isEditMode && !isDragging && (
        <>
          {/* Rotate button */}
          <button
            onClick={handleRotateClick}
            className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-1 shadow-lg hover:bg-primary/90 transition-colors z-10"
            title="Rotate 90°"
          >
            <RotateCw className="h-3 w-3" />
          </button>
          
          {/* Move indicator */}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-muted/80 text-muted-foreground rounded px-1 py-0.5 text-[8px] flex items-center gap-0.5">
            <Move className="h-2 w-2" />
          </div>
        </>
      )}

      {/* Floor shadow */}
      <div
        className={cn(
          "absolute left-1/2 -translate-x-1/2 rounded-full bg-black/10 blur-sm transition-all",
          isDragging && "bg-black/20 blur-md"
        )}
        style={{
          bottom: -4,
          width: scaledWidth * 0.7,
          height: scaledHeight * 0.1,
          transform: `translateX(-50%) rotate(-${rotation}deg)`,
        }}
      />
    </div>
  );
}

import { useRef, useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { ResizeHandle } from "./ResizeHandle";
import { BlockRenderer } from "./blocks/BlockRenderer";
import { useBlockContent } from "@/hooks/useBlockContent";
import { useIsMobile } from "@/hooks/use-mobile";
import { GripHorizontal, Trash2 } from "lucide-react";
import type { SpaceBlock as SpaceBlockType } from "@/hooks/useSpaceBlocks";

const GRID_SNAP = 20;
const snap = (v: number) => Math.round(v / GRID_SNAP) * GRID_SNAP;
const LONG_PRESS_MS = 500;
const MOVE_THRESHOLD = 8;

const BLOCK_COLORS: Record<string, string> = {
  title: "#4a4a4a", subtitle: "#6b6b6b", sticky_note: "#e8c840",
  numbered_list: "#5a7a5a", checklist: "#4a7c6a", photo: "#7c6a9e",
  youtube: "#cc3333", song: "#7c6a9e", worship_set: "#b8902a",
  link: "#3a6b8a", file: "#6b6560", business_card: "#8b5e52",
};

function isInteractiveElement(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === "input" || tag === "textarea" || tag === "button" || tag === "select") return true;
  if (el.isContentEditable) return true;
  if (el.closest("iframe")) return true;
  return false;
}

interface SpaceBlockProps {
  block: SpaceBlockType;
  isOwner: boolean;
  isSelected: boolean;
  isEditMode: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<SpaceBlockType>) => void;
  onDelete?: () => void;
  spaceId: string;
}

export function SpaceBlock({ block, isOwner, isSelected, isEditMode, onSelect, onUpdate, onDelete, spaceId }: SpaceBlockProps) {
  const color = BLOCK_COLORS[block.block_type] || "#6b6560";
  const { content, setContent } = useBlockContent(block.id, spaceId, block.content);
  const isMobile = useIsMobile();

  const [isHovered, setIsHovered] = useState(false);
  const [localPos, setLocalPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressPointerRef = useRef<{ pointerId: number; startX: number; startY: number; target: HTMLElement } | null>(null);

  const posX = localPos?.x ?? block.pos_x;
  const posY = localPos?.y ?? block.pos_y;

  const canDrag = isOwner && isEditMode;

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
    longPressPointerRef.current = null;
  }, []);

  // Desktop grip-handle drag
  const handleDragPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    onSelect();
    if (!canDrag) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: block.pos_x, origY: block.pos_y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
  }, [canDrag, block.pos_x, block.pos_y, onSelect]);

  // Pointer down on the block itself
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    onSelect();

    if (!canDrag || !isMobile) return;
    if (isInteractiveElement(e.target)) return;

    // Start long-press timer for mobile drag
    const el = e.currentTarget as HTMLElement;
    longPressPointerRef.current = { pointerId: e.pointerId, startX: e.clientX, startY: e.clientY, target: el };

    longPressTimer.current = setTimeout(() => {
      if (!longPressPointerRef.current) return;
      const ref = longPressPointerRef.current;
      // Activate drag
      el.setPointerCapture(ref.pointerId);
      dragRef.current = { startX: ref.startX, startY: ref.startY, origX: block.pos_x, origY: block.pos_y };
      setIsDragging(true);
      longPressPointerRef.current = null;
    }, LONG_PRESS_MS);
  }, [canDrag, isMobile, block.pos_x, block.pos_y, onSelect]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    // Cancel long-press if finger moved too much
    if (longPressPointerRef.current) {
      const dx = Math.abs(e.clientX - longPressPointerRef.current.startX);
      const dy = Math.abs(e.clientY - longPressPointerRef.current.startY);
      if (dx > MOVE_THRESHOLD || dy > MOVE_THRESHOLD) {
        clearLongPress();
      }
    }

    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setLocalPos({
      x: Math.max(0, snap(dragRef.current.origX + dx)),
      y: Math.max(0, snap(dragRef.current.origY + dy)),
    });
  }, [clearLongPress]);

  const handlePointerUp = useCallback(() => {
    clearLongPress();
    if (dragRef.current && localPos) {
      onUpdate({ pos_x: localPos.x, pos_y: localPos.y });
      setLocalPos(null);
    }
    dragRef.current = null;
    setIsDragging(false);
  }, [localPos, onUpdate, clearLongPress]);

  const handlePointerCancel = useCallback(() => {
    clearLongPress();
    dragRef.current = null;
    setLocalPos(null);
    setIsDragging(false);
  }, [clearLongPress]);

  const handleH = isMobile ? 24 : 20;

  return (
    <div
      className={cn(
        "absolute rounded-lg bg-white dark:bg-card border select-none transition-shadow overflow-visible",
        isSelected && "ring-2 ring-[#b8902a] shadow-lg",
        !isSelected && "shadow-sm",
        isDragging && "cursor-grabbing"
      )}
      style={{
        left: posX,
        top: posY,
        width: block.size_w,
        height: block.size_h,
        zIndex: isDragging ? 9999 : block.z_index,
        opacity: isDragging ? 0.85 : 1,
        transform: isDragging ? "rotate(0.3deg) scale(1.02)" : undefined,
        borderTopWidth: canDrag ? 0 : 4,
        borderTopColor: canDrag ? undefined : color,
        touchAction: canDrag ? "none" : undefined,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onPointerEnter={() => setIsHovered(true)}
      onPointerLeave={() => setIsHovered(false)}
    >
      {/* Drag handle — OUTSIDE block on TOP in edit mode */}
      {canDrag && (
        <div
          className="absolute left-0 right-0 z-20 flex items-center justify-center cursor-grab active:cursor-grabbing rounded-t-md"
          style={{
            top: -handleH,
            height: handleH,
            backgroundColor: color,
          }}
          onPointerDown={handleDragPointerDown}
        >
          <GripHorizontal className="text-white/90" size={isMobile ? 18 : 14} />
        </div>
      )}

      {/* Delete button — always in edit mode, on hover otherwise */}
      {isOwner && onDelete && (isEditMode || isHovered) && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="absolute -top-1 -right-1 z-30 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-md hover:scale-110 transition-transform"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      )}

      <div className="w-full h-full overflow-hidden rounded-lg">
        <BlockRenderer
          blockType={block.block_type}
          content={content}
          isOwner={isOwner}
          onContentChange={setContent}
        />
      </div>

      {isSelected && isOwner && isEditMode && (
        <ResizeHandle
          posX={block.pos_x}
          posY={block.pos_y}
          sizeW={block.size_w}
          sizeH={block.size_h}
          onResize={(updates) => onUpdate(updates)}
        />
      )}
    </div>
  );
}

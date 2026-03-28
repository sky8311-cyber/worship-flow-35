import { useRef, useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { ResizeHandle } from "./ResizeHandle";
import { BlockRenderer } from "./blocks/BlockRenderer";
import { useBlockContent } from "@/hooks/useBlockContent";
import { GripVertical } from "lucide-react";
import type { SpaceBlock as SpaceBlockType } from "@/hooks/useSpaceBlocks";

const GRID_SNAP = 20;
const snap = (v: number) => Math.round(v / GRID_SNAP) * GRID_SNAP;

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
  mobileLayout?: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<SpaceBlockType>) => void;
  spaceId: string;
}

export function SpaceBlock({ block, isOwner, isSelected, isEditMode, onSelect, onUpdate, spaceId }: SpaceBlockProps) {
  const color = BLOCK_COLORS[block.block_type] || "#6b6560";
  const { content, setContent } = useBlockContent(block.id, spaceId, block.content);

  const [localPos, setLocalPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const posX = localPos?.x ?? block.pos_x;
  const posY = localPos?.y ?? block.pos_y;

  const canDrag = isOwner && isEditMode;

  const handleDragPointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    onSelect();
    if (!canDrag) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: block.pos_x, origY: block.pos_y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
  }, [canDrag, block.pos_x, block.pos_y, onSelect]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    onSelect();
  }, [onSelect]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setLocalPos({
      x: Math.max(0, snap(dragRef.current.origX + dx)),
      y: Math.max(0, snap(dragRef.current.origY + dy)),
    });
  }, []);

  const handlePointerUp = useCallback(() => {
    if (dragRef.current && localPos) {
      onUpdate({ pos_x: localPos.x, pos_y: localPos.y });
      setLocalPos(null);
    }
    dragRef.current = null;
    setIsDragging(false);
  }, [localPos, onUpdate]);

  const handleResize = useCallback((updates: Partial<SpaceBlockType>) => {
    onUpdate(updates);
  }, [onUpdate]);

  return (
    <div
      className={cn(
        "absolute rounded-lg bg-white dark:bg-card border overflow-hidden select-none transition-shadow",
        isSelected && "ring-2 ring-[#b8902a] shadow-lg overflow-visible",
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
        borderLeftWidth: 4,
        borderLeftColor: color,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Drag handle — only in edit mode */}
      {canDrag && (
        <div
          className="absolute left-0 top-0 bottom-0 w-5 z-20 flex items-center justify-center cursor-grab active:cursor-grabbing hover:brightness-110 transition-colors"
          style={{ backgroundColor: color + "33" }}
          onPointerDown={handleDragPointerDown}
        >
          <GripVertical className="h-3.5 w-3.5 text-white/80" />
        </div>
      )}

      <BlockRenderer
        blockType={block.block_type}
        content={content}
        isOwner={isOwner}
        onContentChange={setContent}
      />

      {isSelected && isOwner && isEditMode && (
        <ResizeHandle
          posX={block.pos_x}
          posY={block.pos_y}
          sizeW={block.size_w}
          sizeH={block.size_h}
          onResize={handleResize}
        />
      )}
    </div>
  );
}

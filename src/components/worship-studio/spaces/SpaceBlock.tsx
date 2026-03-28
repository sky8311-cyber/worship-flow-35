import { useRef, useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { ResizeHandle } from "./ResizeHandle";
import { BlockRenderer } from "./blocks/BlockRenderer";
import { useBlockContent } from "@/hooks/useBlockContent";
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
  onSelect: () => void;
  onUpdate: (updates: Partial<SpaceBlockType>) => void;
  spaceId: string;
}

export function SpaceBlock({ block, isOwner, isSelected, onSelect, onUpdate, spaceId }: SpaceBlockProps) {
  const color = BLOCK_COLORS[block.block_type] || "#6b6560";
  const { content, setContent } = useBlockContent(block.id, spaceId, block.content);

  // Local optimistic state for drag
  const [localPos, setLocalPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);

  const posX = localPos?.x ?? block.pos_x;
  const posY = localPos?.y ?? block.pos_y;

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.stopPropagation();
    onSelect();
    if (!isOwner) return;
    if (isInteractiveElement(e.target)) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: block.pos_x, origY: block.pos_y };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setIsDragging(true);
  }, [isOwner, block.pos_x, block.pos_y, onSelect]);

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
        isOwner && !isDragging && "cursor-grab",
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
      <BlockRenderer
        blockType={block.block_type}
        content={content}
        isOwner={isOwner}
        onContentChange={setContent}
      />

      {isSelected && isOwner && (
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

import { useRef, useCallback, useState } from "react";
import { Music, Calendar, BookOpen, Heart, Mic, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SpaceBlock as SpaceBlockType } from "@/hooks/useSpaceBlocks";

const BLOCK_META: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  song: { icon: <Music className="h-3.5 w-3.5" />, label: "Song", color: "#7c6a9e" },
  worship_set: { icon: <Calendar className="h-3.5 w-3.5" />, label: "Set", color: "#b8902a" },
  scripture: { icon: <BookOpen className="h-3.5 w-3.5" />, label: "Scripture", color: "#4a7c6a" },
  prayer_note: { icon: <Heart className="h-3.5 w-3.5" />, label: "Prayer", color: "#8b5e52" },
  audio: { icon: <Mic className="h-3.5 w-3.5" />, label: "Audio", color: "#3a6b8a" },
  note: { icon: <StickyNote className="h-3.5 w-3.5" />, label: "Note", color: "#6b6560" },
};

interface SpaceBlockProps {
  block: SpaceBlockType;
  isOwner: boolean;
  isSelected: boolean;
  zoom: number;
  onSelect: () => void;
  onUpdate: (updates: Partial<SpaceBlockType>) => void;
}

export function SpaceBlock({ block, isOwner, isSelected, zoom, onSelect, onUpdate }: SpaceBlockProps) {
  const meta = BLOCK_META[block.block_type] || BLOCK_META.note;
  const content = (block.content || {}) as Record<string, any>;

  // Local drag state
  const [localPos, setLocalPos] = useState<{ x: number; y: number } | null>(null);
  const [localSize, setLocalSize] = useState<{ w: number; h: number } | null>(null);
  const dragRef = useRef<{ startX: number; startY: number; origX: number; origY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; origW: number; origH: number } | null>(null);

  const posX = localPos?.x ?? block.pos_x;
  const posY = localPos?.y ?? block.pos_y;
  const sizeW = localSize?.w ?? block.size_w;
  const sizeH = localSize?.h ?? block.size_h;

  // Drag
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!isOwner) { onSelect(); return; }
    e.stopPropagation();
    onSelect();
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: block.pos_x, origY: block.pos_y };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [isOwner, block.pos_x, block.pos_y, onSelect]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (resizeRef.current) {
      const dx = (e.clientX - resizeRef.current.startX) / zoom;
      const dy = (e.clientY - resizeRef.current.startY) / zoom;
      setLocalSize({
        w: Math.max(100, Math.round((resizeRef.current.origW + dx) / 10) * 10),
        h: Math.max(80, Math.round((resizeRef.current.origH + dy) / 10) * 10),
      });
      return;
    }
    if (!dragRef.current) return;
    const dx = (e.clientX - dragRef.current.startX) / zoom;
    const dy = (e.clientY - dragRef.current.startY) / zoom;
    setLocalPos({
      x: Math.round((dragRef.current.origX + dx) / 10) * 10,
      y: Math.round((dragRef.current.origY + dy) / 10) * 10,
    });
  }, [zoom]);

  const handlePointerUp = useCallback(() => {
    if (resizeRef.current && localSize) {
      onUpdate({ size_w: localSize.w, size_h: localSize.h });
      setLocalSize(null);
      resizeRef.current = null;
      return;
    }
    if (dragRef.current && localPos) {
      onUpdate({ pos_x: localPos.x, pos_y: localPos.y });
      setLocalPos(null);
    }
    dragRef.current = null;
  }, [localPos, localSize, onUpdate]);

  // Resize handle
  const handleResizeDown = useCallback((e: React.PointerEvent) => {
    if (!isOwner) return;
    e.stopPropagation();
    resizeRef.current = { startX: e.clientX, startY: e.clientY, origW: block.size_w, origH: block.size_h };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [isOwner, block.size_w, block.size_h]);

  // Content preview
  const preview = content.title || content.reference || content.text || content.theme || "";

  return (
    <div
      className={cn(
        "absolute rounded-lg bg-white dark:bg-card shadow-sm border overflow-hidden select-none",
        isSelected && "ring-2 ring-blue-400",
        isOwner && "cursor-move"
      )}
      style={{
        left: posX,
        top: posY,
        width: sizeW,
        height: sizeH,
        zIndex: block.z_index,
        borderLeftWidth: 4,
        borderLeftColor: meta.color,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Header badge */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-border/30" style={{ color: meta.color }}>
        {meta.icon}
        <span className="text-[10px] font-medium uppercase tracking-wider">{meta.label}</span>
      </div>
      {/* Content preview */}
      <div className="px-2 py-1.5 text-xs text-muted-foreground line-clamp-4 overflow-hidden">
        {preview || <span className="italic opacity-50">Empty</span>}
      </div>

      {/* Resize handle */}
      {isOwner && (
        <div
          className="absolute bottom-0 right-0 w-3 h-3 cursor-se-resize"
          onPointerDown={handleResizeDown}
        >
          <svg viewBox="0 0 12 12" className="w-3 h-3 text-muted-foreground/40">
            <path d="M11 1v10H1" fill="none" stroke="currentColor" strokeWidth="1.5" />
            <path d="M11 5v6H5" fill="none" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </div>
      )}
    </div>
  );
}

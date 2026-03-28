import { useRef, useCallback, useState } from "react";
import {
  Type, StickyNote, ListOrdered, CheckSquare, Image, Youtube,
  Music, Calendar, Link, FileText, Contact,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ResizeHandle } from "./ResizeHandle";
import type { SpaceBlock as SpaceBlockType } from "@/hooks/useSpaceBlocks";

const GRID_SNAP = 20;
const snap = (v: number) => Math.round(v / GRID_SNAP) * GRID_SNAP;

const BLOCK_META: Record<string, { icon: React.ComponentType<{ className?: string }>; label: string; color: string }> = {
  title: { icon: Type, label: "제목", color: "#4a4a4a" },
  subtitle: { icon: Type, label: "부제목", color: "#6b6b6b" },
  sticky_note: { icon: StickyNote, label: "포스트잇", color: "#e8c840" },
  numbered_list: { icon: ListOrdered, label: "번호목록", color: "#5a7a5a" },
  checklist: { icon: CheckSquare, label: "체크리스트", color: "#4a7c6a" },
  photo: { icon: Image, label: "사진", color: "#7c6a9e" },
  youtube: { icon: Youtube, label: "유튜브", color: "#cc3333" },
  song: { icon: Music, label: "음악", color: "#7c6a9e" },
  worship_set: { icon: Calendar, label: "예배셋", color: "#b8902a" },
  link: { icon: Link, label: "링크", color: "#3a6b8a" },
  file: { icon: FileText, label: "파일", color: "#6b6560" },
  business_card: { icon: Contact, label: "명함", color: "#8b5e52" },
  note: { icon: StickyNote, label: "노트", color: "#6b6560" },
  scripture: { icon: FileText, label: "말씀", color: "#4a7c6a" },
  prayer_note: { icon: Type, label: "기도", color: "#8b5e52" },
  audio: { icon: Music, label: "오디오", color: "#3a6b8a" },
};

interface SpaceBlockProps {
  block: SpaceBlockType;
  isOwner: boolean;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<SpaceBlockType>) => void;
}

export function SpaceBlock({ block, isOwner, isSelected, onSelect, onUpdate }: SpaceBlockProps) {
  const meta = BLOCK_META[block.block_type] || BLOCK_META.note;
  const Icon = meta.icon;

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
        "absolute rounded-lg bg-white dark:bg-card border overflow-visible select-none transition-shadow",
        isSelected && "ring-2 ring-[#b8902a] shadow-lg",
        !isSelected && "shadow-sm",
        isOwner && "cursor-grab",
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
        borderLeftColor: meta.color,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Block content placeholder */}
      <div className="flex flex-col items-center justify-center h-full gap-2 p-3">
        <Icon className="h-6 w-6" style={{ color: meta.color }} />
        <span className="text-xs font-medium" style={{ color: meta.color }}>{meta.label}</span>
      </div>

      {/* Resize handles — only when selected & owner */}
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

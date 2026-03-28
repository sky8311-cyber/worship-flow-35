import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslation } from "@/hooks/useTranslation";
import { GripVertical, Trash2, Music, Calendar, BookOpen, Heart, Mic, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CanvasBlock } from "@/hooks/useCanvas";
import type { BlockType } from "@/hooks/useStudioPosts";

const BLOCK_TYPE_COLORS: Record<BlockType, string> = {
  song: "#7c6a9e",
  worship_set: "#b8902a",
  scripture: "#4a7c6a",
  prayer_note: "#8b5e52",
  audio: "#3a6b8a",
  note: "#6b6560",
};

const BLOCK_TYPE_LABELS: Record<BlockType, { ko: string; en: string }> = {
  song: { ko: "곡", en: "Song" },
  worship_set: { ko: "워십셋", en: "Set" },
  scripture: { ko: "말씀", en: "Scripture" },
  prayer_note: { ko: "기도노트", en: "Prayer" },
  audio: { ko: "오디오", en: "Audio" },
  note: { ko: "노트", en: "Note" },
};

const BLOCK_TYPE_ICONS: Record<BlockType, React.ReactNode> = {
  song: <Music className="h-3.5 w-3.5" />,
  worship_set: <Calendar className="h-3.5 w-3.5" />,
  scripture: <BookOpen className="h-3.5 w-3.5" />,
  prayer_note: <Heart className="h-3.5 w-3.5" />,
  audio: <Mic className="h-3.5 w-3.5" />,
  note: <StickyNote className="h-3.5 w-3.5" />,
};

interface SortableCanvasBlockProps {
  block: CanvasBlock;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (content: Record<string, any>) => void;
  onRemove: () => void;
}

export function SortableCanvasBlock({
  block,
  isSelected,
  onSelect,
  onUpdate,
  onRemove,
}: SortableCanvasBlockProps) {
  const { language } = useTranslation();
  const blockType = (block.block_type || "note") as BlockType;
  const borderColor = BLOCK_TYPE_COLORS[blockType];

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    rotate: isDragging ? "0.5deg" : "0deg",
  };

  const content = block.content as Record<string, any>;

  // Get display text for the block
  const displayText = content?.text || content?.title || content?.reference || "";

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onSelect}
      className={cn(
        "group relative bg-[#fefcf8] dark:bg-card rounded-lg p-4 cursor-pointer transition-all",
        isDragging && "shadow-xl",
        isSelected
          ? "ring-2 ring-[#b8902a]/50 shadow-md"
          : "shadow-sm hover:shadow-md"
      )}
      {...attributes}
    >
      {/* Left border */}
      <div
        className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
        style={{ backgroundColor: borderColor }}
      />

      {/* Drag handle */}
      <div
        {...listeners}
        className="absolute left-2 top-1/2 -translate-y-1/2 md:opacity-0 md:group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground/50" />
      </div>

      {/* Delete button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="absolute right-2 top-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10"
      >
        <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
      </button>

      {/* Content */}
      <div className="pl-6 pr-6">
        {/* Block type badge */}
        <div
          className="flex items-center gap-1.5 text-[10px] mb-2"
          style={{ color: borderColor }}
        >
          {BLOCK_TYPE_ICONS[blockType]}
          <span>
            {language === "ko"
              ? BLOCK_TYPE_LABELS[blockType].ko
              : BLOCK_TYPE_LABELS[blockType].en}
          </span>
        </div>

        {/* Block content preview */}
        {displayText ? (
          <p className="text-sm text-foreground/80 line-clamp-3">
            {displayText}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground/40 italic">
            {language === "ko" ? "내용을 입력하세요..." : "Enter content..."}
          </p>
        )}
      </div>
    </div>
  );
}

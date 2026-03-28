import { useEffect, useRef } from "react";
import { Music, Calendar, BookOpen, Heart, Mic, StickyNote } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

const BLOCK_OPTIONS = [
  { value: "song", icon: <Music className="h-4 w-4" />, label: "곡", labelEn: "Song", color: "#7c6a9e" },
  { value: "worship_set", icon: <Calendar className="h-4 w-4" />, label: "워십셋", labelEn: "Set", color: "#b8902a" },
  { value: "scripture", icon: <BookOpen className="h-4 w-4" />, label: "말씀", labelEn: "Scripture", color: "#4a7c6a" },
  { value: "prayer_note", icon: <Heart className="h-4 w-4" />, label: "기도", labelEn: "Prayer", color: "#8b5e52" },
  { value: "audio", icon: <Mic className="h-4 w-4" />, label: "오디오", labelEn: "Audio", color: "#3a6b8a" },
  { value: "note", icon: <StickyNote className="h-4 w-4" />, label: "노트", labelEn: "Note", color: "#6b6560" },
];

interface BlockAddMenuProps {
  position: { x: number; y: number };
  onAdd: (blockType: string) => void;
  onClose: () => void;
}

export function BlockAddMenu({ position, onAdd, onClose }: BlockAddMenuProps) {
  const { language } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={ref}
      className="absolute z-50 bg-white dark:bg-card rounded-lg shadow-lg border border-border/50 p-2 grid grid-cols-3 gap-1.5 w-[180px]"
      style={{ left: position.x, top: position.y }}
    >
      {BLOCK_OPTIONS.map(opt => (
        <button
          key={opt.value}
          onClick={() => onAdd(opt.value)}
          className="flex flex-col items-center gap-1 p-2 rounded-md hover:bg-accent/50 transition-colors"
        >
          <span style={{ color: opt.color }}>{opt.icon}</span>
          <span className="text-[9px] text-muted-foreground">{language === "ko" ? opt.label : opt.labelEn}</span>
        </button>
      ))}
    </div>
  );
}

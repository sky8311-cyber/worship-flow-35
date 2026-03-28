import { useTranslation } from "@/hooks/useTranslation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Music, Calendar, BookOpen, Heart, Mic, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";
import type { BlockType } from "@/hooks/useStudioPosts";

interface BlockTypeSelectorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (blockType: BlockType) => void;
}

const BLOCK_OPTIONS: { value: BlockType; icon: React.ReactNode; label: string; labelEn: string; color: string }[] = [
  { value: "song", icon: <Music className="h-6 w-6" />, label: "♩ 곡", labelEn: "♩ Song", color: "#7c6a9e" },
  { value: "worship_set", icon: <Calendar className="h-6 w-6" />, label: "✦ 워십셋", labelEn: "✦ Set", color: "#b8902a" },
  { value: "scripture", icon: <BookOpen className="h-6 w-6" />, label: "📖 말씀", labelEn: "📖 Scripture", color: "#4a7c6a" },
  { value: "prayer_note", icon: <Heart className="h-6 w-6" />, label: "✦ 기도노트", labelEn: "✦ Prayer", color: "#8b5e52" },
  { value: "audio", icon: <Mic className="h-6 w-6" />, label: "◉ 오디오", labelEn: "◉ Audio", color: "#3a6b8a" },
  { value: "note", icon: <StickyNote className="h-6 w-6" />, label: "▪ 노트", labelEn: "▪ Note", color: "#6b6560" },
];

export function BlockTypeSelector({ open, onOpenChange, onSelect }: BlockTypeSelectorProps) {
  const { language } = useTranslation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-[#fefcf8] dark:bg-card">
        <DialogHeader>
          <DialogTitle className="font-serif text-lg text-center">
            {language === "ko" ? "어떤 블록을 만들까요?" : "What block will you create?"}
          </DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-3 gap-3 py-4">
          {BLOCK_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => {
                onSelect(opt.value);
                onOpenChange(false);
              }}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border border-border/50",
                "hover:border-[#b8902a] hover:bg-[#b8902a]/5 transition-all"
              )}
            >
              <span style={{ color: opt.color }}>{opt.icon}</span>
              <span className="text-xs font-medium text-foreground/80">
                {language === "ko" ? opt.label : opt.labelEn}
              </span>
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

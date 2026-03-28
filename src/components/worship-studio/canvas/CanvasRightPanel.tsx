import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Music, Calendar, BookOpen, Heart, Mic, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CanvasBlock } from "@/hooks/useCanvas";
import type { BlockType } from "@/hooks/useStudioPosts";

const BLOCK_OPTIONS: { value: BlockType; icon: React.ReactNode; label: string; labelEn: string; color: string }[] = [
  { value: "song", icon: <Music className="h-5 w-5" />, label: "곡", labelEn: "Song", color: "#7c6a9e" },
  { value: "worship_set", icon: <Calendar className="h-5 w-5" />, label: "워십셋", labelEn: "Set", color: "#b8902a" },
  { value: "scripture", icon: <BookOpen className="h-5 w-5" />, label: "말씀", labelEn: "Scripture", color: "#4a7c6a" },
  { value: "prayer_note", icon: <Heart className="h-5 w-5" />, label: "기도", labelEn: "Prayer", color: "#8b5e52" },
  { value: "audio", icon: <Mic className="h-5 w-5" />, label: "오디오", labelEn: "Audio", color: "#3a6b8a" },
  { value: "note", icon: <StickyNote className="h-5 w-5" />, label: "노트", labelEn: "Note", color: "#6b6560" },
];

interface CanvasRightPanelProps {
  selectedBlock: CanvasBlock | null;
  onAddBlock: (blockType: BlockType) => void;
  onUpdateBlock: (id: string, content: Record<string, any>, blockType?: BlockType) => void;
  isMobile?: boolean;
}

export function CanvasRightPanel({ selectedBlock, onAddBlock, onUpdateBlock, isMobile }: CanvasRightPanelProps) {
  const { language } = useTranslation();

  return (
    <div className={cn(
      "bg-[#faf7f2] dark:bg-background flex flex-col shrink-0",
      isMobile ? "w-full" : "w-[280px] border-l border-border/40"
    )}>
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Section 1: Add blocks */}
          <div>
            <h3 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
              {language === "ko" ? "블록 추가" : "Add Block"}
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {BLOCK_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => onAddBlock(opt.value)}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-lg border border-border/50 hover:border-[#b8902a]/50 hover:bg-[#b8902a]/5 transition-all"
                >
                  <span style={{ color: opt.color }}>{opt.icon}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {language === "ko" ? opt.label : opt.labelEn}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Block properties */}
          {selectedBlock && (
            <div className="border-t border-border/40 pt-4">
              <h3 className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wider">
                {language === "ko" ? "블록 속성" : "Block Properties"}
              </h3>
              <BlockPropertyForm
                block={selectedBlock}
                onUpdate={(content) => onUpdateBlock(selectedBlock.id, content)}
              />
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}

function BlockPropertyForm({ block, onUpdate }: { block: CanvasBlock; onUpdate: (content: Record<string, any>) => void }) {
  const { language } = useTranslation();
  const content = (block.content || {}) as Record<string, any>;
  const blockType = block.block_type as BlockType;

  const handleChange = (key: string, value: string) => {
    onUpdate({ ...content, [key]: value });
  };

  switch (blockType) {
    case "song":
      return (
        <div className="space-y-3">
          <Field label={language === "ko" ? "곡 제목" : "Title"} value={content.title || ""} onChange={(v) => handleChange("title", v)} />
          <Field label={language === "ko" ? "키" : "Key"} value={content.key || ""} onChange={(v) => handleChange("key", v)} placeholder="G, A, Bb..." />
          <Field label={language === "ko" ? "BPM" : "BPM"} value={content.bpm || ""} onChange={(v) => handleChange("bpm", v)} type="number" />
          <Field label={language === "ko" ? "테마" : "Theme"} value={content.theme || ""} onChange={(v) => handleChange("theme", v)} />
        </div>
      );

    case "scripture":
      return (
        <div className="space-y-3">
          <Field label={language === "ko" ? "구절" : "Reference"} value={content.reference || ""} onChange={(v) => handleChange("reference", v)} placeholder="요 3:16" />
          <FieldArea label={language === "ko" ? "본문" : "Text"} value={content.text || ""} onChange={(v) => handleChange("text", v)} />
        </div>
      );

    case "prayer_note":
      return (
        <div className="space-y-3">
          <div>
            <Label className="text-xs">{language === "ko" ? "유형" : "Type"}</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {["중보", "감사", "고백", "찬양"].map(t => (
                <button
                  key={t}
                  onClick={() => handleChange("prayer_type", t)}
                  className={cn(
                    "px-2 py-1 rounded text-[10px] border transition-colors",
                    content.prayer_type === t
                      ? "border-[#b8902a] bg-[#b8902a]/10 text-[#b8902a]"
                      : "border-border text-muted-foreground"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <FieldArea label={language === "ko" ? "내용" : "Content"} value={content.text || ""} onChange={(v) => handleChange("text", v)} />
        </div>
      );

    case "worship_set":
      return (
        <div className="space-y-3">
          <Field label={language === "ko" ? "테마" : "Theme"} value={content.theme || ""} onChange={(v) => handleChange("theme", v)} />
          <FieldArea label={language === "ko" ? "흐름" : "Flow"} value={content.flow || ""} onChange={(v) => handleChange("flow", v)} />
        </div>
      );

    case "audio":
      return (
        <div className="space-y-3">
          <Field label={language === "ko" ? "제목" : "Title"} value={content.title || ""} onChange={(v) => handleChange("title", v)} />
          <Field label="URL" value={content.url || ""} onChange={(v) => handleChange("url", v)} placeholder="https://..." />
        </div>
      );

    case "note":
    default:
      return (
        <div className="space-y-3">
          <FieldArea label={language === "ko" ? "내용" : "Content"} value={content.text || ""} onChange={(v) => handleChange("text", v)} />
        </div>
      );
  }
}

function Field({ label, value, onChange, placeholder, type }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        className="h-8 text-sm"
      />
    </div>
  );
}

function FieldArea({ label, value, onChange }: {
  label: string; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[80px] text-sm resize-none"
      />
    </div>
  );
}

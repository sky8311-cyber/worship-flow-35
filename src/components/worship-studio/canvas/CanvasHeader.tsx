import { useState, useRef, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { WorkflowStage } from "@/hooks/useStudioPosts";

interface CanvasHeaderProps {
  title: string | null;
  stage: WorkflowStage;
  onTitleChange: (title: string) => void;
  onStageChange: (stage: WorkflowStage) => void;
  onPublish: () => void;
  onBack: () => void;
}

const STAGES: { value: WorkflowStage; labelKo: string; labelEn: string }[] = [
  { value: "draft", labelKo: "초안", labelEn: "Draft" },
  { value: "in_progress", labelKo: "진행중", labelEn: "In Progress" },
  { value: "refined", labelKo: "완성", labelEn: "Refined" },
];

export function CanvasHeader({ title, stage, onTitleChange, onStageChange, onPublish, onBack }: CanvasHeaderProps) {
  const { language } = useTranslation();
  const isMobile = useIsMobile();
  const [editingTitle, setEditingTitle] = useState(title || "");
  const titleRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setEditingTitle(title || "");
  }, [title]);

  const handleTitleChange = (value: string) => {
    setEditingTitle(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onTitleChange(value);
    }, 800);
  };

  return (
    <header className="border-b border-border/40 bg-[#faf7f2] dark:bg-background relative z-10">
      {/* Row 1: back + title + publish */}
      <div className="flex items-center gap-2 px-3 py-2">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9 shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <input
          ref={titleRef}
          value={editingTitle}
          onChange={(e) => handleTitleChange(e.target.value)}
          placeholder={language === "ko" ? "캔버스 제목..." : "Canvas title..."}
          className="flex-1 text-base font-serif bg-transparent border-none outline-none placeholder:text-muted-foreground/40 min-w-0"
        />

        {/* Stage selector — desktop inline */}
        {!isMobile && (
          <div className="flex items-center gap-1 shrink-0">
            {STAGES.map(s => (
              <button
                key={s.value}
                onClick={() => onStageChange(s.value)}
                className={cn(
                  "px-2 py-1 rounded text-[11px] transition-colors",
                  stage === s.value
                    ? "bg-[#b8902a]/10 text-[#b8902a] font-medium"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {language === "ko" ? s.labelKo : s.labelEn}
              </button>
            ))}
          </div>
        )}

        <Button
          size={isMobile ? "icon" : "sm"}
          onClick={onPublish}
          className="bg-[#b8902a] hover:bg-[#a07d24] text-white shrink-0 gap-1.5"
        >
          <Send className="h-3.5 w-3.5" />
          {!isMobile && (language === "ko" ? "발행" : "Publish")}
        </Button>
      </div>

      {/* Row 2: Stage selector — mobile only */}
      {isMobile && (
        <div className="flex items-center justify-center gap-1 px-3 pb-2">
          {STAGES.map(s => (
            <button
              key={s.value}
              onClick={() => onStageChange(s.value)}
              className={cn(
                "px-3 py-1 rounded-full text-[11px] transition-colors",
                stage === s.value
                  ? "bg-[#b8902a]/10 text-[#b8902a] font-medium"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              {language === "ko" ? s.labelKo : s.labelEn}
            </button>
          ))}
        </div>
      )}
    </header>
  );
}

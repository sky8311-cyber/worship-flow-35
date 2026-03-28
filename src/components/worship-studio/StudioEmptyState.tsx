import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { PenLine, Users } from "lucide-react";

interface StudioEmptyStateProps {
  type: "studio" | "feed";
  onAction?: () => void;
  onHelp?: () => void;
}

export function StudioEmptyState({ type, onAction, onHelp }: StudioEmptyStateProps) {
  const { language } = useTranslation();
  
  if (type === "studio") {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center min-h-[60vh]">
        <span className="text-lg text-muted-foreground mb-8">✦</span>
        
        <div className="space-y-1 mb-3">
          <p className="text-xl font-light tracking-wide text-foreground/80 italic">
            {language === "ko" ? "예배는 무대가 아닌 삶입니다." : "Worship is not a stage, it is life."}
          </p>
          <p className="text-xl font-light tracking-wide text-foreground/80 italic">
            {language === "ko" ? "삶이 예배가 될 때 사역이 빚어집니다." : "As life becomes worship, ministry takes shape."}
          </p>
        </div>
        
        <p className="text-sm text-muted-foreground text-center mt-2 mb-10 max-w-sm">
          {language === "ko"
            ? "이 스튜디오는 그 여정이 기록되고 나눠지는 곳입니다."
            : "This studio is where that journey is written and shared."}
        </p>
        
        {onAction && (
          <Button variant="outline" onClick={onAction} className="gap-2 border-[#b8902a] text-[#b8902a] hover:bg-[#b8902a] hover:text-white">
            {language === "ko" ? "첫 기록 시작하기 →" : "Start your first entry →"}
          </Button>
        )}
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center py-20 px-6 text-center min-h-[60vh]">
      <span className="text-lg text-muted-foreground mb-8">✦</span>
      
      <p className="text-xl font-light tracking-wide text-foreground/80 italic mb-3">
        {language === "ko" ? "아직 흐름이 시작되지 않았습니다." : "The flow hasn't started yet."}
      </p>
      
      <p className="text-sm text-muted-foreground max-w-sm">
        {language === "ko"
          ? "친구와 앰버서더를 팔로우하여 그들의 기록, 기도, 배움을 만나보세요."
          : "Follow friends and ambassadors to discover their records, prayers, and learnings."}
      </p>
    </div>
  );
}

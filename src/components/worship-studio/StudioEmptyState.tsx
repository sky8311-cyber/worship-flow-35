import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { PenLine, Users, Sparkles, HelpCircle } from "lucide-react";

interface StudioEmptyStateProps {
  type: "studio" | "feed";
  onAction?: () => void;
  onHelp?: () => void;
}

export function StudioEmptyState({ type, onAction, onHelp }: StudioEmptyStateProps) {
  const { language } = useTranslation();
  
  if (type === "studio") {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6">
          <Sparkles className="h-10 w-10 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-3">
          {language === "ko" ? "예배는 일상에서 빚어집니다" : "Worship is shaped in daily life"}
        </h3>
        <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
          {language === "ko"
            ? "하나님이 오늘 빚어가시는 것들을 이곳에 하나씩 모아보세요—기도, 묵상, 노래, 감사. 이 공간은 당신만의 예배 아카이브입니다."
            : "Collect what God is forming in you—one prayer, one thought, one song, one thanksgiving at a time. This space is your personal worship archive."}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          {onAction && (
            <Button onClick={onAction} className="gap-2">
              <PenLine className="h-4 w-4" />
              {language === "ko" ? "공간 꾸미기 시작" : "Start decorating"}
            </Button>
          )}
          {onHelp && (
            <Button variant="outline" onClick={onHelp} className="gap-2">
              <HelpCircle className="h-4 w-4" />
              {language === "ko" ? "어떻게 쓸까요?" : "How to use?"}
            </Button>
          )}
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Users className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-xl font-semibold mb-2">
        {language === "ko" ? "아직 새 소식이 없습니다." : "No updates yet."}
      </h3>
      <p className="text-muted-foreground max-w-sm">
        {language === "ko"
          ? "친구와 앰버서더를 팔로우하여 최신 노트, 기도, 배움을 확인하세요."
          : "Follow friends and ambassadors to see their latest notes, prayers, and learnings."}
      </p>
    </div>
  );
}

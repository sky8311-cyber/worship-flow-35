import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { PenLine, Users } from "lucide-react";

interface StudioEmptyStateProps {
  type: "studio" | "feed";
  onAction?: () => void;
}

export function StudioEmptyState({ type, onAction }: StudioEmptyStateProps) {
  const { language } = useTranslation();
  
  if (type === "studio") {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <PenLine className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">
          {language === "ko" ? "스튜디오가 준비되었습니다." : "Your Studio is ready."}
        </h3>
        <p className="text-muted-foreground max-w-sm mb-6">
          {language === "ko"
            ? "예배는 일상에서 빚어집니다. 이 스튜디오에 하나님이 빚어가시는 것들을 하나씩 모아보세요—노트, 기도, 노래."
            : "Your worship is shaped in daily life. Use this Studio to collect what God is forming—one note, one prayer, one song at a time."}
        </p>
        {onAction && (
          <Button onClick={onAction}>
            <PenLine className="h-4 w-4 mr-2" />
            {language === "ko" ? "첫 노트 작성하기" : "Write your first note"}
          </Button>
        )}
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

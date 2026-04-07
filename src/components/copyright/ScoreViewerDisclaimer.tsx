import { useTranslation } from "@/hooks/useTranslation";
import { Info } from "lucide-react";

export const ScoreViewerDisclaimer = () => {
  const { language } = useTranslation();
  const isKo = language === "ko";

  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] text-muted-foreground bg-muted/50 rounded-md">
      <Info className="w-3 h-3 shrink-0" />
      <span>
        {isKo
          ? "이 콘텐츠는 사용자가 업로드한 자료입니다. 저작권 신고: hello@kworship.app"
          : "This content was uploaded by a user. Report copyright issues: hello@kworship.app"}
      </span>
    </div>
  );
};

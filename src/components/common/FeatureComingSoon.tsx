import { useNavigate } from "react-router-dom";
import { LucideIcon, ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";

interface FeatureComingSoonProps {
  featureName: string;
  featureNameKo?: string;
  description?: string;
  descriptionKo?: string;
  icon?: LucideIcon;
}

export function FeatureComingSoon({
  featureName,
  featureNameKo,
  description,
  descriptionKo,
  icon: Icon = Sparkles,
}: FeatureComingSoonProps) {
  const navigate = useNavigate();
  const { language } = useTranslation();
  const isKo = language === "ko";

  const displayName = isKo && featureNameKo ? featureNameKo : featureName;
  const displayDesc = isKo
    ? descriptionKo || "이 기능은 현재 준비 중입니다. 곧 만나보실 수 있습니다!"
    : description || "This feature is currently under development. Stay tuned!";

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center px-3 py-3 border-b border-border flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="flex-1 text-center text-sm font-semibold">
          {displayName}
        </span>
        <div className="w-9" />
      </header>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
          <Icon className="w-10 h-10 text-primary" />
        </div>

        <div className="space-y-2 max-w-sm">
          <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
          <p className="text-base text-muted-foreground leading-relaxed">
            {displayDesc}
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-full bg-accent/50 px-4 py-2 text-sm font-medium text-accent-foreground">
          <Sparkles className="w-4 h-4" />
          {isKo ? "준비 중" : "Coming Soon"}
        </div>

        <Button
          variant="outline"
          className="mt-4"
          onClick={() => navigate("/dashboard")}
        >
          {isKo ? "홈으로 돌아가기" : "Back to Home"}
        </Button>
      </div>
    </div>
  );
}

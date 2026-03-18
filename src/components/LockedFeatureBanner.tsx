import { Lock, Sparkles } from "lucide-react";
import { useTierFeature, TIER_CONFIG } from "@/hooks/useTierFeature";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LockedFeatureBannerProps {
  feature: string;
  message?: string;
  className?: string;
  compact?: boolean;
  onUpgrade?: () => void;
}

export function LockedFeatureBanner({ 
  feature, 
  message,
  className,
  compact = false,
}: LockedFeatureBannerProps) {
  const { getRequiredTier } = useTierFeature();
  const { language } = useTranslation();
  const requiredTier = getRequiredTier(feature);
  
  if (!requiredTier) return null;

  const config = TIER_CONFIG[requiredTier];
  const tierLabel = language === "ko" ? config.labelKo : config.label;

  if (compact) {
    return (
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 bg-muted/50 border rounded-md text-sm text-muted-foreground",
        className
      )}>
        <Lock className="w-4 h-4" />
        <span>
          {language === "ko" 
            ? `${tierLabel} 전용 기능` 
            : `${tierLabel} feature`}
        </span>
      </div>
    );
  }

  return (
    <div className={cn(
      "p-4 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg",
      className
    )}>
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary/10 rounded-full">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm">
            {message || (language === "ko" ? "프리미엄 기능" : "Premium Feature")}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {language === "ko" 
              ? `${tierLabel} 이상에서 이용 가능합니다` 
              : `Available for ${tierLabel} and above`}
          </p>
        </div>
        <Button size="sm" variant="outline" className="shrink-0">
          <Lock className="w-3 h-3 mr-1" />
          {language === "ko" ? "업그레이드" : "Upgrade"}
        </Button>
      </div>
    </div>
  );
}

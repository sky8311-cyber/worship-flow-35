import { ReactNode } from "react";
import { Lock } from "lucide-react";
import { useTierFeature, TierLevel, TIER_CONFIG } from "@/hooks/useTierFeature";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface FeatureGateProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
  showLockIcon?: boolean;
  className?: string;
}

export function FeatureGate({
  feature,
  children,
  fallback,
  showLockIcon = true,
  className,
}: FeatureGateProps) {
  const { hasFeature, getRequiredTier, isLoading } = useTierFeature();
  const { t, language } = useTranslation();

  if (isLoading) {
    return null; // Or a skeleton loader
  }

  if (hasFeature(feature)) {
    return <>{children}</>;
  }

  // User doesn't have access
  if (fallback) {
    return <>{fallback}</>;
  }

  // Default fallback with lock icon
  const requiredTier = getRequiredTier(feature);

  if (!showLockIcon) {
    return null;
  }

  return (
    <LockedFeatureIndicator 
      requiredTier={requiredTier} 
      className={className}
    />
  );
}

interface LockedFeatureIndicatorProps {
  requiredTier: TierLevel | null;
  className?: string;
  onUpgradeClick?: () => void;
}

export function LockedFeatureIndicator({
  requiredTier,
  className,
  onUpgradeClick,
}: LockedFeatureIndicatorProps) {
  const { language } = useTranslation();
  
  if (!requiredTier) return null;

  const config = TIER_CONFIG[requiredTier];
  const label = language === "ko" ? config.labelKo : config.label;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex items-center gap-1 px-2 py-1 rounded-md",
            "bg-muted/50 text-muted-foreground cursor-not-allowed",
            className
          )}
        >
          <Lock className="w-3 h-3" />
          <span className="text-xs">{label}</span>
        </span>
      </TooltipTrigger>
      <TooltipContent>
        <p>
          {language === "ko"
            ? `${label} 티어 이상 필요`
            : `Requires ${label} tier or higher`}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

// Wrapper for buttons that should show upgrade prompt
interface FeatureGatedButtonProps {
  feature: string;
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "default" | "secondary" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function FeatureGatedButton({
  feature,
  children,
  onClick,
  className,
  variant = "default",
  size = "default",
}: FeatureGatedButtonProps) {
  const { hasFeature, canUpgradeTo } = useTierFeature();
  const { language } = useTranslation();

  const hasAccess = hasFeature(feature);
  const upgradeTo = canUpgradeTo(feature);

  if (hasAccess) {
    return (
      <Button
        variant={variant}
        size={size}
        onClick={onClick}
        className={className}
      >
        {children}
      </Button>
    );
  }

  // Show locked button with upgrade hint
  const tierConfig = upgradeTo ? TIER_CONFIG[upgradeTo] : null;
  const tierLabel = tierConfig
    ? language === "ko"
      ? tierConfig.labelKo
      : tierConfig.label
    : "";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="outline"
          size={size}
          className={cn("opacity-60 cursor-not-allowed", className)}
          disabled
        >
          <Lock className="w-3 h-3 mr-1" />
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>
          {language === "ko"
            ? `${tierLabel}으로 업그레이드하여 이용하세요`
            : `Upgrade to ${tierLabel} to access this feature`}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

// Simple check component that returns boolean
export function useFeatureAccess(feature: string): boolean {
  const { hasFeature } = useTierFeature();
  return hasFeature(feature);
}

import { User, Crown, Star, Building2, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { TierLevel, TIER_CONFIG } from "@/hooks/useTierFeature";
import { useTranslation } from "@/hooks/useTranslation";

interface TierBadgeProps {
  tier: TierLevel;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const TIER_ICONS = {
  member: { primary: User, secondary: null },
  worship_leader: { primary: Crown, secondary: null },
  premium: { primary: Crown, secondary: Star },
  church: { primary: Building2, secondary: Shield },
} as const;

export function TierBadge({ 
  tier, 
  size = "md", 
  showLabel = true,
  className 
}: TierBadgeProps) {
  const { language } = useTranslation();
  const config = TIER_CONFIG[tier];
  const icons = TIER_ICONS[tier];
  
  const sizeClasses = {
    sm: "px-1.5 py-0.5 text-xs gap-1",
    md: "px-2 py-1 text-xs gap-1.5",
    lg: "px-3 py-1.5 text-sm gap-2",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-3.5 h-3.5",
    lg: "w-4 h-4",
  };

  const PrimaryIcon = icons.primary;
  const SecondaryIcon = icons.secondary;

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full font-medium whitespace-nowrap",
        config.color,
        sizeClasses[size],
        className
      )}
    >
      <span className="flex items-center gap-0.5">
        <PrimaryIcon className={iconSizes[size]} />
        {SecondaryIcon && (
          <SecondaryIcon className={cn(iconSizes[size], "opacity-80")} />
        )}
      </span>
      {showLabel && (
        <span>{language === "ko" ? config.labelKo : config.label}</span>
      )}
    </span>
  );
}

// Compact version for table rows
export function TierBadgeCompact({ tier }: { tier: TierLevel }) {
  return <TierBadge tier={tier} size="sm" showLabel={true} />;
}

// Icon-only version for tight spaces
export function TierIcon({ tier, className }: { tier: TierLevel; className?: string }) {
  const icons = TIER_ICONS[tier];
  const config = TIER_CONFIG[tier];
  const PrimaryIcon = icons.primary;
  
  return (
    <span className={cn("inline-flex items-center", className)}>
      <PrimaryIcon className={cn("w-4 h-4", config.color.split(" ")[1])} />
    </span>
  );
}

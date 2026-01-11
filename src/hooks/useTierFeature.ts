import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { usePremiumSubscription } from "./usePremiumSubscription";
import { useChurchSubscription } from "./useChurchSubscription";
import { supabase } from "@/integrations/supabase/client";

export const TIER_HIERARCHY = {
  member: 0,
  worship_leader: 1,
  premium: 2,
  church: 3,
} as const;

export type TierLevel = keyof typeof TIER_HIERARCHY;

export interface TierFeature {
  id: string;
  feature_key: string;
  feature_name: string;
  feature_name_ko: string | null;
  description: string | null;
  description_ko: string | null;
  category: string;
  tier_member: boolean;
  tier_worship_leader: boolean;
  tier_premium: boolean;
  tier_church: boolean;
  is_active: boolean;
  display_order: number;
}

export const TIER_CONFIG = {
  member: {
    label: "Team Member",
    labelKo: "팀 멤버",
    color: "bg-muted text-muted-foreground",
    borderColor: "border-muted-foreground/30",
  },
  worship_leader: {
    label: "Basic Member",
    labelKo: "기본 멤버",
    color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    borderColor: "border-purple-300 dark:border-purple-700",
  },
  premium: {
    label: "Full Member",
    labelKo: "정식 멤버",
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    borderColor: "border-yellow-300 dark:border-yellow-700",
  },
  church: {
    label: "Worship Community Account",
    labelKo: "예배 공동체 계정",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    borderColor: "border-blue-300 dark:border-blue-700",
  },
} as const;

export function useTierFeature() {
  const { user, isWorshipLeader } = useAuth();
  const { isSubscribed: isPremium } = usePremiumSubscription();
  const { isSubscriptionActive: isChurch } = useChurchSubscription();

  // Fetch all tier features
  const { data: features = [], isLoading: isFeaturesLoading } = useQuery({
    queryKey: ["tier-features"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tier_features")
        .select("*")
        .eq("is_active", true)
        .order("display_order");

      if (error) throw error;
      return data as TierFeature[];
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Determine user's highest tier
  const getUserTier = (): TierLevel => {
    if (isChurch) return "church";
    if (isPremium) return "premium";
    if (isWorshipLeader) return "worship_leader";
    return "member";
  };

  const tier = getUserTier();

  // Check if user has access to a specific feature
  const hasFeature = (featureKey: string): boolean => {
    const feature = features.find((f) => f.feature_key === featureKey);
    if (!feature) return false;

    switch (tier) {
      case "church":
        return feature.tier_church;
      case "premium":
        return feature.tier_premium;
      case "worship_leader":
        return feature.tier_worship_leader;
      case "member":
        return feature.tier_member;
      default:
        return false;
    }
  };

  // Get all features available to the current tier
  const getAvailableFeatures = (): TierFeature[] => {
    return features.filter((feature) => {
      switch (tier) {
        case "church":
          return feature.tier_church;
        case "premium":
          return feature.tier_premium;
        case "worship_leader":
          return feature.tier_worship_leader;
        case "member":
          return feature.tier_member;
        default:
          return false;
      }
    });
  };

  // Get features by category
  const getFeaturesByCategory = (category: string): TierFeature[] => {
    return features.filter((f) => f.category === category);
  };

  // Get required tier for a feature
  const getRequiredTier = (featureKey: string): TierLevel | null => {
    const feature = features.find((f) => f.feature_key === featureKey);
    if (!feature) return null;

    if (feature.tier_member) return "member";
    if (feature.tier_worship_leader) return "worship_leader";
    if (feature.tier_premium) return "premium";
    if (feature.tier_church) return "church";
    return null;
  };

  // Check if user can upgrade to access a feature
  const canUpgradeTo = (featureKey: string): TierLevel | null => {
    const requiredTier = getRequiredTier(featureKey);
    if (!requiredTier) return null;

    const currentLevel = TIER_HIERARCHY[tier];
    const requiredLevel = TIER_HIERARCHY[requiredTier];

    if (currentLevel >= requiredLevel) return null; // Already has access
    return requiredTier;
  };

  return {
    tier,
    features,
    hasFeature,
    getAvailableFeatures,
    getFeaturesByCategory,
    getRequiredTier,
    canUpgradeTo,
    isLoading: isFeaturesLoading,
    tierConfig: TIER_CONFIG[tier],
  };
}

// Utility function to determine tier from external data (for CRM)
export function determineTierFromData(data: {
  hasChurchAccount?: boolean;
  hasPremium?: boolean;
  isWorshipLeader?: boolean;
}): TierLevel {
  if (data.hasChurchAccount) return "church";
  if (data.hasPremium) return "premium";
  if (data.isWorshipLeader) return "worship_leader";
  return "member";
}

import { useState, useCallback } from "react";
import { useChurchSubscription } from "./useChurchSubscription";

type FeatureType = "church" | "rotation" | "roles" | "domain" | "branding";

interface FeatureGateResult {
  isFeatureAvailable: boolean;
  showUpgradePrompt: () => void;
  hideUpgradePrompt: () => void;
  isUpgradeDialogOpen: boolean;
}

export function useFeatureGate(feature: FeatureType): FeatureGateResult {
  const { isSubscriptionActive } = useChurchSubscription();
  const [isUpgradeDialogOpen, setIsUpgradeDialogOpen] = useState(false);

  // All church features require active subscription
  const isFeatureAvailable = isSubscriptionActive;

  const showUpgradePrompt = useCallback(() => {
    setIsUpgradeDialogOpen(true);
  }, []);

  const hideUpgradePrompt = useCallback(() => {
    setIsUpgradeDialogOpen(false);
  }, []);

  return {
    isFeatureAvailable,
    showUpgradePrompt,
    hideUpgradePrompt,
    isUpgradeDialogOpen,
  };
}

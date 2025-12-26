import { useState, useEffect } from "react";
import { useAppSettings } from "./useAppSettings";

const STORAGE_KEY = "cross-community-mode";

export function useCrossCommunityMode() {
  const { isCrossCommunityEnabled, isLoading: settingsLoading } = useAppSettings();
  
  // User's preference for cross-community mode (stored locally)
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === "true";
  });

  // Update localStorage when user toggles
  const toggleMode = () => {
    const newValue = !isEnabled;
    setIsEnabled(newValue);
    localStorage.setItem(STORAGE_KEY, String(newValue));
  };

  // Reset preference if feature is disabled globally
  useEffect(() => {
    if (!settingsLoading && !isCrossCommunityEnabled && isEnabled) {
      setIsEnabled(false);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [isCrossCommunityEnabled, settingsLoading, isEnabled]);

  return {
    // Feature flag from admin settings
    isFeatureEnabled: !settingsLoading && isCrossCommunityEnabled,
    // User's current mode preference
    isInCrossCommunityMode: !settingsLoading && isCrossCommunityEnabled && isEnabled,
    // Toggle function
    toggleMode,
    // Loading state
    isLoading: settingsLoading,
  };
}

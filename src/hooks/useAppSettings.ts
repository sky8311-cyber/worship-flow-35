import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface FeatureFlags {
  seed_leaderboard_enabled: boolean;
  church_subscription_enabled: boolean;
  church_menu_visible: boolean;
  premium_enabled: boolean;
  premium_menu_visible: boolean;
  scheduler_enabled: boolean;
  cross_community_enabled: boolean;
  worship_leader_auto_approve: boolean;
  google_login_enabled: boolean;
  team_rotation_enabled: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  seed_leaderboard_enabled: false,
  church_subscription_enabled: false,
  church_menu_visible: false,
  premium_enabled: false,
  premium_menu_visible: false,
  scheduler_enabled: false,
  cross_community_enabled: false,
  worship_leader_auto_approve: false,
  google_login_enabled: true,
  team_rotation_enabled: false,
};

export function useAppSettings() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: flags, isLoading } = useQuery({
    queryKey: ["platform-feature-flags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_feature_flags")
        .select("key, enabled");

      if (error) throw error;

      const flagsMap: FeatureFlags = { ...DEFAULT_FLAGS };

      data?.forEach((flag) => {
        const key = flag.key as keyof FeatureFlags;
        if (key in flagsMap) {
          flagsMap[key] = flag.enabled;
        }
      });

      return flagsMap;
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  const updateFlagMutation = useMutation({
    mutationFn: async ({ key, enabled }: { key: string; enabled: boolean }) => {
      const { error } = await supabase
        .from("platform_feature_flags")
        .update({ enabled })
        .eq("key", key);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-feature-flags"] });
      // Note: Toast message is now handled by the component using translations
    },
    onError: (error: Error) => {
      console.error("Settings save failed:", error.message);
      // Note: Toast message is now handled by the component using translations
    },
  });

  const toggleFlag = (key: keyof FeatureFlags) => {
    if (!isAdmin) return;
    const currentValue = flags?.[key] ?? DEFAULT_FLAGS[key];
    updateFlagMutation.mutate({ key, enabled: !currentValue });
  };

  return {
    isLeaderboardEnabled: !isLoading && (flags?.seed_leaderboard_enabled ?? false),
    isChurchSubscriptionEnabled: !isLoading && (flags?.church_subscription_enabled ?? false),
    isChurchMenuVisible: !isLoading && (flags?.church_menu_visible ?? false),
    isPremiumEnabled: !isLoading && (flags?.premium_enabled ?? false),
    isPremiumMenuVisible: !isLoading && (flags?.premium_menu_visible ?? false),
    isSchedulerEnabled: !isLoading && (flags?.scheduler_enabled ?? false),
    isCrossCommunityEnabled: !isLoading && (flags?.cross_community_enabled ?? false),
    isWorshipLeaderAutoApproveEnabled: !isLoading && (flags?.worship_leader_auto_approve ?? false),
    isGoogleLoginEnabled: !isLoading && (flags?.google_login_enabled ?? true),
    isTeamRotationEnabled: !isLoading && (flags?.team_rotation_enabled ?? false),
    isLoading,
    isUpdating: updateFlagMutation.isPending,
    updateError: updateFlagMutation.error,
    updateSuccess: updateFlagMutation.isSuccess,
    toggleLeaderboard: () => toggleFlag("seed_leaderboard_enabled"),
    toggleChurchSubscription: () => toggleFlag("church_subscription_enabled"),
    toggleChurchMenu: () => toggleFlag("church_menu_visible"),
    togglePremium: () => toggleFlag("premium_enabled"),
    togglePremiumMenu: () => toggleFlag("premium_menu_visible"),
    toggleScheduler: () => toggleFlag("scheduler_enabled"),
    toggleCrossCommunity: () => toggleFlag("cross_community_enabled"),
    toggleWorshipLeaderAutoApprove: () => toggleFlag("worship_leader_auto_approve"),
    toggleGoogleLogin: () => toggleFlag("google_login_enabled"),
    toggleTeamRotation: () => toggleFlag("team_rotation_enabled"),
  };
}

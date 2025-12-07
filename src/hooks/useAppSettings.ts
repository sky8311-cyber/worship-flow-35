import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface AppSettings {
  leaderboard_enabled: boolean;
  church_subscription_enabled: boolean;
  church_menu_visible: boolean;
}

export function useAppSettings() {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["app-settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("key, value");

      if (error) throw error;

      const settingsMap: AppSettings = {
        leaderboard_enabled: true,
        church_subscription_enabled: true,
        church_menu_visible: true,
      };

      data?.forEach((setting: any) => {
        if (setting.key === "leaderboard_enabled") {
          settingsMap.leaderboard_enabled = setting.value?.enabled ?? true;
        } else if (setting.key === "church_subscription_enabled") {
          settingsMap.church_subscription_enabled = setting.value?.enabled ?? true;
        } else if (setting.key === "church_menu_visible") {
          settingsMap.church_menu_visible = setting.value?.visible ?? true;
        }
      });

      return settingsMap;
    },
  });

  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { error } = await supabase
        .from("app_settings")
        .update({ value })
        .eq("key", key);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["app-settings"] });
      toast.success("설정이 저장되었습니다");
    },
    onError: (error: any) => {
      toast.error("설정 저장 실패: " + error.message);
    },
  });

  const toggleLeaderboard = () => {
    if (!isAdmin) return;
    updateSettingMutation.mutate({
      key: "leaderboard_enabled",
      value: { enabled: !settings?.leaderboard_enabled },
    });
  };

  const toggleChurchSubscription = () => {
    if (!isAdmin) return;
    updateSettingMutation.mutate({
      key: "church_subscription_enabled",
      value: { enabled: !settings?.church_subscription_enabled },
    });
  };

  const toggleChurchMenu = () => {
    if (!isAdmin) return;
    updateSettingMutation.mutate({
      key: "church_menu_visible",
      value: { visible: !settings?.church_menu_visible },
    });
  };

  return {
    isLeaderboardEnabled: settings?.leaderboard_enabled ?? true,
    isChurchSubscriptionEnabled: settings?.church_subscription_enabled ?? true,
    isChurchMenuVisible: settings?.church_menu_visible ?? true,
    isLoading,
    toggleLeaderboard,
    toggleChurchSubscription,
    toggleChurchMenu,
    isUpdating: updateSettingMutation.isPending,
  };
}

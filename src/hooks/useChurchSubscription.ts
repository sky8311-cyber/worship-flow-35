import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ChurchSubscriptionStatus {
  hasChurchAccount: boolean;
  isSubscriptionActive: boolean;
  isInTrial: boolean;
  trialDaysRemaining: number;
  subscriptionStatus: string | null;
  canStartTrial: boolean;
  churchAccountId: string | null;
}

export function useChurchSubscription(): ChurchSubscriptionStatus & { isLoading: boolean; refetch: () => void } {
  const { user, isWorshipLeader, isAdmin } = useAuth();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["church-subscription-status", user?.id],
    queryFn: async (): Promise<ChurchSubscriptionStatus> => {
      if (!user?.id) {
        return {
          hasChurchAccount: false,
          isSubscriptionActive: false,
          isInTrial: false,
          trialDaysRemaining: 0,
          subscriptionStatus: null,
          canStartTrial: false,
          churchAccountId: null,
        };
      }

      // Check if user is a member of any church account
      const { data: membership, error } = await supabase
        .from("church_account_members")
        .select("church_account_id, church_accounts(id, subscription_status, trial_ends_at)")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (error || !membership) {
        return {
          hasChurchAccount: false,
          isSubscriptionActive: false,
          isInTrial: false,
          trialDaysRemaining: 0,
          subscriptionStatus: null,
          canStartTrial: isWorshipLeader || isAdmin,
          churchAccountId: null,
        };
      }

      const churchAccount = membership.church_accounts as any;
      if (!churchAccount) {
        return {
          hasChurchAccount: false,
          isSubscriptionActive: false,
          isInTrial: false,
          trialDaysRemaining: 0,
          subscriptionStatus: null,
          canStartTrial: isWorshipLeader || isAdmin,
          churchAccountId: null,
        };
      }

      const status = churchAccount.subscription_status;
      const trialEndsAt = churchAccount.trial_ends_at;
      
      const now = new Date();
      const trialEnd = trialEndsAt ? new Date(trialEndsAt) : null;
      const trialDaysRemaining = trialEnd 
        ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

      const isInTrial = status === "trial" && trialEnd && trialEnd > now;
      const isSubscriptionActive = status === "active" || isInTrial;
      
      // Can start trial if never subscribed (status is null, empty, or 'inactive')
      const canStartTrial = !status || status === "inactive" || status === "";

      return {
        hasChurchAccount: true,
        isSubscriptionActive: isSubscriptionActive || false,
        isInTrial: isInTrial || false,
        trialDaysRemaining,
        subscriptionStatus: status,
        canStartTrial,
        churchAccountId: churchAccount.id,
      };
    },
    enabled: !!user?.id,
  });

  return {
    hasChurchAccount: data?.hasChurchAccount ?? false,
    isSubscriptionActive: data?.isSubscriptionActive ?? false,
    isInTrial: data?.isInTrial ?? false,
    trialDaysRemaining: data?.trialDaysRemaining ?? 0,
    subscriptionStatus: data?.subscriptionStatus ?? null,
    canStartTrial: data?.canStartTrial ?? false,
    churchAccountId: data?.churchAccountId ?? null,
    isLoading,
    refetch,
  };
}

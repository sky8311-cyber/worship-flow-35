import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { isNativeIOS } from "@/utils/platform";
import { REVENUECAT_ENABLED } from "@/hooks/useRevenueCat";
import { REVENUECAT_ENABLED } from "@/hooks/useRevenueCat";

interface PremiumSubscriptionStatus {
  isSubscribed: boolean;
  isActive: boolean;
  isTrial: boolean;
  trialDaysRemaining: number;
  subscriptionStatus: string | null;
  subscriptionEnd: string | null;
  canStartTrial: boolean;
}

export function usePremiumSubscription(): PremiumSubscriptionStatus & { isLoading: boolean; refetch: () => void } {
  const { user } = useAuth();

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["premium-subscription-status", user?.id],
    queryFn: async (): Promise<PremiumSubscriptionStatus> => {
      if (!user?.id) {
        return {
          isSubscribed: false,
          isActive: false,
          isTrial: false,
          trialDaysRemaining: 0,
          subscriptionStatus: null,
          subscriptionEnd: null,
          canStartTrial: true,
        };
      }

      // First check local database
      const { data: subscription, error } = await supabase
        .from("premium_subscriptions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching premium subscription:", error);
        return {
          isSubscribed: false,
          isActive: false,
          isTrial: false,
          trialDaysRemaining: 0,
          subscriptionStatus: null,
          subscriptionEnd: null,
          canStartTrial: true,
        };
      }

      if (!subscription) {
        return {
          isSubscribed: false,
          isActive: false,
          isTrial: false,
          trialDaysRemaining: 0,
          subscriptionStatus: null,
          subscriptionEnd: null,
          canStartTrial: true,
        };
      }

      const status = subscription.subscription_status;
      const trialEndsAt = subscription.trial_ends_at;
      const currentPeriodEnd = subscription.current_period_end;
      
      const now = new Date();
      const trialEnd = trialEndsAt ? new Date(trialEndsAt) : null;
      const trialDaysRemaining = trialEnd 
        ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
        : 0;

      const isTrial = status === "trial" && trialEnd && trialEnd > now;
      const isActive = status === "active" || (isTrial ?? false);
      const canStartTrial = !status || status === "inactive" || status === "";

      // On native iOS, also check RevenueCat entitlements
      let nativeIsActive = false;
      if (REVENUECAT_ENABLED && isNativeIOS()) {
        try {
          const { Purchases } = await import("@revenuecat/purchases-capacitor");
          const { customerInfo } = await Purchases.getCustomerInfo();
          const premiumEntitlement = customerInfo?.entitlements?.active?.["premium"];
          if (premiumEntitlement && premiumEntitlement.isActive) {
            nativeIsActive = true;
          }
        } catch (err) {
          console.warn("[Premium] RevenueCat check failed, using DB only:", err);
        }
      }

      const finalIsActive = isActive || nativeIsActive;

      return {
        isSubscribed: finalIsActive,
        isActive: status === "active" || nativeIsActive,
        isTrial: isTrial || false,
        trialDaysRemaining,
        subscriptionStatus: status,
        subscriptionEnd: currentPeriodEnd,
        canStartTrial: canStartTrial && !nativeIsActive,
      };
    },
    enabled: !!user?.id,
    staleTime: 60000, // Cache for 1 minute
  });

  return {
    isSubscribed: data?.isSubscribed ?? false,
    isActive: data?.isActive ?? false,
    isTrial: data?.isTrial ?? false,
    trialDaysRemaining: data?.trialDaysRemaining ?? 0,
    subscriptionStatus: data?.subscriptionStatus ?? null,
    subscriptionEnd: data?.subscriptionEnd ?? null,
    canStartTrial: data?.canStartTrial ?? true,
    isLoading,
    refetch,
  };
}

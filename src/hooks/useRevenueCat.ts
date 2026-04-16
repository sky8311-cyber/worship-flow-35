import { useState, useEffect, useCallback } from "react";
import { isNativeIOS } from "@/utils/platform";
import { useAuth } from "@/contexts/AuthContext";

// Temporary flag to disable RevenueCat during startup — flip to true when ready
export const REVENUECAT_ENABLED = false;

// RevenueCat entitlement identifiers (must match RevenueCat dashboard)
export const RC_ENTITLEMENTS = {
  PREMIUM: "premium",
  CHURCH: "church",
} as const;

// RevenueCat product identifiers (must match App Store Connect)
export const RC_PRODUCTS = {
  FULL_MEMBERSHIP_YEARLY: "full_membership_yearly",
  COMMUNITY_ACCOUNT_MONTHLY: "community_account_monthly",
} as const;

interface RevenueCatState {
  isInitialized: boolean;
  offerings: any | null;
  customerInfo: any | null;
  isLoading: boolean;
  error: string | null;
}

export function useRevenueCat() {
  const { user } = useAuth();
  const [state, setState] = useState<RevenueCatState>({
    isInitialized: false,
    offerings: null,
    customerInfo: null,
    isLoading: false,
    error: null,
  });

  // Initialize RevenueCat SDK
  useEffect(() => {
    if (!REVENUECAT_ENABLED || !isNativeIOS()) return;

    const initRC = async () => {
      try {
        const { Purchases } = await import("@revenuecat/purchases-capacitor");

        // The API key is stored in the app binary for iOS (public key)
        // It's safe to include in client code — RevenueCat docs confirm this
        await Purchases.configure({
          apiKey: import.meta.env.VITE_REVENUECAT_IOS_API_KEY || "",
        });

        // Identify user with Supabase UID for cross-platform sync
        if (user?.id) {
          await Purchases.logIn({ appUserID: user.id });
        }

        const { customerInfo } = await Purchases.getCustomerInfo();
        const offerings = await Purchases.getOfferings();

        setState((prev) => ({
          ...prev,
          isInitialized: true,
          customerInfo,
          offerings: offerings.current,
        }));
      } catch (err) {
        console.error("[RevenueCat] Init error:", err);
        setState((prev) => ({
          ...prev,
          error: err instanceof Error ? err.message : String(err),
        }));
      }
    };

    initRC();
  }, [user?.id]);

  // Re-identify when user changes
  useEffect(() => {
    if (!REVENUECAT_ENABLED || !isNativeIOS() || !state.isInitialized || !user?.id) return;

    const identify = async () => {
      try {
        const { Purchases } = await import("@revenuecat/purchases-capacitor");
        await Purchases.logIn({ appUserID: user.id });
        const { customerInfo } = await Purchases.getCustomerInfo();
        setState((prev) => ({ ...prev, customerInfo }));
      } catch (err) {
        console.error("[RevenueCat] Identify error:", err);
      }
    };

    identify();
  }, [user?.id, state.isInitialized]);

  // Purchase a package
  const purchasePackage = useCallback(async (packageToPurchase: any) => {
    if (!REVENUECAT_ENABLED || !isNativeIOS()) return null;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const { Purchases } = await import("@revenuecat/purchases-capacitor");
      const result = await Purchases.purchasePackage({
        aPackage: packageToPurchase,
      });

      setState((prev) => ({
        ...prev,
        isLoading: false,
        customerInfo: result.customerInfo,
      }));

      return result;
    } catch (err: any) {
      // User cancelled is not an error
      if (err?.code === "1" || err?.userCancelled) {
        setState((prev) => ({ ...prev, isLoading: false }));
        return null;
      }
      console.error("[RevenueCat] Purchase error:", err);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : String(err),
      }));
      throw err;
    }
  }, []);

  // Restore purchases (required by Apple)
  const restorePurchases = useCallback(async () => {
    if (!REVENUECAT_ENABLED || !isNativeIOS()) return null;

    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const { Purchases } = await import("@revenuecat/purchases-capacitor");
      const { customerInfo } = await Purchases.restorePurchases();

      setState((prev) => ({
        ...prev,
        isLoading: false,
        customerInfo,
      }));

      return customerInfo;
    } catch (err) {
      console.error("[RevenueCat] Restore error:", err);
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : String(err),
      }));
      throw err;
    }
  }, []);

  // Check if user has a specific entitlement
  const hasEntitlement = useCallback(
    (entitlementId: string): boolean => {
      if (!state.customerInfo) return false;
      const entitlement =
        state.customerInfo.entitlements?.active?.[entitlementId];
      return !!entitlement && entitlement.isActive;
    },
    [state.customerInfo]
  );

  // Get the premium package from current offering
  const getPremiumPackage = useCallback(() => {
    if (!state.offerings) return null;
    // Look for the annual package or specific product
    return (
      state.offerings.annual ||
      state.offerings.availablePackages?.find(
        (p: any) =>
          p.product?.identifier === RC_PRODUCTS.FULL_MEMBERSHIP_YEARLY
      ) ||
      null
    );
  }, [state.offerings]);

  // Get the church package from current offering
  const getChurchPackage = useCallback(() => {
    if (!state.offerings) return null;
    return (
      state.offerings.monthly ||
      state.offerings.availablePackages?.find(
        (p: any) =>
          p.product?.identifier === RC_PRODUCTS.COMMUNITY_ACCOUNT_MONTHLY
      ) ||
      null
    );
  }, [state.offerings]);

  return {
    ...state,
    purchasePackage,
    restorePurchases,
    hasEntitlement,
    getPremiumPackage,
    getChurchPackage,
    hasPremium: hasEntitlement(RC_ENTITLEMENTS.PREMIUM),
    hasChurch: hasEntitlement(RC_ENTITLEMENTS.CHURCH),
  };
}

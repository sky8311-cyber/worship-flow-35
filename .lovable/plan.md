

# Disable RevenueCat on App Load (Temporary)

## Problem
The logs show RevenueCat errors during startup (`"Purchases must be configured before calling this function"`). This happens because `usePremiumSubscription.ts` calls `Purchases.getCustomerInfo()` before `useRevenueCat` has finished configuring the SDK. These failed calls add latency and noise during app launch.

The Xcode warnings (`UIScene lifecycle`, `sandbox extension`) are iOS system-level messages — they cannot be fixed from app code and are not causing actual slowdowns.

## Plan

### 1. Add a feature flag to disable RevenueCat temporarily
Add a constant `REVENUECAT_ENABLED = false` in `src/hooks/useRevenueCat.ts`. When `false`, the hook returns default empty state immediately without importing or configuring the SDK.

### 2. Skip RevenueCat in `usePremiumSubscription.ts`
Guard the RevenueCat entitlement check (lines 82-93) with the same `REVENUECAT_ENABLED` flag so it doesn't attempt to call `Purchases.getCustomerInfo()` during startup.

### 3. Guard RevenueCat usage in `Membership.tsx`
The hook call already returns safe defaults when disabled — no changes needed there beyond what the hook provides.

## Result
- App startup skips all RevenueCat SDK imports and API calls
- No more error logs from unconfigured Purchases
- When ready to re-enable, flip `REVENUECAT_ENABLED` to `true`

**Files changed: 2** (`useRevenueCat.ts`, `usePremiumSubscription.ts`)


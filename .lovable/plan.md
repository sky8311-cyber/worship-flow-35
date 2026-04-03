

# iOS App Store In-App Subscription Purchases

## Overview

Add native iOS in-app subscription purchases using **RevenueCat** (`@revenuecat/purchases-capacitor`). This lets users upgrade their membership (Full Member, Community Account) directly through Apple's payment system when using the iOS app, while keeping Stripe for web users.

## Architecture

```text
┌─────────────────────────────────────────────────┐
│  Membership.tsx / Upgrade UI                    │
│                                                 │
│  if (native iOS)  → RevenueCat purchase flow    │
│  if (web)         → Stripe checkout (existing)  │
└─────────────────────────────────────────────────┘
         │                        │
         ▼                        ▼
   Apple App Store           Stripe API
         │                        │
         ▼                        ▼
   RevenueCat Server ──webhook──► Edge Function
         │                           │
         └───────────────────────────┘
                     │
              premium_subscriptions
              church_accounts tables
```

## Steps

### 1. Install RevenueCat Capacitor Plugin
- Add `@revenuecat/purchases-capacitor` dependency
- This wraps StoreKit for iOS (and Google Play for future Android)

### 2. Create Platform Detection Utility
- New file: `src/utils/platform.ts`
- Export `isNativeIOS()` using Capacitor's `Capacitor.isNativePlatform()` + platform check
- Used throughout the app to branch between native IAP and Stripe

### 3. Create RevenueCat Service Hook
- New file: `src/hooks/useRevenueCat.ts`
- Initialize RevenueCat SDK with your API key on app startup
- Identify user with their Supabase auth user ID
- Expose: `getOfferings()`, `purchasePackage()`, `getCustomerInfo()`, `restorePurchases()`
- Map RevenueCat entitlements to your tier system (full_membership → premium, community_account → church)

### 4. Create RevenueCat Webhook Edge Function
- New file: `supabase/functions/revenuecat-webhook/index.ts`
- Receives events from RevenueCat (INITIAL_PURCHASE, RENEWAL, CANCELLATION, EXPIRATION)
- Updates `premium_subscriptions` / `church_accounts` tables with `payment_gateway: "apple"` metadata
- Validates webhook authenticity via shared secret

### 5. Update Membership Page for Native Purchases
- Modify `src/pages/Membership.tsx`
- When `isNativeIOS()` is true:
  - Replace Stripe checkout buttons with RevenueCat purchase flow
  - Show Apple-formatted pricing from RevenueCat offerings
  - Add "Restore Purchases" button (required by Apple)
- When on web: keep existing Stripe flow unchanged

### 6. Update Subscription Status Hook
- Modify `src/hooks/usePremiumSubscription.ts`
- On native iOS: also check RevenueCat customer info for active entitlements
- Merge with existing DB-based status check (webhook keeps DB in sync)

### 7. Store RevenueCat API Key as Secret
- Use `add_secret` tool for `REVENUECAT_API_KEY` (public iOS API key for the SDK)
- Use `add_secret` for `REVENUECAT_WEBHOOK_SECRET` (for webhook verification)

## Apple / RevenueCat Setup (Manual — on your Mac)

You'll need to do these steps yourself:

1. **Apple Developer Console** → App Store Connect:
   - Create your app record if not already done
   - Go to **Subscriptions** → Create subscription groups
   - Add products: `full_membership_yearly` ($49.99/yr) and `community_account_monthly` ($39.99/mo)

2. **RevenueCat Dashboard** (free account at revenuecat.com):
   - Create a project, add iOS app with your Bundle ID `app.kworship.main`
   - Connect App Store credentials (shared secret from App Store Connect)
   - Create **Entitlements**: `premium` and `church`
   - Create **Offerings** with the subscription products
   - Set up **Webhook** URL pointing to your edge function
   - Copy the **Public iOS API Key**

3. **Xcode** (after git pull):
   - Enable **In-App Purchase** capability
   - Set Swift Language Version ≥ 5.0
   - `npx cap sync ios` to sync plugin

## Files Changed/Created

| File | Action |
|------|--------|
| `package.json` | Add `@revenuecat/purchases-capacitor` |
| `src/utils/platform.ts` | New — platform detection |
| `src/hooks/useRevenueCat.ts` | New — RevenueCat SDK wrapper |
| `supabase/functions/revenuecat-webhook/index.ts` | New — webhook handler |
| `src/pages/Membership.tsx` | Modified — branch IAP vs Stripe |
| `src/hooks/usePremiumSubscription.ts` | Modified — native entitlement check |
| `capacitor.config.ts` | No changes needed |

## Technical Notes

- RevenueCat is free up to $2,500/mo revenue — ideal for starting out
- Apple requires a "Restore Purchases" button — we'll add it on the Membership page (native only)
- Apple takes 15-30% commission on IAP — pricing may need adjustment
- The webhook keeps the database in sync so existing tier/feature-gate logic works unchanged


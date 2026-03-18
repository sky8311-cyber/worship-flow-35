

## Two Issues to Fix

### Issue 1: AI Set Builder button invisible to Basic Members

Currently the "AI 세트" button is hidden with `hasFeature('ai_set_builder')` — Basic Members never see it. The `LockedFeatureBanner` only shows in the **empty state** area, so if a Basic Member already has songs in their set, they see nothing about this feature at all.

**Fix**: Always show the "AI 세트" button in the toolbar. If the user doesn't have the feature, clicking it opens the `LockedFeatureBanner` / upgrade prompt instead of the AI panel. This way all authenticated users discover the feature exists.

**Changes to `src/pages/SetBuilder.tsx`**:
- Remove the `hasFeature('ai_set_builder')` condition wrapping the button — always render it
- When clicked without feature access, show an upgrade prompt (e.g., navigate to `/membership` or open the `UpgradePlanDialog`)
- Keep the `LockedFeatureBanner` in the empty state as a secondary prompt
- Add a small lock icon or "PRO" badge on the button when the user lacks the feature

### Issue 2: No admin function to manually upgrade a user to Full Membership

There is no admin UI or backend capability to manually grant a user (e.g., `sky@goodpapa.org`) Full Member status by inserting/updating a `premium_subscriptions` record.

**Fix**: Add a "Grant Full Membership" action in the Admin Users page.

**Changes**:

1. **New edge function: `admin-grant-membership`** (`supabase/functions/admin-grant-membership/index.ts`)
   - Accepts `{ user_id, duration_days? }` (default 365 days)
   - Validates admin role via JWT
   - Upserts into `premium_subscriptions` table: sets `subscription_status = 'active'`, `subscription_end` to now + duration, `subscription_type = 'manual'` (or similar field if available)
   - Returns success

2. **Admin Users UI** (`src/pages/AdminUsers.tsx`)
   - Add a "Grant Full Membership" option in the user action dropdown menu
   - Confirmation dialog before granting
   - Calls the edge function and refreshes the user list

3. **AdminUserProfileDialog** (`src/components/admin/AdminUserProfileDialog.tsx`)
   - Show current subscription status in the profile dialog
   - Add a "Grant Full Membership" button if user is not already a Full Member

### Files Summary

| File | Change |
|---|---|
| `src/pages/SetBuilder.tsx` | Always show AI 세트 button; show upgrade prompt when feature not available |
| `src/components/LockedFeatureBanner.tsx` | Add optional `onUpgrade` callback to the Upgrade button |
| `supabase/functions/admin-grant-membership/index.ts` | New edge function for manual membership grants |
| `src/pages/AdminUsers.tsx` | Add "Grant Full Membership" dropdown action |
| `src/components/admin/AdminUserProfileDialog.tsx` | Show subscription status + grant button |


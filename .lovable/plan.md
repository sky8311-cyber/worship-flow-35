

# Speed Up Native App Launch — Deeper Optimization

## Current situation
The previous round moved `isFullyLoaded` off `roleSyncComplete` and made `MobileAppLanding` skip rendering on native. Those were good changes but the app still feels slow because the **real bottleneck** was not addressed: the entire app shell, provider tree, and auth initialization must complete before any screen paints.

## Root causes still present

1. **`main.tsx` uses a dynamic `import("./App")` chain** — the app module, CSS, and all synchronous imports inside `App.tsx` load sequentially after the initial JS bundle. The splash screen hides via `requestAnimationFrame` x2, but the WebView still shows nothing useful until App mounts.

2. **`MobileAppLanding` calls `navigate("/login")` during render** on native — this is a side effect during render (not in useEffect), which React may run multiple times and which doesn't paint anything before navigating. The component returns `null`, so the user sees a blank screen between splash hide and login mount.

3. **No Vite manual chunk splitting** — the entire app (all 80+ lazy routes, all providers, framer-motion, radix, etc.) is in one or two chunks. The initial bundle is larger than necessary for the native login path.

4. **`index.css` is dynamically imported** in `main.tsx` (`import("./index.css")`) — this means styles load asynchronously, causing a flash of unstyled content.

5. **Auth `getSession()` + `fetchProfile()` block the loading state** — every protected route waits for this, but even the login page waits indirectly because `MobileAppLanding` reads `useAuth()`.

## What the iOS warnings mean (for clarity)
- `UIScene lifecycle` — Apple deprecation warning; cosmetic, does not cause slowness
- `Could not create a sandbox extension` — WebKit security log; harmless
- `Unable to hide query parameters` — WebKit internal; harmless
- `Unable to simultaneously satisfy constraints` — UIKit auto-layout conflict in system keyboard/toolbar; harmless
- `variant selector cell index` — emoji rendering internals; harmless
- `WEBP _reader` — a WEBP image failed to decode; minor, not blocking
- `DialogContent requires DialogTitle` — accessibility warning from Radix

**None of these warnings cause the slow launch.** The slowness is entirely in the JS/React startup path.

## Plan

### 1. Fix the native redirect to use `useEffect` instead of render-time `navigate()`
Currently `MobileAppLanding` calls `navigate("/login")` during render body (not in a useEffect). This is wrong — it causes a blank frame. Move it into the existing `useEffect` so that on native, the redirect to `/login` or `/dashboard` is handled properly and doesn't cause an extra render cycle returning `null`.

**File:** `src/pages/MobileAppLanding.tsx`

### 2. Make `index.css` a static import in `main.tsx`
Change `import("./index.css")` (dynamic) to a top-level `import "./index.css"` so styles are available immediately when the DOM paints. This eliminates the flash of unstyled content.

**File:** `src/main.tsx`

### 3. Add Vite manual chunks for vendor splitting
Split large vendor dependencies (`framer-motion`, `@radix-ui`, `@tanstack/react-query`, `@supabase`) into separate chunks. This lets the browser cache them independently and reduces the main chunk parse time.

**File:** `vite.config.ts`

### 4. Defer `PageAnalyticsProvider` on native
The analytics provider currently mounts at the router root and fires immediately. On native, wrap it in a `useEffect` with a longer delay (already partially done in `usePageAnalytics.ts` with 3s delay, but the provider still mounts and runs hooks). Make the provider component itself skip mounting on native for the first 5 seconds.

**File:** `src/components/analytics/PageAnalyticsProvider.tsx`

### 5. Defer splash screen hide until the first real route paints
Currently splash hides after 2x `requestAnimationFrame` in `main.tsx`, which fires before auth resolves or login renders. Instead, hide splash screen from within the first painted component (Login or Dashboard) so the user never sees a blank white screen.

**Files:** `src/main.tsx`, `src/pages/auth/Login.tsx`, `src/pages/Dashboard.tsx`

## Files to change
1. `src/pages/MobileAppLanding.tsx` — fix render-time navigate
2. `src/main.tsx` — static CSS import, remove early splash hide
3. `vite.config.ts` — add manual chunks
4. `src/components/analytics/PageAnalyticsProvider.tsx` — defer on native
5. `src/pages/auth/Login.tsx` — hide splash on mount
6. `src/pages/Dashboard.tsx` — hide splash on mount

## Expected result
- Splash screen stays visible until login/dashboard actually paints
- No blank white screen between splash and first content
- Smaller initial JS chunk = faster parse
- Styles available immediately (no FOUC)
- Analytics deferred on native startup


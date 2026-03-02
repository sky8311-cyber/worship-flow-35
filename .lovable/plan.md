
Goal: fix the persistent iPhone native top overlap (status icons/notch covering app UI) across all screens, even after sync.

What I found from your code and your confirmation:
1) The issue is global (“every screen”), so this is not page-specific content spacing.
2) You already have:
   - `viewport-fit=cover` in `index.html`
   - `padding-top: env(safe-area-inset-top)` on `body`
   - `StatusBar.overlaysWebView: true` in Capacitor config
3) Many top bars are `sticky top-0` or `fixed top-0` (`AppHeader`, `Login` header, `LandingNav`, `PublicPageHeader`, `AdminNav`).  
   Even with body padding, these top-pinned elements can still render into the status bar area unless they explicitly account for safe area.
4) Keeping `overlaysWebView: true` means the app must handle top inset correctly everywhere; right now it’s inconsistent.

Implementation plan:

1. Introduce a single reusable safe-area top utility (centralized)
- Add a CSS utility in `src/index.css`:
  - `.safe-top` → `padding-top: env(safe-area-inset-top, 0px);`
  - `.safe-top-offset` → `top: env(safe-area-inset-top, 0px);`
- Purpose: avoid one-off inline styles and enforce consistency.

2. Apply safe-area handling to all global top navigation/header components
- Update these components to use the new utility:
  - `src/components/layout/AppHeader.tsx`
  - `src/pages/auth/Login.tsx`
  - `src/components/landing/LandingNav.tsx`
  - `src/components/landing/PublicPageHeader.tsx`
  - `src/components/admin/AdminNav.tsx`
- Specific approach:
  - For `sticky/fixed top-0` headers: replace plain `top-0` behavior with safe-area-aware offset (`safe-top-offset`).
  - Add safe-area padding inside header container where needed so content begins below status bar.

3. Remove global body-level top padding to prevent conflicting behaviors
- In `src/index.css`, remove `body { padding-top: env(safe-area-inset-top, 0px); }`.
- Reason:
  - Body-level padding is too blunt and can conflict with sticky/fixed layouts.
  - Component-level safe handling is more reliable and predictable.

4. Keep Capacitor status bar overlay mode consistent with the new CSS strategy
- Keep `StatusBar.overlaysWebView: true` in `capacitor.config.ts`.
- Reason:
  - It works cross-platform with edge-to-edge behavior.
  - We’ll make layout explicitly safe-area aware instead of relying on webview resizing.
- If overlap still persists after this pass, fallback plan:
  - switch to `overlaysWebView: false` specifically for native iOS behavior and retest (secondary fallback only).

5. Verify screens affected by your report
- Test in iOS simulator after rebuild/sync:
  - Login (`/login`)
  - Dashboard (`/dashboard`)
  - Songs (`/songs`)
  - Landing (`/`)
  - Admin page with admin nav (if applicable)
- Confirm:
  - No icon/logo/header clipped by status icons/notch
  - No unexpected double top spacing
  - Sticky headers remain visually stable during scroll

6. Native build sync sequence (after code changes)
- Pull latest code locally.
- Run:
  - `npm run build`
  - `npx cap sync ios`
- In Xcode:
  - Clean build folder + rerun simulator for cache-safe validation.

Technical notes:
- This fix intentionally targets the real root cause: multiple top-pinned components that each need safe-area awareness.
- It avoids fragile global hacks and keeps behavior deterministic per component.
- Your app already handles bottom safe area well; this applies the same discipline to top-safe-area handling.

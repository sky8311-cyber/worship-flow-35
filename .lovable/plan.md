
Goal: stop iPhone Chrome from opening YouTube in web tab by making link handling deterministic across the whole app (single architecture change, not repeated tweaks).

What I found (deep review)
1) Current `src/lib/youtubeHelper.ts` still uses JavaScript-driven navigation (`window.location.assign(...)`, timers, visibility guards).  
2) Even after partial refactors, YouTube opens are still a mix of UI patterns (buttons/div clicks), not true native link taps everywhere.  
3) External behavior evidence:
   - YouTube’s own docs say `youtube.com / m.youtube.com / youtu.be` links should open app on iOS.
   - iOS browser behavior is inconsistent when Universal Links are triggered programmatically (JS redirect) vs actual user-tapped anchor links.
   - `_blank` strongly biases web-tab behavior on mobile and should be avoided for app-launch paths.

One-time fix design (structural)
A) Replace “JS-redirect-first” with “real anchor-first” for iOS/Android mobile taps.
- Build a single utility in `src/lib/youtubeHelper.ts`:
  - `extractYouTubeVideoId(url)`
  - `buildYouTubeLaunchHref(url, ua)`:
    - iOS + videoId → `https://youtu.be/{id}` (universal link)
    - Android + videoId → `intent://watch?v=...` (with browser fallback URL)
    - otherwise → canonical watch URL or original URL
  - `getYouTubeAnchorProps(url)`:
    - mobile: no `_blank`
    - desktop: `_blank` + `rel`
- Keep `openYouTubeUrl(url)` only as fallback for legacy callsites, internally using the same builder (no separate iOS logic branch with timers).

B) Convert all YouTube click entry points to the same anchor-based path (single source of truth).
- Update these files to use `Button asChild` + `<a {...getYouTubeAnchorProps(url)}>` (or equivalent anchor wrapper):
  - `src/components/SongCard.tsx`
  - `src/components/SetSongItem.tsx`
  - `src/components/SongTable.tsx`
  - `src/components/SongDialog.tsx` (thumbnail wrapper)
  - `src/components/YouTubeSearchBar.tsx` (preview button)
  - `src/components/dashboard/ProfileSidebarCard.tsx`
  - `src/components/DuplicateReviewDialog.tsx`
  - `src/components/admin/AdminUserProfileDialog.tsx`
- This removes per-screen behavior drift and makes mobile behavior consistent.

C) Remove mobile `_blank` for YouTube everywhere.
- Desktop keeps `_blank`.
- Mobile always same-tab for app handoff.

D) Hardening
- Keep lightweight debounce only to prevent double tap duplicate launches.
- Normalize malformed/param-heavy YouTube URLs before building href.

Why this should fix your specific regression
- Your current failure is likely from JS-driven redirects + mixed click patterns.  
- This plan changes the mechanism itself: user taps a real YouTube anchor URL that iOS can hand off to the app, rather than relying on scripted redirects.  
- It also eliminates route-by-route inconsistencies that caused “works here, fails there” behavior.

Acceptance checks (single pass)
1) iPhone Chrome: SongCard / SetSongItem / SongDialog thumbnail / Profile sidebar / Duplicate dialog / Admin profile all open consistently via same behavior.
2) iPhone Chrome with YouTube app installed: opens app directly from tap.
3) iPhone Chrome without app: opens web YouTube (expected fallback).
4) Android Chrome: intent path still opens app with proper web fallback.
5) Desktop: still opens YouTube in a new tab.

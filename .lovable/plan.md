<final-text># Speed up native app launch and separate harmless iOS warnings

## What I found
Do I know what the issue is? Yes.

- The logs you pasted are mostly iOS/WebKit platform warnings, not the main cause of the slow open:
  - `UIScene lifecycle will soon be required...` = future iOS compatibility warning
  - `Could not create a sandbox extension...` = known native/WebKit warning
  - `Unable to hide query parameters from script...` = WebKit warning, usually non-blocking
- The real slowdown is your startup path:
  1. `src/App.tsx` mounts the full provider tree, router, analytics, and global systems even on first open
  2. `src/contexts/AuthContext.tsx` immediately runs session/profile/roles/community fetches
  3. Public entry pages (`src/pages/MobileAppLanding.tsx`, `src/pages/Landing.tsx`) wait on auth `loading` and show a full-screen loader before first content
  4. `/` currently opens a heavy animated landing page, which is not a good native startup screen
  5. `syncWorshipLeaderRole()` is still on the critical path for authenticated users because `isFullyLoaded` waits for `roleSyncComplete`
- RevenueCat is already disabled, so it is not the current startup bottleneck

## One-shot fix

### 1) Make native open an app-first screen
For native only, stop using the animated marketing landing page as the startup surface.

- Native `/` should go straight to a lightweight login/dashboard shell
- Keep the current landing page behavior for web

Files:
- `src/App.tsx`
- `src/pages/MobileAppLanding.tsx`
- `src/pages/Landing.tsx`
- possibly `src/main.tsx`

### 2) Stop blocking first paint on public/native entry
Remove the full-screen wait on auth loading for public/native entry pages.

- Render the shell immediately
- Redirect only after auth state resolves
- Keep strict gating only on protected routes

Files:
- `src/pages/MobileAppLanding.tsx`
- `src/pages/Landing.tsx`
- `src/App.tsx`

### 3) Move role sync off the critical path
Keep auth correctness, but stop making first render wait for role sync.

- Run `syncWorshipLeaderRole()` after first paint / in background
- Do not hold startup behind `roleSyncComplete`
- Keep profile/role loading protection where protected screens actually need it

File:
- `src/contexts/AuthContext.tsx`

### 4) Defer nonessential startup work
Reduce extra work during first launch.

- Delay page analytics on native first load
- Keep global player and other background systems from doing unnecessary startup work
- Preserve current web behavior where appropriate

Files:
- `src/hooks/usePageAnalytics.ts`
- `src/App.tsx`
- optionally `src/contexts/MusicPlayerContext.tsx`

### 5) Fix the `UIScene` warning in the native iOS project
This is important for future iOS compatibility, but it is separate from the main startup speed issue.

- Adopt the scene-based lifecycle in the iOS native project
- I cannot patch that part from this repo snapshot because there is no `ios/` directory checked in here right now

Native files likely involved locally:
- `ios/App/App/AppDelegate.swift`
- `ios/App/App/Info.plist`
- `ios/App/App/SceneDelegate.swift` or equivalent scene manifest setup

## Technical details
```text
Current path:
App boots
-> full app shell mounts
-> AuthContext fetches session/profile/roles
-> public page waits on loading
-> heavy animated landing renders
-> role sync/analytics add more work

Target path:
Native app boots
-> lightweight app shell/login/dashboard paints immediately
-> auth hydrates in background
-> role sync/analytics run after first paint
```

## Files I expect to change
1. `src/App.tsx`
2. `src/pages/MobileAppLanding.tsx`
3. `src/pages/Landing.tsx`
4. `src/contexts/AuthContext.tsx`
5. `src/hooks/usePageAnalytics.ts`
6. Possibly `src/main.tsx`
7. Native iOS project files outside the current repo snapshot

## Expected result
- Faster first visible screen on iPhone
- No more opening the heavy marketing landing page as the native startup surface
- Less startup delay from auth, analytics, and role sync
- `UIScene` warning handled separately in the native project
- Remaining sandbox/WebKit warnings may still appear, but they should no longer be the main reason the app feels slow

## QA after implementation
- Cold launch on iPhone while signed out
- Cold launch while already signed in
- Compare time to first visible screen before/after
- Verify `/dashboard`, login, Atelier, and Institute still behave correctly
- Rebuild the native app and verify whether the `UIScene` warning disappears after the native project update</final-text>
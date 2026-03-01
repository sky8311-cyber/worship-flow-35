

## Detect Capacitor and Skip Landing Page for Native Apps

### Problem
When the iOS (or Android) app opens via Capacitor, it shows the same landing page as the web browser, asking users to pick a platform. Native app users should go directly to the login screen.

### Solution
Use Capacitor's built-in detection (`Capacitor.isNativePlatform()` from `@capacitor/core`) to check if the app is running inside a native shell. If yes, redirect to `/login` (or `/dashboard` if already logged in) instead of showing the landing page.

### Changes

**1. Update `src/pages/MobileAppLanding.tsx`**
- Import `Capacitor` from `@capacitor/core`
- In the existing `useEffect`, add a check at the top: if `Capacitor.isNativePlatform()` is true, redirect to `/login` (or `/dashboard` if user is already authenticated)
- This means native app users will never see the platform selection landing page

### How It Works

```text
App Opens
   |
   v
Is Native (Capacitor)?
   |            |
  YES           NO
   |            |
   v            v
Logged in?   Show landing page
  |    |      (platform selection)
 YES   NO
  |    |
  v    v
Dashboard  Login
```

### Technical Notes
- `Capacitor.isNativePlatform()` returns `true` only when running inside the iOS/Android native shell, and `false` in any web browser
- No new files or dependencies needed -- `@capacitor/core` is already installed
- The web browser experience remains completely unchanged


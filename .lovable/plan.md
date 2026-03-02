

## Always Redirect "/" to Login

Currently, the "/" route (MobileAppLanding) only redirects to `/login` for native apps or returning visitors. New web visitors see the full marketing landing page. You want all platforms to go straight to login.

### Change

**`src/pages/MobileAppLanding.tsx`** -- Simplify the `useEffect` to always redirect:
- If user is logged in -> `/dashboard`
- If not logged in -> `/login`
- Remove the native-only check and the returning-visitor cookie check since the behavior is now universal

The marketing landing page remains accessible at `/app` for anyone who navigates there directly.

### Technical Detail

The redirect logic in `useEffect` (lines 23-46) will be replaced with:
```
if (user) navigate("/dashboard", { replace: true });
else navigate("/login", { replace: true });
```

Only one file changes. After this, run `git pull` + `npm run build` + `npx cap sync ios` and rebuild in Xcode.

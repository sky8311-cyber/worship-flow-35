<final-text>I count 3 unsuccessful fix directions so far. The last one — moving the YouTube bridge into a React route — is the one that likely caused the current iPhone failure.

Do I know what the issue is? Yes.

What is actually broken
1. The native app now correctly loads `https://kworship.app`, so the old preview-URL/browser-auth problem is fixed.
2. The current YouTube bridge at `/youtube-embed` is not live on the published site right now, so production returns your app’s 404 page.
3. More importantly: using a React route for the bridge is unsafe here. `/youtube-embed` boots the full React app inside the iframe. Your `App` always mounts `MusicPlayerProvider` and `GlobalMusicPlayer`, and `/youtube-embed` is not excluded as a public route. If saved player state exists in localStorage, the iframe can recursively create another hidden iframe inside itself. That is the strongest match for the `JS Eval error` on iPhone.
4. `MusicPlayerContext.tsx` still has stale edge-function proxy code, so the migration is incomplete.

Best one-shot fix
1. Revert the YouTube bridge back to a true static file:
   - restore `public/youtube-embed.html`
   - handle both `mode=embed` and `mode=player` there
   - use `window.location.origin` for the YouTube origin
   - use the referrer policy expected by the bridge
   Why: a real static file is served directly and does not boot the React app inside the iframe.

2. Point native YouTube usage back to the static bridge:
   - `src/components/ui/NativeSafeYouTubeEmbed.tsx` → `/youtube-embed.html?...`
   - `src/components/music-player/GlobalYouTubeIframe.tsx` → `/youtube-embed.html?...`

3. Remove the unsafe React bridge path entirely:
   - delete `src/pages/YouTubeEmbed.tsx`
   - remove the `YouTubeEmbed` import and `/youtube-embed` route from `src/App.tsx`

4. Finish the cleanup:
   - remove `proxyHtml` state/fetch logic from `src/contexts/MusicPlayerContext.tsx`
   - keep only one playback architecture: hidden iframe + postMessage

5. Secondary cleanup in the same pass:
   - add explicit splash hide after app boot to remove the timeout warning
   - do not treat the `UIScene` and sandbox-extension lines as the blocker; they are not the YouTube/browser-fallback root cause

Required verification before rebuilding iPhone
1. Publish the frontend update first.
2. Verify these load a player page, not a 404:
   - `https://kworship.app/youtube-embed.html?videoId=dQw4w9WgXcQ&mode=embed`
   - `https://kworship.app/youtube-embed.html?videoId=dQw4w9WgXcQ&mode=player`
3. Verify a visible YouTube embed works on a real app page.
4. Verify the global music player works both:
   - from a clean session
   - after restoring saved player state

Native rollout after that
1. Pull latest locally
2. `npm run build && npx cap sync ios`
3. In Xcode: Clean Build Folder
4. Delete the app from the iPhone once, then reinstall it to clear stale WKWebView cache/localStorage
5. Re-test app launch and YouTube playback

Files to change
- `public/youtube-embed.html`
- `src/components/ui/NativeSafeYouTubeEmbed.tsx`
- `src/components/music-player/GlobalYouTubeIframe.tsx`
- `src/App.tsx`
- `src/contexts/MusicPlayerContext.tsx`
- app boot file for splash hide

Why this is the highest-confidence move
- It corrects the earlier bad assumption: real static files do work on this hosting; SPA fallback only happens when no real file exists.
- It removes the React-in-iframe recursion risk, which is the most plausible cause of the iPhone JS exception.
- It keeps the app on `kworship.app`, so it will not fall back to the preview auth flow or push the user into a browser.</final-text>
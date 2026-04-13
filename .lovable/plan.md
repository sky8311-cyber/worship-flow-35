
Do I know what the issue is? Yes.

What the actual problem is

1. The previous fix did not fully solve the iOS/WebView requirement behind Error 153.
- In `supabase/functions/youtube-player-proxy/index.ts`, the new `mode=embed` page still just renders a nested plain YouTube iframe.
- It is missing the hosted-proxy details that current iOS/WebView fixes rely on:
  - `<meta name="referrer" content="strict-origin-when-cross-origin">`
  - inner iframe `referrerpolicy`
  - a YouTube embed URL built from the proxy page’s real HTTPS origin, including `origin=window.location.origin`
- External references for this exact Capacitor/WKWebView issue describe Error 153 as “embedder identity / missing referrer”, which matches the current proxy still being too minimal.

2. One embed path still bypasses the proxy entirely.
- `src/components/worship-studio/spaces/blocks/YoutubeBlock.tsx` still renders a raw YouTube iframe via `buildYouTubeEmbedUrl(...)`.
- So Worship Studio blocks can still hit the native WKWebView problem directly.

3. The simulator may still be running an older local bundle.
- `capacitor.config.ts` uses `webDir: "dist"` and does not have a live `server.url`.
- That means the iOS app is not hot-loading the preview; it only updates after a local web build + Capacitor sync.
- That also fits the current evidence: I do not see recent requests hitting `youtube-player-proxy` in the available snapshot/log context, which suggests the simulator may not be loading the new proxy path yet.

Implementation plan

A. Fix the proxy correctly
- Update `supabase/functions/youtube-player-proxy/index.ts` so `mode=embed` serves a proper hosted embed page:
  - add referrer meta tag
  - set iframe `referrerpolicy`
  - build the inner YouTube URL inside the proxy page using `window.location.origin`
  - pass through supported player params safely (`autoplay`, `mute`, `controls`, `loop`)
  - validate/sanitize `videoId`
- Use the hosted page as the real native-safe layer, not just a wrapper around the same direct embed.

B. Finish unifying all native embeds
- Extend `src/components/ui/NativeSafeYouTubeEmbed.tsx` to support the same player options that existing callers need.
- Route native mode through the improved proxy with query params.
- Keep web mode on the normal direct embed.
- Replace the remaining raw iframe in:
  - `src/components/worship-studio/spaces/blocks/YoutubeBlock.tsx`
- Re-check for any other direct YouTube iframe usage after that audit.

C. Verify the simulator is actually running the fixed code
- After implementation, refresh the local native bundle:
  - pull latest code
  - rebuild web assets
  - `npx cap sync ios`
  - rebuild in Xcode
- If the issue still appears, clear stale app assets by cleaning the Xcode build folder or reinstalling the simulator app.
- Confirm the proxy receives requests and test these surfaces:
  - Band View
  - Public Band View
  - Institute pages
  - Worship Studio YouTube block
  - global music player

Files to update
- `supabase/functions/youtube-player-proxy/index.ts`
- `src/components/ui/NativeSafeYouTubeEmbed.tsx`
- `src/components/worship-studio/spaces/blocks/YoutubeBlock.tsx`
- possibly `src/lib/youtubeEmbed.ts` if I centralize parameter building

Technical notes
- The earlier “remove `origin`” idea was correct for direct native WebView embeds, but the hosted proxy strategy is different: the proxy page should provide a valid HTTPS origin/referrer context to YouTube.
- I do not think this needs any database change.
- The strongest proof of the fix will be:
  1. proxy requests visible in backend logs
  2. no more Error 153 in the simulator across all video entry points

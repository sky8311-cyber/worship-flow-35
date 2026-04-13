
Updated plan: stop searching for more missing embeds and instead verify and simplify the native playback path.

What I found
- The current code already routes the main visible YouTube embeds through `NativeSafeYouTubeEmbed`.
- `src/components/worship-studio/spaces/blocks/YoutubeBlock.tsx` also already uses that component.
- The global music player already loads `youtube-player-proxy` from `GlobalYouTubeIframe.tsx`.
- I do not see another obvious user-facing raw `youtube.com/embed/...` iframe still bypassing the proxy.
- The bigger clue is runtime behavior:
  - recent available client/network snapshots do not show requests to `youtube-player-proxy`
  - the available backend log snapshot for `youtube-player-proxy` does not show recent successful traffic
- So the likely issue now is not “one more missed iframe,” but that the native app is either not actually reaching the proxy or the current proxy page is still not robust enough for WKWebView.

Implementation plan
1. Add temporary diagnostics
- Add lightweight logs in:
  - `src/components/ui/NativeSafeYouTubeEmbed.tsx`
  - `src/components/music-player/GlobalYouTubeIframe.tsx`
  - `supabase/functions/youtube-player-proxy/index.ts`
- Log selected mode, videoId, chosen iframe URL, and whether the proxy page fully loads.
- This will tell us definitively whether the simulator is using the proxy path.

2. Simplify the proxy implementation
- Refactor `youtube-player-proxy/index.ts` so the visible embed path uses the simplest possible hosted-player page with correct referrer/origin handling.
- Unify the native strategy instead of maintaining a special wrapper that may still be fragile in WKWebView.
- Keep strict videoId sanitization and safe query param handling.

3. Harden the hidden global player
- Review `GlobalYouTubeIframe.tsx` and align its iframe attributes with the visible working path.
- Remove anything unnecessary that could interfere in native WebView playback while preserving postMessage controls.

4. Add a user-safe fallback
- If native playback still fails or never becomes ready, show a fallback action like “Open in YouTube” instead of leaving a broken player.
- This keeps the app usable even when a specific video cannot embed.

5. Make testing deterministic
- For final simulator verification, use the bundled Capacitor build instead of relying on the remote preview URL.
- Treat `capacitor.config.ts` as the source of truth and verify the simulator is loading the exact updated app bundle.

Files to update
- `supabase/functions/youtube-player-proxy/index.ts`
- `src/components/ui/NativeSafeYouTubeEmbed.tsx`
- `src/components/music-player/GlobalYouTubeIframe.tsx`
- possibly `src/contexts/MusicPlayerContext.tsx` to clean up readiness/proxy handling
- `capacitor.config.ts` if needed for reliable local native testing

Success criteria
- Backend logs show proxy requests from the simulator
- No Error 153 in:
  - Band View
  - Public Band View
  - Institute chapter videos
  - Worship Studio YouTube blocks
  - global music player
- Failed videos fall back gracefully instead of showing a dead player

Technical note
- Based on the current code audit, I do not think the next fix is another iframe replacement.
- The right next step is to prove the native path with logging, simplify the proxy page, and verify against the bundled native app.

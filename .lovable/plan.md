
Do I know what the issue is? Yes.

1. Score images: the private-bucket migration is only half-finished.
- Display fixes were added in a few places, but several upload flows still save `scores` files as `publicUrl` values instead of bucket paths:
  - `src/components/SongDialog.tsx`
  - `src/components/songs/SmartSongFlow.tsx`
  - `src/components/CSVImportDialog.tsx`
- There are also still raw score usages that bypass signed URLs, such as:
  - `src/components/dashboard/UpcomingServicesWidget.tsx`
  - `src/components/ai-set-builder/AISetBuilderResult.tsx`
- Result: newly uploaded scores remain fragile/broken after the bucket became private, especially in native app flows.

2. YouTube error 153: native iOS embeds are using YouTube in ways that don’t provide a stable valid web referrer/origin.
- Direct embeds in pages like `src/pages/BandView.tsx` and `src/pages/PublicBandView.tsx` pass `origin=${window.location.origin}`. In native app this is not a normal HTTPS web origin.
- The global player uses `srcDoc` in `src/components/music-player/GlobalYouTubeIframe.tsx`, which is also a bad fit for YouTube’s client-identification requirements.
- That matches the “153 Video Player configuration error” behavior in WKWebView.

Implementation plan

A. Finish the private-score migration properly
- Change all score upload flows to store bucket paths, not `publicUrl`.
- Harden `src/utils/scoreUrl.ts` so it normalizes:
  - legacy public URLs
  - signed URLs
  - path-only values
  - leading `scores/` variants
- Refactor `src/components/score/SignedScoreImage.tsx` to use an effect-based signed-url flow instead of setting state during render.

B. Remove remaining raw score access
- Replace remaining raw `<img src={file_url}>` and raw `window.open(score_url)` usage with signed-url helpers.
- Audit and update the remaining score consumers, starting with:
  - `src/components/dashboard/UpcomingServicesWidget.tsx`
  - `src/components/ai-set-builder/AISetBuilderResult.tsx`
  - any other direct `file_url` / `score_file_url` image or open-in-new-tab paths found during the audit

C. Make YouTube native-safe
- Create one shared YouTube embed/player strategy instead of many direct iframes.
- Update the hidden/global player to load the hosted proxy by real `src=...`, not `srcDoc`.
- Update `supabase/functions/youtube-player-proxy/index.ts` to include a native-safe hosted player page with explicit YouTube config.
- Replace direct YouTube iframes in:
  - `src/pages/BandView.tsx`
  - `src/pages/PublicBandView.tsx`
  - `src/components/worship-studio/spaces/blocks/YoutubeBlock.tsx`
  - other remaining direct YouTube iframe renderers
- For native iOS/Android, add a graceful fallback: if inline playback still fails, show preview + “Open in YouTube” using the existing deep-link helper instead of leaving a broken embed.

D. Verify the actual native flow
- Test recent score uploads in song library, band view, preview dialog, and print/PDF.
- Test YouTube playback in both:
  - visible embedded video sections
  - global music player
- Because the repo does not include the committed `ios/` folder here, after implementation the local native app must be refreshed with:
  - latest code pull
  - web rebuild
  - `npx cap sync ios`
  - rebuild in Xcode/simulator

Technical notes
- I do not think this needs a database schema change first.
- If I find old records that still need cleanup after the code fix, I can add a small data-normalization migration as a follow-up, but the main fix is in the app code paths above.

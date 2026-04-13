

# Fix YouTube Error 153 in Native App

## Root Cause

**ALL YouTube iframes** across the app still use direct `https://www.youtube.com/embed/` URLs. In Capacitor's WKWebView, the page origin is `capacitor://localhost`, which YouTube rejects → Error 153.

The global music player was updated to use the proxy, but **6 files** still have direct YouTube embeds that were never switched:

| File | Embed Count |
|------|------------|
| `src/pages/BandView.tsx` | 3 iframes |
| `src/pages/PublicBandView.tsx` | 3 iframes |
| `src/pages/InstituteChapter.tsx` | 1 helper function |
| `src/components/institute/BlockRenderer.tsx` | 1 helper function |
| `src/components/institute/faculty/ChapterBlockEditor.tsx` | 1 helper function |
| `src/components/worship-studio/grid/WidgetRenderer.tsx` | 1 iframe |

## Solution

### 1. Extend the proxy edge function with an `embed` mode

Add a `mode=embed` query param to `youtube-player-proxy/index.ts` that renders a simple full-screen YouTube player (no postMessage communication needed). This serves from a real HTTPS origin, which YouTube accepts.

### 2. Create a reusable `NativeSafeYouTubeEmbed` component

A shared React component that:
- Detects if running in a native app (Capacitor)
- **Native**: uses the proxy URL (`/functions/v1/youtube-player-proxy?videoId=X&mode=embed`)
- **Web browser**: uses direct `youtube.com/embed/` URL (works fine with normal web origins)
- Accepts props for title, className, allowFullScreen

### 3. Replace all 6 files

Replace every direct `youtube.com/embed/` iframe with the new component. No visual or behavioral changes — same sizing, same allow attributes, same fallback logic.

### Files to modify
- `supabase/functions/youtube-player-proxy/index.ts` — add embed mode
- New: `src/components/ui/NativeSafeYouTubeEmbed.tsx`
- `src/pages/BandView.tsx` — 3 iframes → component
- `src/pages/PublicBandView.tsx` — 3 iframes → component
- `src/pages/InstituteChapter.tsx` — use `buildYouTubeEmbedUrl` or component
- `src/components/institute/BlockRenderer.tsx` — same
- `src/components/institute/faculty/ChapterBlockEditor.tsx` — same
- `src/components/worship-studio/grid/WidgetRenderer.tsx` — same


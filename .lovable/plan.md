

# Fix YouTube Error 153 — Root Cause Found

## The Real Problem

I tested the proxy edge function with curl and discovered **Supabase's gateway adds its own restrictive headers** to edge function responses:

```
Content-Security-Policy: default-src 'none'; sandbox
Content-Type: text/plain
```

This means:
- The HTML page served by the proxy is treated as plain text, not rendered as HTML
- Even if it were rendered, the `sandbox` CSP blocks all iframes, scripts, and external resources
- **The entire proxy-via-edge-function approach cannot work** because Supabase's infrastructure prevents HTML pages from functioning when served from edge functions

The Xcode log confirms this: `WebPage::runJavaScriptInFrameInScriptWorld: Request to run JavaScript failed` — the JS inside the proxy HTML is blocked by the CSP sandbox.

## Solution

Host the YouTube embed page as a **static HTML file** in the app's `public/` directory instead of serving it from an edge function.

Since your native app loads from `https://...lovableproject.com` (the server URL in capacitor.config), a static file at `/youtube-embed.html` will:
1. Be served with proper `Content-Type: text/html`
2. Have no restrictive CSP sandbox
3. Have a valid HTTPS origin that YouTube accepts
4. Work identically in both web and native

## Files to Change

1. **Create `public/youtube-embed.html`** — Self-contained YouTube embed page that reads `videoId` and player options from URL query params, sets `origin` to its own HTTPS origin, and embeds the YouTube iframe. Two variants in one file: simple embed mode and full IFrame API player mode (for the global music player with postMessage control).

2. **Update `src/components/ui/NativeSafeYouTubeEmbed.tsx`** — In native mode, point to `/youtube-embed.html?videoId=xxx&mode=embed` instead of the edge function URL.

3. **Update `src/components/music-player/GlobalYouTubeIframe.tsx`** — Point to `/youtube-embed.html?videoId=xxx&mode=player` instead of the edge function URL.

4. **Keep `supabase/functions/youtube-player-proxy/index.ts`** — Leave it for any non-iframe API uses (e.g., fetching video metadata in the future), but it will no longer serve the HTML embed pages.

## Why This Will Work

- Static files in `public/` are served by Vite/the web server with correct MIME types and no sandbox CSP
- The app's HTTPS origin (`lovableproject.com`) is a valid YouTube embed origin
- No edge function gateway interference
- Same approach works for both the visible embeds and the hidden global music player

## After Implementation

You will need to:
1. Pull the latest code
2. `npm run build && npx cap sync ios`
3. Rebuild in Xcode and test


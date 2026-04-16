

# Fix Native App: Use kworship.app + Fix youtube-embed.html 404

## Two Problems Found

### Problem 1: Wrong server URL
`capacitor.config.ts` points to the Lovable preview URL (`lovableproject.com`), which requires Lovable authentication. When the native WebView can't handle the auth redirect, it opens an external browser. You want the app to load from your official domain `kworship.app`.

### Problem 2: youtube-embed.html returns 404 in production
I verified that `https://kworship.app/youtube-embed.html` and `https://worship-flow-35.lovable.app/youtube-embed.html` both return a 404 page. This is because Lovable's SPA hosting routes all unknown paths to `index.html`, which renders the React app's 404 page instead of serving the static HTML file.

The static `public/youtube-embed.html` approach **cannot work** on Lovable hosting because SPA fallback intercepts it.

## Solution

### Step 1: Update capacitor.config.ts
Change the server URL to your official domain:
```typescript
server: {
  url: 'https://kworship.app?forceHideBadge=true',
  cleartext: true,
}
```

### Step 2: Move youtube-embed.html into a React route
Since Lovable SPA hosting won't serve raw HTML files, convert the YouTube embed page into a standalone React route at `/youtube-embed` that renders outside the normal app layout. This route will:
- Parse query params (`videoId`, `mode`, `autoplay`, etc.)
- Render a minimal full-screen page with the YouTube iframe/API player
- Have no app chrome (no header, no sidebar)

### Step 3: Update iframe references
Change `/youtube-embed.html?...` to `/youtube-embed?...` in:
- `NativeSafeYouTubeEmbed.tsx`
- `GlobalYouTubeIframe.tsx`

### Step 4: Remove the static file
Delete `public/youtube-embed.html` since it's unused.

## Files to Change
1. `capacitor.config.ts` — update server URL to `https://kworship.app`
2. `src/pages/YouTubeEmbed.tsx` — new standalone page (no app layout)
3. `src/App.tsx` — add route `/youtube-embed`
4. `src/components/ui/NativeSafeYouTubeEmbed.tsx` — update path
5. `src/components/music-player/GlobalYouTubeIframe.tsx` — update path
6. Delete `public/youtube-embed.html`

## Why This Will Work
- `kworship.app` is your published domain with no auth gate
- A React route at `/youtube-embed` will be properly served by SPA hosting
- The page renders a bare YouTube player with no app chrome
- The `origin` sent to YouTube will be `https://kworship.app` — a valid HTTPS origin


<final-text>Do I know what the issue is? Yes.

Root cause
1. The current method cannot succeed as designed:
   - `public/youtube-embed.html` exists in the repo and even in `dist/`
   - but both public hosts return the app’s 404 page for `/youtube-embed.html`
   - so this host is not exposing that file the way we assumed
2. The native app is still booting the entire remote website through `capacitor.config.ts -> server.url = https://kworship.app?...`
   - that means app launch depends on the published site and its script injection behavior
   - this is the unstable path still producing the iPhone `JS Eval error`
3. So the real fix is to split responsibilities:
   - the native app should boot from the local bundled app
   - only the YouTube bridge should use a public HTTPS page

Best next movement
1. Stop loading the whole app from the remote site
   - remove production `server.url` from `capacitor.config.ts` or keep it dev-only
   - let Capacitor load local `dist` assets again
   Why: this removes the remote-site boot path that is failing on iPhone.

2. Replace the static-file bridge with a standalone SPA bridge route
   - use `/youtube-embed` instead of `/youtube-embed.html`
   - do not rely on `public/youtube-embed.html`
   - in `src/main.tsx`, detect `window.location.pathname === "/youtube-embed"` and render only a tiny bridge component
   - do not mount `App`, router, auth, query client, music player, landing page, or global UI for that route
   Why: the host clearly serves SPA routes, but not this extra html file. A standalone route can work if it bypasses the full app shell.

3. Point native YouTube iframes to an absolute HTTPS bridge URL
   - update `NativeSafeYouTubeEmbed.tsx`
   - update `GlobalYouTubeIframe.tsx`
   - for native only, use a public HTTPS bridge URL such as:
     `https://worship-flow-35.lovable.app/youtube-embed?...`
   - keep normal web embeds for normal web usage
   Why: the app runs locally, while YouTube still gets a valid HTTPS origin.

4. Keep the bridge minimal and isolated
   - move the current bridge logic from `public/youtube-embed.html` into the standalone bridge component
   - preserve both `mode=embed` and `mode=player`
   - preserve the postMessage API used by the global player
   - validate `event.origin` against the chosen bridge host
   - keep `strict-origin-when-cross-origin`
   - keep native player persistence disabled
   - remove the unused `Capacitor` import from `MobileAppLanding.tsx`
   Why: this avoids the earlier React-in-iframe recursion problem while also removing extra native risk on boot.

5. Verify in this order
   - publish frontend
   - confirm `https://worship-flow-35.lovable.app/youtube-embed?videoId=dQw4w9WgXcQ&mode=embed` shows a player, not 404
   - rebuild native: `git pull`, `npm run build`, `npx cap sync ios`
   - clean Xcode build folder
   - delete app from iPhone
   - reinstall and test

What this plan fixes
- iPhone app boot no longer depends on the remote website
- YouTube still runs from a valid HTTPS origin
- no dependence on a static html file that the host is not serving
- no fallback to opening the browser
- no recursive full-app boot inside the iframe

Files to change
- `capacitor.config.ts`
- `src/main.tsx`
- new standalone bridge component/page
- `src/components/ui/NativeSafeYouTubeEmbed.tsx`
- `src/components/music-player/GlobalYouTubeIframe.tsx`
- `src/pages/MobileAppLanding.tsx`

Technical details
- The earlier “publish it and retry” diagnosis was incomplete. I now have stronger evidence: the bridge file is not publicly reachable even on the current public hosts, so that architecture itself is wrong here.
- The safest bridge host to use first is the public Lovable domain, because it is directly tied to frontend publish state. After it is stable, you can optionally point the bridge to `kworship.app` too.
- The crucial design change is not “route vs html” by itself; it is “standalone bridge route rendered before the full app shell.” That is what avoids both hosting 404s and iframe recursion.</final-text>
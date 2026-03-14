import { Capacitor } from '@capacitor/core';
import { AppLauncher } from '@capacitor/app-launcher';

/**
 * Extracts a YouTube video ID from any common YouTube URL format.
 * Supports: watch, short, embed, youtu.be, music.youtube.com
 */
export function extractYouTubeVideoId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/(?:watch\?.*v=|embed\/|v\/|shorts\/)|youtu\.be\/|music\.youtube\.com\/watch\?.*v=)([^#&?\s]{11})/
  );
  return match ? match[1] : null;
}

// Debounce guard — prevent double-fires within 1s
let lastOpenTime = 0;

/**
 * Opens a YouTube URL, attempting the native app first on mobile devices.
 *
 * Strategy per platform:
 * - Capacitor native → AppLauncher (vnd.youtube://)
 * - Android browser  → intent:// scheme (handles app/browser fallback natively)
 * - iOS browser      → same-tab navigate to https://youtu.be/{id} (triggers Universal Link)
 *                       with visibility-change guard for fallback
 * - Desktop          → window.open in new tab
 */
export async function openYouTubeUrl(url: string) {
  // Debounce: ignore rapid successive calls
  const now = Date.now();
  if (now - lastOpenTime < 1000) {
    console.log('[YT] Debounced — ignoring rapid call');
    return;
  }
  lastOpenTime = now;

  const videoId = extractYouTubeVideoId(url);
  const canonicalUrl = videoId
    ? `https://www.youtube.com/watch?v=${videoId}`
    : url;

  console.log('[YT] openYouTubeUrl called', { url, videoId, canonicalUrl });

  // ─── 1. Capacitor native app → use AppLauncher plugin ───
  if (Capacitor.isNativePlatform() && videoId) {
    console.log('[YT] Capacitor native path');
    try {
      const { value } = await AppLauncher.canOpenUrl({ url: 'vnd.youtube://' });
      if (value) {
        await AppLauncher.openUrl({ url: `vnd.youtube://${videoId}` });
        return;
      }
    } catch (e) {
      console.log('[YT] AppLauncher error:', e);
    }
    // Fallback: open in system browser
    window.open(canonicalUrl, '_blank');
    return;
  }

  // ─── 2. Detect mobile browser ───
  const ua = navigator.userAgent;
  const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);

  if (!isMobile) {
    // ─── 3. Desktop → always new tab ───
    console.log('[YT] Desktop: new tab');
    window.open(canonicalUrl, '_blank');
    return;
  }

  // ─── 4. Android browser → intent:// scheme ───
  const isAndroid = /Android/i.test(ua);
  if (isAndroid && videoId) {
    console.log('[YT] Android: intent://');
    window.location.href =
      `intent://watch?v=${videoId}#Intent;scheme=https;package=com.google.android.youtube;S.browser_fallback_url=${encodeURIComponent(canonicalUrl)};end`;
    return;
  }

  // ─── 5. iOS browser → same-tab Universal Link with fallback guard ───
  if (videoId) {
    console.log('[YT] iOS browser: same-tab Universal Link');

    // Use youtu.be short URL — iOS reliably triggers Universal Links for this domain
    // when navigated in the same tab (not _blank).
    const universalLinkUrl = `https://youtu.be/${videoId}`;

    // Track whether the page loses visibility (= app switched successfully)
    let didLeave = false;
    const onLeave = () => { didLeave = true; };

    document.addEventListener('visibilitychange', onLeave);
    window.addEventListener('pagehide', onLeave);
    window.addEventListener('blur', onLeave);

    // Navigate same-tab — this is key for iOS Universal Links
    window.location.assign(universalLinkUrl);

    // Fallback: if the app didn't open after 2.5s, the page is still visible.
    // Navigate same-tab to YouTube web as fallback.
    setTimeout(() => {
      document.removeEventListener('visibilitychange', onLeave);
      window.removeEventListener('pagehide', onLeave);
      window.removeEventListener('blur', onLeave);

      if (!didLeave) {
        console.log('[YT] iOS fallback: app did not open, navigating to web');
        window.location.assign(canonicalUrl);
      } else {
        console.log('[YT] iOS: app opened successfully');
      }
    }, 2500);
    return;
  }

  // ─── 6. Fallback: no videoId extracted, open as-is same-tab on mobile ───
  console.log('[YT] Mobile fallback: same-tab navigate');
  window.location.assign(canonicalUrl);
}

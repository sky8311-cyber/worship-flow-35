import { Capacitor } from '@capacitor/core';
import { AppLauncher } from '@capacitor/app-launcher';

/**
 * Opens a YouTube URL, attempting the native app first on mobile devices.
 * - Capacitor native: uses AppLauncher to open YouTube app directly
 * - Android browser: intent:// scheme handles app/browser fallback natively
 * - iOS browser: tries vnd.youtube://, falls back to new tab
 * - Desktop: always opens in a new tab
 */
export async function openYouTubeUrl(url: string) {
  const videoId = url.match(/(?:youtube\.com\/.*v=|youtu\.be\/)([^#&?\s]+)/)?.[1];

  // Capacitor native app — use AppLauncher plugin
  if (Capacitor.isNativePlatform() && videoId) {
    try {
      const { value } = await AppLauncher.canOpenUrl({ url: 'vnd.youtube://' });
      if (value) {
        await AppLauncher.openUrl({ url: `vnd.youtube://${videoId}` });
        return;
      }
    } catch {
      // plugin unavailable or error — fall through
    }
    window.open(url, "_blank");
    return;
  }

  // Mobile browser
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isMobile && videoId) {
    const isAndroid = /Android/i.test(navigator.userAgent);

    if (isAndroid) {
      window.location.href =
        `intent://watch?v=${videoId}#Intent;scheme=https;package=com.google.android.youtube;S.browser_fallback_url=${encodeURIComponent(url)};end`;
    } else {
      let appOpened = false;
      const onHidden = () => { if (document.hidden) appOpened = true; };
      document.addEventListener("visibilitychange", onHidden);
      window.location.href = `vnd.youtube://${videoId}`;
      setTimeout(() => {
        document.removeEventListener("visibilitychange", onHidden);
        if (!appOpened) window.open(url, "_blank");
      }, 500);
    }
    return;
  }

  window.open(url, "_blank");
}

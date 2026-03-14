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

  console.log('[YT] openYouTubeUrl called', { url, videoId });
  console.log('[YT] isNative:', Capacitor.isNativePlatform());
  console.log('[YT] userAgent:', navigator.userAgent);

  // Capacitor native app — use AppLauncher plugin
  if (Capacitor.isNativePlatform() && videoId) {
    console.log('[YT] Taking Capacitor native path');
    try {
      const { value } = await AppLauncher.canOpenUrl({ url: 'vnd.youtube://' });
      console.log('[YT] canOpenUrl result:', value);
      if (value) {
        await AppLauncher.openUrl({ url: `vnd.youtube://${videoId}` });
        return;
      }
    } catch (e) {
      console.log('[YT] AppLauncher error:', e);
    }
    window.open(url, "_blank");
    return;
  }

  // Mobile browser
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isMobile && videoId) {
    const isAndroid = /Android/i.test(navigator.userAgent);
    console.log('[YT] Taking mobile browser path', { isAndroid, isMobile });

    if (isAndroid) {
      console.log('[YT] Android: using intent://');
      window.location.href =
        `intent://watch?v=${videoId}#Intent;scheme=https;package=com.google.android.youtube;S.browser_fallback_url=${encodeURIComponent(url)};end`;
    } else {
      // iOS: use vnd.youtube:// scheme to open native app
      console.log('[YT] iOS: using vnd.youtube:// scheme');
      window.location.href = `vnd.youtube://${videoId}`;
      // Fallback: if app doesn't open within 2s, open in browser
      setTimeout(() => {
        window.open(url, "_blank");
      }, 2000);
    }
    return;
  }

  console.log('[YT] Desktop fallback: window.open');
  window.open(url, "_blank");
}

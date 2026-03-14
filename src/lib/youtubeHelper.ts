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

/**
 * Builds the best launch URL for a YouTube video based on platform.
 * - iOS browser  → https://youtu.be/{id} (Universal Link, most reliable for app handoff)
 * - Android browser → intent:// scheme with browser fallback
 * - Desktop/other → canonical https://www.youtube.com/watch?v={id}
 */
export function buildYouTubeLaunchHref(url: string): string {
  const videoId = extractYouTubeVideoId(url);
  const canonical = videoId
    ? `https://www.youtube.com/watch?v=${videoId}`
    : url;

  if (Capacitor.isNativePlatform()) {
    // Native apps handle their own launch via openYouTubeUrl
    return canonical;
  }

  const ua = navigator.userAgent;
  const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);

  if (!isMobile || !videoId) {
    return canonical;
  }

  const isAndroid = /Android/i.test(ua);
  if (isAndroid) {
    return `intent://watch?v=${videoId}#Intent;scheme=https;package=com.google.android.youtube;S.browser_fallback_url=${encodeURIComponent(canonical)};end`;
  }

  // iOS — use youtu.be Universal Link for best app-handoff reliability
  return `https://youtu.be/${videoId}`;
}

/**
 * Returns props for an <a> element that opens YouTube optimally per platform.
 * - Mobile: target="_self" (same-tab, required for Universal Links / intent)
 * - Desktop: target="_blank" with rel="noopener noreferrer"
 */
export function getYouTubeAnchorProps(url: string): {
  href: string;
  target: string;
  rel?: string;
  onClick?: (e: React.MouseEvent) => void;
} {
  const href = buildYouTubeLaunchHref(url);
  const ua = navigator.userAgent;
  const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);

  if (Capacitor.isNativePlatform()) {
    return {
      href: '#',
      target: '_self',
      onClick: (e: React.MouseEvent) => {
        e.preventDefault();
        openYouTubeUrl(url);
      },
    };
  }

  if (isMobile) {
    return {
      href,
      target: '_self',
    };
  }

  return {
    href,
    target: '_blank',
    rel: 'noopener noreferrer',
  };
}

// Debounce guard — prevent double-fires within 1s
let lastOpenTime = 0;

/**
 * Programmatic opener — kept for Capacitor native and edge cases.
 * For browser contexts, prefer using getYouTubeAnchorProps() with real <a> tags.
 */
export async function openYouTubeUrl(url: string) {
  const now = Date.now();
  if (now - lastOpenTime < 1000) {
    return;
  }
  lastOpenTime = now;

  const videoId = extractYouTubeVideoId(url);
  const canonicalUrl = videoId
    ? `https://www.youtube.com/watch?v=${videoId}`
    : url;

  // ─── 1. Capacitor native app → use AppLauncher plugin ───
  if (Capacitor.isNativePlatform() && videoId) {
    try {
      const { value } = await AppLauncher.canOpenUrl({ url: 'vnd.youtube://' });
      if (value) {
        await AppLauncher.openUrl({ url: `vnd.youtube://${videoId}` });
        return;
      }
    } catch (e) {
      console.log('[YT] AppLauncher error:', e);
    }
    window.open(canonicalUrl, '_blank');
    return;
  }

  // ─── 2. Browser fallback — use same logic as anchor props ───
  const ua = navigator.userAgent;
  const isMobile = /iPhone|iPad|iPod|Android/i.test(ua);

  if (!isMobile) {
    window.open(canonicalUrl, '_blank');
    return;
  }

  // Mobile: same-tab navigate using the best launch URL
  window.location.assign(buildYouTubeLaunchHref(url));
}

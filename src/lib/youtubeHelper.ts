/**
 * Opens a YouTube URL, attempting the native app first on mobile devices.
 * - Android: intent:// scheme handles app/browser fallback natively (no extra tab)
 * - iOS: tries vnd.youtube://, falls back to new tab only if app didn't open
 * - Desktop: always opens in a new tab
 */
export function openYouTubeUrl(url: string) {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile) {
    const videoId = url.match(/(?:youtube\.com\/.*v=|youtu\.be\/)([^#&?\s]+)/)?.[1];
    if (videoId) {
      const isAndroid = /Android/i.test(navigator.userAgent);

      if (isAndroid) {
        // Android intent:// — OS opens app if installed, browser fallback otherwise
        window.location.href =
          `intent://watch?v=${videoId}#Intent;scheme=https;package=com.google.android.youtube;S.browser_fallback_url=${encodeURIComponent(url)};end`;
      } else {
        // iOS: try deep link, detect if app opened via visibilitychange
        let appOpened = false;
        const onHidden = () => {
          if (document.hidden) appOpened = true;
        };
        document.addEventListener("visibilitychange", onHidden);

        window.location.href = `vnd.youtube://${videoId}`;

        setTimeout(() => {
          document.removeEventListener("visibilitychange", onHidden);
          if (!appOpened) {
            window.open(url, "_blank");
          }
        }, 500);
      }
      return;
    }
  }

  window.open(url, "_blank");
}

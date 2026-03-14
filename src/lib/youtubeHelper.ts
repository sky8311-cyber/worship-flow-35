/**
 * Opens a YouTube URL, attempting the native app first on mobile devices.
 * Uses multiple signals (visibilitychange, pagehide, blur) to detect app launch,
 * plus elapsed-time validation to prevent stale fallbacks after background suspension.
 */
export function openYouTubeUrl(url: string) {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile) {
    const videoId = url.match(/(?:youtube\.com\/.*v=|youtu\.be\/)([^#&?\s]+)/)?.[1];
    if (videoId) {
      let cancelled = false;
      const startedAt = Date.now();

      const cleanup = () => {
        if (cancelled) return;
        cancelled = true;
        clearTimeout(fallbackTimer);
        document.removeEventListener("visibilitychange", onVisChange);
        window.removeEventListener("pagehide", cleanup);
        window.removeEventListener("blur", cleanup);
      };

      const fallbackTimer = setTimeout(() => {
        const elapsed = Date.now() - startedAt;
        if (cancelled || elapsed > 1000) {
          cleanup();
          return;
        }
        cleanup();
        // Use same-tab navigation instead of window.open to avoid new tab on return
        window.location.assign(url);
      }, 1500);

      const onVisChange = () => {
        if (document.hidden) {
          cleanup();
        }
      };

      document.addEventListener("visibilitychange", onVisChange);
      window.addEventListener("pagehide", cleanup);
      window.addEventListener("blur", cleanup);

      window.location.href = `vnd.youtube://${videoId}`;
      return;
    }
  }

  window.open(url, "_blank");
}

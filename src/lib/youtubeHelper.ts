/**
 * Opens a YouTube URL, attempting the native app first on mobile devices.
 * Uses visibilitychange to detect if the app launched successfully,
 * and only falls back to a browser tab if the app didn't open.
 */
export function openYouTubeUrl(url: string) {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile) {
    const videoId = url.match(/(?:youtube\.com\/.*v=|youtu\.be\/)([^#&?\s]+)/)?.[1];
    if (videoId) {
      let appOpened = false;
      const onVisChange = () => { if (document.hidden) appOpened = true; };
      document.addEventListener("visibilitychange", onVisChange);

      window.location.href = `vnd.youtube://${videoId}`;

      setTimeout(() => {
        document.removeEventListener("visibilitychange", onVisChange);
        if (!appOpened) window.open(url, "_blank");
      }, 1500);
      return;
    }
  }

  window.open(url, "_blank");
}

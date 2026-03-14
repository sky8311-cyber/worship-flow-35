/**
 * Opens a YouTube URL, attempting the native app first on mobile devices.
 */
export function openYouTubeUrl(url: string) {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile) {
    const videoId = url.match(/(?:youtube\.com\/.*v=|youtu\.be\/)([^#&?\s]+)/)?.[1];
    if (videoId) {
      window.location.href = `vnd.youtube://${videoId}`;
      setTimeout(() => {
        window.open(url, "_blank");
      }, 500);
      return;
    }
  }

  window.open(url, "_blank");
}

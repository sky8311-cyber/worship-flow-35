/**
 * Build a native-safe YouTube embed URL.
 * Removes `origin=` param which causes Error 153 in WKWebView/Capacitor.
 */
export function buildYouTubeEmbedUrl(videoId: string, opts?: {
  autoplay?: boolean;
  controls?: boolean;
  rel?: boolean;
  loop?: boolean;
  mute?: boolean;
}): string {
  const params = new URLSearchParams();
  params.set("rel", "0");
  params.set("modestbranding", "1");
  params.set("playsinline", "1");
  params.set("enablejsapi", "1");
  
  if (opts?.autoplay) { params.set("autoplay", "1"); }
  if (opts?.mute) { params.set("mute", "1"); }
  if (opts?.controls === false) { params.set("controls", "0"); }
  if (opts?.loop) { params.set("loop", "1"); params.set("playlist", videoId); }
  
  return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
}

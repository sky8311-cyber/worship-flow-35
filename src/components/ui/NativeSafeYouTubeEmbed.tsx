import { isNativePlatform } from "@/utils/platform";

interface NativeSafeYouTubeEmbedProps {
  videoId: string;
  title?: string;
  className?: string;
}

/**
 * YouTube embed that works on both web and native (Capacitor).
 * On native, routes through the proxy edge function to avoid Error 153
 * caused by YouTube rejecting the capacitor://localhost origin.
 */
export function NativeSafeYouTubeEmbed({ videoId, title, className }: NativeSafeYouTubeEmbedProps) {
  const isNative = isNativePlatform();
  
  const src = isNative
    ? `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/youtube-player-proxy?videoId=${encodeURIComponent(videoId)}&mode=embed`
    : `https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1&enablejsapi=1`;

  return (
    <iframe
      className={className}
      src={src}
      title={title || "YouTube video"}
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
    />
  );
}

import { isNativePlatform } from "@/utils/platform";
import { buildYouTubeEmbedUrl } from "@/lib/youtubeEmbed";

export interface NativeSafeYouTubeEmbedProps {
  videoId: string;
  title?: string;
  className?: string;
  autoplay?: boolean;
  mute?: boolean;
  controls?: boolean;
  loop?: boolean;
  onPointerDown?: (e: React.PointerEvent) => void;
  onError?: () => void;
}

/**
 * YouTube embed that works on both web and native (Capacitor).
 * On native, routes through the proxy edge function to avoid Error 153.
 */
export function NativeSafeYouTubeEmbed({
  videoId,
  title,
  className,
  autoplay,
  mute,
  controls = true,
  loop,
  onPointerDown,
  onError,
}: NativeSafeYouTubeEmbedProps) {
  const isNative = isNativePlatform();

  let src: string;
  if (isNative) {
    const params = new URLSearchParams({
      videoId,
      mode: 'embed',
      autoplay: autoplay ? '1' : '0',
      mute: mute ? '1' : '0',
      controls: controls ? '1' : '0',
      loop: loop ? '1' : '0',
    });
    src = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/youtube-player-proxy?${params.toString()}`;
  } else {
    src = buildYouTubeEmbedUrl(videoId, { autoplay, mute, controls, loop });
  }

  return (
    <iframe
      className={className}
      src={src}
      title={title || "YouTube video"}
      frameBorder="0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      referrerPolicy="strict-origin-when-cross-origin"
      allowFullScreen
      onPointerDown={onPointerDown}
      onError={onError}
    />
  );
}

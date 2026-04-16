import { useState, useEffect } from "react";
import { isNativePlatform } from "@/utils/platform";
import { buildYouTubeEmbedUrl } from "@/lib/youtubeEmbed";
import { ExternalLink } from "lucide-react";

const BRIDGE_HOST = "https://worship-flow-35.lovable.app";

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
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    setLoadFailed(false);
  }, [videoId]);

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
    src = `${BRIDGE_HOST}/youtube-embed?${params.toString()}`;
  } else {
    src = buildYouTubeEmbedUrl(videoId, { autoplay, mute, controls, loop });
  }

  const handleError = () => {
    console.error('[NativeSafeYouTubeEmbed] iframe load error for videoId:', videoId);
    setLoadFailed(true);
    onError?.();
  };

  if (loadFailed) {
    return (
      <div className={`${className} flex flex-col items-center justify-center bg-black/90 text-white gap-3`}>
        <p className="text-sm text-muted-foreground">영상을 불러올 수 없습니다</p>
        <a
          href={`https://www.youtube.com/watch?v=${videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          YouTube에서 열기
        </a>
      </div>
    );
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
      onError={handleError}
    />
  );
}

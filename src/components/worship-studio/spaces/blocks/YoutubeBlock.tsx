import { useState } from "react";
import { Youtube } from "lucide-react";
import { NativeSafeYouTubeEmbed } from "@/components/ui/NativeSafeYouTubeEmbed";

function extractVideoId(url: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

interface Props {
  content: Record<string, any>;
  isOwner: boolean;
  onContentChange: (p: Record<string, any>) => void;
}

export function YoutubeBlock({ content, isOwner, onContentChange }: Props) {
  const url = (content.url as string) || "";
  const videoId = extractVideoId(url);
  const [iframeError, setIframeError] = useState(false);

  if (!videoId) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-muted-foreground p-3">
        <Youtube className="h-8 w-8 text-red-500" />
        <span className="text-xs">YouTube URL을 설정하세요</span>
        {url && (
          <span className="text-[10px] text-red-400">유효하지 않은 URL</span>
        )}
      </div>
    );
  }

  if (iframeError) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-muted-foreground p-3">
        <Youtube className="h-8 w-8 text-red-500" />
        <span className="text-xs">영상을 불러올 수 없습니다</span>
        <button
          className="text-[10px] text-blue-500 underline"
          onClick={(e) => { e.stopPropagation(); setIframeError(false); }}
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <NativeSafeYouTubeEmbed
      videoId={videoId}
      className="w-full h-full rounded"
      autoplay={content.autoplay}
      mute={content.mute || content.autoplay}
      controls={!content.hideControls}
      loop={content.loop}
      onPointerDown={(e) => e.stopPropagation()}
      onError={() => setIframeError(true)}
    />
  );
}

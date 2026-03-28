import { useState } from "react";
import { Youtube } from "lucide-react";

function extractVideoId(url: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return m ? m[1] : null;
}

function buildEmbedUrl(videoId: string, content: Record<string, any>): string {
  const params = new URLSearchParams();
  if (content.autoplay) { params.set("autoplay", "1"); params.set("mute", "1"); }
  if (content.mute) params.set("mute", "1");
  if (content.hideControls) params.set("controls", "0");
  if (content.hideRelated) params.set("rel", "0");
  if (content.loop) { params.set("loop", "1"); params.set("playlist", videoId); }
  const qs = params.toString();
  return `https://www.youtube.com/embed/${videoId}${qs ? `?${qs}` : ""}`;
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
    <iframe
      src={buildEmbedUrl(videoId, content)}
      className="w-full h-full rounded"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      onPointerDown={(e) => e.stopPropagation()}
      onError={() => setIframeError(true)}
    />
  );
}

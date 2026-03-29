import { useState } from "react";
import { Music, Play, Pause } from "lucide-react";

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

export function MusicBlock({ content }: Props) {
  const ytUrl = (content.youtube_url as string) || "";
  const title = (content.title as string) || "제목 없음";
  const artist = (content.artist as string) || "";
  const videoId = extractVideoId(ytUrl);
  const [playing, setPlaying] = useState(false);

  const thumbUrl = videoId
    ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
    : null;

  return (
    <div
      className="h-full w-full flex items-center gap-3 p-3 overflow-hidden"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Thumbnail */}
      <div className="h-12 w-12 rounded-md bg-muted flex-shrink-0 overflow-hidden">
        {thumbUrl ? (
          <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Music className="h-5 w-5 text-muted-foreground" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate text-foreground">{title}</p>
        {artist && <p className="text-[10px] text-muted-foreground truncate">{artist}</p>}
      </div>

      {/* Play button (visual only, no actual YT player for simplicity) */}
      <button
        className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
        onClick={() => setPlaying(!playing)}
      >
        {playing ? <Pause className="h-4 w-4 text-primary" /> : <Play className="h-4 w-4 text-primary" />}
      </button>
    </div>
  );
}

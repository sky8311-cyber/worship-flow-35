import { Youtube } from "lucide-react";

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

export function YoutubeBlock({ content }: Props) {
  const url = (content.url as string) || "";
  const videoId = extractVideoId(url);

  if (!videoId) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
        <Youtube className="h-8 w-8 text-red-500" />
        <span className="text-xs">YouTube URL을 설정하세요</span>
      </div>
    );
  }

  return (
    <iframe
      src={`https://www.youtube.com/embed/${videoId}`}
      className="w-full h-full rounded"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      allowFullScreen
      onPointerDown={(e) => e.stopPropagation()}
    />
  );
}

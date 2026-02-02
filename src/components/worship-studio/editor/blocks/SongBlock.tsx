import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Music, Play, Plus, X } from "lucide-react";

// Helper to extract video ID from YouTube URL
function extractVideoId(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([^&?\s]{11})/);
  return match ? match[1] : null;
}

interface SongBlockProps {
  songId: string;
  isEditing?: boolean;
  onRemove?: () => void;
}

export function SongBlock({ songId, isEditing, onRemove }: SongBlockProps) {
  const { language } = useTranslation();
  const { startPlaylist } = useMusicPlayer();
  
  const { data: song, isLoading } = useQuery({
    queryKey: ["song-block", songId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("songs")
        .select("id, title, artist, default_key, youtube_url")
        .eq("id", songId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!songId,
  });
  
  const handlePlay = () => {
    if (song?.youtube_url) {
      const videoId = extractVideoId(song.youtube_url);
      if (videoId) {
        startPlaylist([{
          videoId,
          title: song.title,
          artist: song.artist || "",
          position: 0
        }], song.title, song.id, 0);
      }
    }
  };
  
  if (isLoading) {
    return <Skeleton className="h-20 w-full rounded-lg" />;
  }
  
  if (!song) {
    return (
      <div className="p-4 rounded-lg border border-destructive/50 bg-destructive/10 text-sm text-destructive">
        {language === "ko" ? "곡을 찾을 수 없습니다" : "Song not found"}
      </div>
    );
  }
  
  return (
    <div className="relative group my-2">
      <div className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors">
        <div className="flex-shrink-0 h-12 w-12 rounded-md bg-primary/10 flex items-center justify-center">
          <Music className="h-6 w-6 text-primary" />
        </div>
        
        <div className="flex-1 min-w-0">
          <h4 className="font-medium truncate">{song.title}</h4>
          <p className="text-sm text-muted-foreground truncate">
            {song.artist || (language === "ko" ? "아티스트 미상" : "Unknown artist")}
          </p>
        </div>
        
        {song.default_key && (
          <span className="text-xs px-2 py-1 rounded-full bg-muted flex-shrink-0">
            Key: {song.default_key}
          </span>
        )}
        
        <div className="flex items-center gap-2 flex-shrink-0">
          {song.youtube_url && (
            <Button 
              size="sm" 
              variant="outline" 
              onClick={handlePlay}
              className="gap-1"
            >
              <Play className="h-3 w-3" />
              {language === "ko" ? "재생" : "Play"}
            </Button>
          )}
          <Button 
            size="sm" 
            variant="ghost"
            className="gap-1"
          >
            <Plus className="h-3 w-3" />
            {language === "ko" ? "셋에 추가" : "Add to Set"}
          </Button>
        </div>
      </div>
      
      {isEditing && onRemove && (
        <button
          onClick={onRemove}
          className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

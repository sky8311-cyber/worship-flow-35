import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Music, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoomBGMSelectorProps {
  selectedSongId: string | null;
  onSelect: (songId: string | null) => void;
}

interface Song {
  id: string;
  title: string;
  artist: string | null;
  youtube_url: string | null;
}

export function RoomBGMSelector({ selectedSongId, onSelect }: RoomBGMSelectorProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  
  // Search songs with YouTube URLs
  const { data: songs, isLoading } = useQuery({
    queryKey: ["songs-for-bgm", searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("songs")
        .select("id, title, artist, youtube_url")
        .not("youtube_url", "is", null)
        .eq("status", "published")
        .order("title", { ascending: true })
        .limit(50);
      
      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,artist.ilike.%${searchQuery}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Song[];
    },
  });
  
  // Get selected song details
  const { data: selectedSong } = useQuery({
    queryKey: ["song", selectedSongId],
    queryFn: async () => {
      if (!selectedSongId) return null;
      const { data, error } = await supabase
        .from("songs")
        .select("id, title, artist, youtube_url")
        .eq("id", selectedSongId)
        .single();
      if (error) throw error;
      return data as Song;
    },
    enabled: !!selectedSongId,
  });
  
  return (
    <div className="space-y-4">
      {/* Current Selection */}
      {selectedSong && (
        <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-center gap-3">
            <Music className="h-5 w-5 text-primary" />
            <div>
              <p className="font-medium">{selectedSong.title}</p>
              {selectedSong.artist && (
                <p className="text-sm text-muted-foreground">{selectedSong.artist}</p>
              )}
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => onSelect(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("studio.searchSongs")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>
      
      {/* Song List */}
      <ScrollArea className="h-64 border rounded-lg">
        {isLoading ? (
          <div className="p-2 space-y-2">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : songs?.length ? (
          <div className="p-2 space-y-1">
            {songs.map((song) => {
              const isSelected = song.id === selectedSongId;
              return (
                <button
                  key={song.id}
                  onClick={() => onSelect(isSelected ? null : song.id)}
                  className={cn(
                    "w-full flex items-center justify-between p-3 rounded-lg transition-colors text-left",
                    isSelected 
                      ? "bg-primary/10 border border-primary/20" 
                      : "hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Music className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-medium truncate">{song.title}</p>
                      {song.artist && (
                        <p className="text-sm text-muted-foreground truncate">
                          {song.artist}
                        </p>
                      )}
                    </div>
                  </div>
                  {isSelected && (
                    <Check className="h-4 w-4 text-primary flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            {t("studio.noSongsWithYouTube")}
          </div>
        )}
      </ScrollArea>
      
      <p className="text-xs text-muted-foreground">
        {t("studio.bgmNote")}
      </p>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Music, Search, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudioBGMSelectorProps {
  selectedSongId: string | null;
  onSelect: (songId: string | null) => void;
}

export function StudioBGMSelector({ selectedSongId, onSelect }: StudioBGMSelectorProps) {
  const { language } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  const { data: songs, isLoading } = useQuery({
    queryKey: ["songs-with-youtube", debouncedSearch],
    queryFn: async () => {
      let query = supabase
        .from("songs")
        .select("id, title, artist, youtube_url")
        .eq("status", "published")
        .not("youtube_url", "is", null)
        .neq("youtube_url", "")
        .order("title")
        .limit(500);

      if (debouncedSearch) {
        query = query.or(`title.ilike.%${debouncedSearch}%,artist.ilike.%${debouncedSearch}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });
  
  const selectedSong = songs?.find(s => s.id === selectedSongId);
  
  return (
    <div className="space-y-3">
      {/* Current selection */}
      {selectedSong && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
          <Music className="h-5 w-5 text-primary" />
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{selectedSong.title}</p>
            {selectedSong.artist && (
              <p className="text-xs text-muted-foreground truncate">{selectedSong.artist}</p>
            )}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 shrink-0"
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
          placeholder={language === "ko" ? "곡 검색..." : "Search songs..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>
      
      {/* Song list */}
      <ScrollArea className="h-64 rounded-lg border">
        {isLoading ? (
          <div className="p-2 space-y-2">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : !songs?.length ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {language === "ko" ? "YouTube 링크가 있는 곡이 없습니다" : "No songs with YouTube links"}
          </div>
        ) : (
          <div className="p-1">
            {songs.map((song) => (
              <button
                key={song.id}
                onClick={() => onSelect(song.id === selectedSongId ? null : song.id)}
                className={cn(
                  "w-full flex items-center gap-3 p-2 rounded-md text-left transition-colors",
                  song.id === selectedSongId 
                    ? "bg-primary/10" 
                    : "hover:bg-muted/50"
                )}
              >
                <Music className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{song.title}</p>
                  {song.artist && (
                    <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
                  )}
                </div>
                {song.id === selectedSongId && (
                  <Check className="h-4 w-4 text-primary shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, Music, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface Song {
  id: string;
  title: string;
  artist: string | null;
  default_key: string | null;
}

interface SongSelectorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (song: Song) => void;
}

export function SongSelectorDialog({ open, onOpenChange, onSelect }: SongSelectorDialogProps) {
  const { language } = useTranslation();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);
  
  const { data: songs, isLoading } = useQuery({
    queryKey: ["songs-for-embed", debouncedSearch],
    queryFn: async () => {
      let query = supabase
        .from("songs")
        .select("id, title, artist, default_key")
        .eq("is_private", false)
        .eq("status", "published")
        .order("title")
        .limit(50);
      
      if (debouncedSearch) {
        query = query.or(`title.ilike.%${debouncedSearch}%,artist.ilike.%${debouncedSearch}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as Song[];
    },
    enabled: open,
  });
  
  const handleSelect = (song: Song) => {
    setSelectedId(song.id);
    onSelect(song);
    onOpenChange(false);
    setSearch("");
    setDebouncedSearch("");
    setSelectedId(null);
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {language === "ko" ? "찬양곡 삽입" : "Insert Song"}
          </DialogTitle>
        </DialogHeader>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={language === "ko" ? "곡 제목 또는 아티스트 검색..." : "Search by title or artist..."}
            className="pl-10"
            autoFocus
          />
        </div>
        
        <ScrollArea className="h-80 mt-2">
          {isLoading ? (
            <div className="space-y-2 p-2">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} className="h-14 w-full rounded-lg" />
              ))}
            </div>
          ) : !songs?.length ? (
            <div className="py-12 text-center text-muted-foreground">
              <Music className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>{language === "ko" ? "검색 결과가 없습니다" : "No songs found"}</p>
            </div>
          ) : (
            <div className="space-y-1 p-2">
              {songs.map(song => (
                <button
                  key={song.id}
                  onClick={() => handleSelect(song)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                    selectedId === song.id
                      ? "bg-primary/10 border border-primary"
                      : "hover:bg-muted border border-transparent"
                  )}
                >
                  <div className="flex-shrink-0 h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                    <Music className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{song.title}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {song.artist || (language === "ko" ? "아티스트 미상" : "Unknown artist")}
                    </p>
                  </div>
                  {song.default_key && (
                    <span className="text-xs px-2 py-1 rounded-full bg-muted">
                      {song.default_key}
                    </span>
                  )}
                  {selectedId === song.id && (
                    <Check className="h-5 w-5 text-primary flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

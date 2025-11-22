import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Music, Youtube, FileText } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { SongDialog } from "./SongDialog";
import { useTranslation } from "@/hooks/useTranslation";
import { toast } from "@/hooks/use-toast";

interface SongSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (song: any) => void;
}

export const SongSelector = ({ open, onClose, onSelect }: SongSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showSongDialog, setShowSongDialog] = useState(false);
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { data: songs, isLoading } = useQuery({
    queryKey: ["songs-selector", searchQuery, selectedCategory],
    queryFn: async () => {
      let query = supabase
        .from("songs")
        .select(`
          *,
          set_songs(
            service_set_id,
            service_sets(date)
          ),
          song_scores(file_url)
        `)
        .order("title");

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,subtitle.ilike.%${searchQuery}%,artist.ilike.%${searchQuery}%,tags.ilike.%${searchQuery}%`);
      }

      if (selectedCategory !== "all") {
        query = query.eq("category", selectedCategory);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const getLastUsedDate = (song: any) => {
    if (!song.set_songs || song.set_songs.length === 0) return null;
    const dates = song.set_songs
      .map((ss: any) => ss.service_sets?.date)
      .filter(Boolean)
      .sort()
      .reverse();
    return dates[0] ? new Date(dates[0]) : null;
  };

  const handleSongDialogClose = () => {
    setShowSongDialog(false);
    queryClient.invalidateQueries({ queryKey: ["songs-selector"] });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <DialogTitle>{t("songSelector.title")}</DialogTitle>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setShowSongDialog(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            {t("songSelector.addNewSong")}
          </Button>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="곡 제목, 부제, 아티스트, 태그로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="카테고리 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 카테고리</SelectItem>
              <SelectItem value="오프닝">오프닝</SelectItem>
              <SelectItem value="찬양">찬양</SelectItem>
              <SelectItem value="헌금">헌금</SelectItem>
              <SelectItem value="응답">응답</SelectItem>
              <SelectItem value="파송">파송</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1 overflow-y-auto mt-4">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
          ) : songs && songs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {songs.map((song) => {
                const lastUsed = getLastUsedDate(song);
                const usageCount = song.set_songs?.length || 0;
                const getYouTubeThumbnail = (url: string | null) => {
                  if (!url) return null;
                  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
                  return match ? `https://img.youtube.com/vi/${match[1]}/mqdefault.jpg` : null;
                };

                return (
                  <Card
                    key={song.id}
                    className="hover:shadow-lg transition-shadow overflow-hidden"
                  >
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-bold text-xl mb-1">{song.title}</h3>
                        {song.subtitle && (
                          <p className="text-sm text-muted-foreground italic mb-2">{song.subtitle}</p>
                        )}
                        {song.artist && (
                          <p className="text-base text-muted-foreground font-medium">{song.artist}</p>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {song.default_key && (
                          <Badge variant="outline" className="text-sm">Key: {song.default_key}</Badge>
                        )}
                        {song.category && (
                          <Badge className="text-sm">{song.category}</Badge>
                        )}
                        {song.tags && (
                          <Badge variant="secondary" className="text-sm">{song.tags.split(',')[0]}</Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                        <span>{lastUsed ? `사용: ${usageCount}회` : '미사용'}</span>
                        {song.youtube_url && <Badge variant="outline" className="text-xs">🎥 유튜브</Badge>}
                        {song.song_scores?.[0] && <Badge variant="outline" className="text-xs">📄 악보</Badge>}
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        {song.youtube_url && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(song.youtube_url, "_blank");
                            }}
                          >
                            <Youtube className="w-4 h-4 mr-1" />
                            유튜브
                          </Button>
                        )}
                        {song.song_scores?.[0]?.file_url && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(song.song_scores[0].file_url, "_blank");
                            }}
                          >
                            <FileText className="w-4 h-4 mr-1" />
                            악보
                          </Button>
                        )}
                        <Button 
                          size="sm"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelect(song);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-1" />
                          추가
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              검색 결과가 없습니다
            </div>
          )}
        </div>
      </DialogContent>

      <SongDialog 
        open={showSongDialog}
        onOpenChange={setShowSongDialog}
        song={undefined}
        onClose={handleSongDialogClose}
      />
    </Dialog>
  );
};

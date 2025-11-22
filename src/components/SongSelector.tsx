import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Music, Youtube, FileText, ChevronLeft, ChevronRight } from "lucide-react";
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
  const [selectedScoreIndexes, setSelectedScoreIndexes] = useState<Record<string, number>>({});
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
          song_scores(id, key, file_url, page_number, position)
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

  const getYouTubeThumbnail = (url: string | null) => {
    if (!url) return null;
    const videoIdMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    return videoIdMatch ? `https://img.youtube.com/vi/${videoIdMatch[1]}/mqdefault.jpg` : null;
  };

  const navigateToPreviousScore = (songId: string) => {
    setSelectedScoreIndexes(prev => ({
      ...prev,
      [songId]: Math.max(0, (prev[songId] || 0) - 1)
    }));
  };

  const navigateToNextScore = (songId: string) => {
    const song = songs?.find(s => s.id === songId);
    if (!song?.song_scores) return;
    
    const uniqueKeys = [...new Set(song.song_scores.map((s: any) => s.key))].filter(Boolean);
    setSelectedScoreIndexes(prev => ({
      ...prev,
      [songId]: Math.min(uniqueKeys.length - 1, (prev[songId] || 0) + 1)
    }));
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

                // Group scores by key variation
                const scoresByKey = song.song_scores?.reduce((acc: any, score: any) => {
                  if (!score.key) return acc;
                  if (!acc[score.key]) acc[score.key] = [];
                  acc[score.key].push(score);
                  return acc;
                }, {}) || {};

                const uniqueKeys = Object.keys(scoresByKey).sort();
                const currentIndex = selectedScoreIndexes[song.id] || 0;
                const currentKey = uniqueKeys[currentIndex];
                const currentScores = scoresByKey[currentKey] || [];
                const currentScoreUrl = currentScores[0]?.file_url;

                return (
                  <Card key={song.id} className="hover:shadow-lg transition-shadow overflow-hidden">
                    <div className="p-4">
                      {/* Title, subtitle, artist */}
                      <div>
                        <h3 className="font-bold text-xl mb-1">{song.title}</h3>
                        {song.subtitle && (
                          <p className="text-sm text-muted-foreground italic mb-2">{song.subtitle}</p>
                        )}
                        {song.artist && (
                          <p className="text-base text-muted-foreground mb-3 font-medium">{song.artist}</p>
                        )}
                      </div>
                      
                      {/* Badges */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {song.default_key && (
                          <Badge variant="outline" className="text-xs">
                            Key: {song.default_key}
                          </Badge>
                        )}
                        {song.category && (
                          <Badge variant="secondary" className="text-xs">
                            {song.category}
                          </Badge>
                        )}
                        {song.tags && song.tags.split(',').slice(0, 2).map((tag: string) => (
                          <Badge key={tag.trim()} variant="outline" className="text-xs">
                            {tag.trim()}
                          </Badge>
                        ))}
                        {song.tags && song.tags.split(',').length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{song.tags.split(',').length - 2} more
                          </Badge>
                        )}
                      </div>

                      {/* Usage info */}
                      <div className="flex items-center gap-2 mb-3 text-xs text-muted-foreground">
                        <span>{lastUsed ? `사용: ${usageCount}회` : '미사용'}</span>
                        {song.youtube_url && <Badge variant="outline" className="text-xs">🎥 유튜브</Badge>}
                        {song.song_scores?.[0] && <Badge variant="outline" className="text-xs">📄 악보</Badge>}
                      </div>
                      
                      {/* THUMBNAIL SECTION - ABOVE BUTTONS */}
                      {(currentScoreUrl || song.youtube_url) && (
                        <div className="relative w-full aspect-[3/4] bg-muted mb-3 rounded-md overflow-hidden group">
                          <img 
                            src={currentScoreUrl || getYouTubeThumbnail(song.youtube_url) || '/placeholder.svg'}
                            alt={`${song.title} preview`}
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder.svg';
                            }}
                          />
                          
                          {/* Navigation Arrows (only if multiple variations) */}
                          {uniqueKeys.length > 1 && (
                            <>
                              <Button
                                size="icon"
                                variant="secondary"
                                className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 opacity-80 hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigateToPreviousScore(song.id);
                                }}
                              >
                                <ChevronLeft className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="secondary"
                                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 opacity-80 hover:opacity-100"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigateToNextScore(song.id);
                                }}
                              >
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          
                          {/* Key Badge */}
                          {currentKey && (
                            <Badge 
                              variant="secondary" 
                              className="absolute bottom-2 right-2 text-xs"
                            >
                              Key: {currentKey} {uniqueKeys.length > 1 && `(${currentIndex + 1}/${uniqueKeys.length})`}
                            </Badge>
                          )}
                        </div>
                      )}
                      
                      {/* BUTTONS - BELOW THUMBNAIL */}
                      <div className="flex gap-2">
                        {song.youtube_url && (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              window.open(song.youtube_url!, '_blank');
                            }}
                          >
                            <Youtube className="w-4 h-4 mr-1" />
                            유튜브
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

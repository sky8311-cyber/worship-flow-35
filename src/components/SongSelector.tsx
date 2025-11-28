import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Music, Youtube, FileText, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { SongDialog } from "./SongDialog";
import { ScorePreviewDialog } from "./ScorePreviewDialog";
import { useTranslation } from "@/hooks/useTranslation";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

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
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewSong, setPreviewSong] = useState<any>(null);
  const [selectedSongs, setSelectedSongs] = useState<any[]>([]);
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

  const toggleSongSelection = (song: any) => {
    setSelectedSongs(prev => {
      const isSelected = prev.some(s => s.id === song.id);
      if (isSelected) {
        return prev.filter(s => s.id !== song.id);
      } else {
        return [...prev, song];
      }
    });
  };

  const isSongSelected = (songId: string) => {
    return selectedSongs.some(s => s.id === songId);
  };

  const handleBulkAddToSet = () => {
    onSelect(selectedSongs);
    toast({
      title: "성공",
      description: `${selectedSongs.length}곡을 예배세트에 추가했습니다`,
    });
    setSelectedSongs([]);
  };

  const handleSongDialogClose = () => {
    setShowSongDialog(false);
    queryClient.invalidateQueries({ queryKey: ["songs-selector"] });
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        setSelectedSongs([]);
      }
      onClose();
    }}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 pr-12">
          <DialogTitle>{t("songSelector.title")}</DialogTitle>
          
          <div className="flex gap-2">
            {selectedSongs.length > 0 && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      size="sm" 
                      onClick={handleBulkAddToSet}
                      className="relative"
                      aria-label="담기"
                    >
                      <Plus className="w-4 h-4 md:mr-1" />
                      <span className="hidden md:inline">담기</span>
                      <Badge variant="secondary" className="ml-2 bg-white text-primary">
                        {selectedSongs.length}
                      </Badge>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="md:hidden">
                    <p>담기</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setShowSongDialog(true)}
                    aria-label="새 곡 추가"
                  >
                    <Plus className="w-4 h-4 md:mr-1" />
                    <span className="hidden md:inline">{t("songSelector.addNewSong")}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="md:hidden">
                  <p>새 곡 추가</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <SearchInput
            placeholder="곡 제목, 부제, 아티스트, 태그로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
              {songs.map((song) => {
                const lastUsed = getLastUsedDate(song);
                const usageCount = song.set_songs?.length || 0;

                // Group scores by key variation (multi-key scores)
                const scoresByKey = song.song_scores?.reduce((acc: any, score: any) => {
                  if (!score.key) return acc;
                  if (!acc[score.key]) acc[score.key] = [];
                  acc[score.key].push(score);
                  return acc;
                }, {}) || {};

                // Derive current key and score URL, with legacy fallback to score_file_url
                let uniqueKeys = Object.keys(scoresByKey).sort();
                let currentIndex = selectedScoreIndexes[song.id] || 0;
                let currentKey = uniqueKeys[currentIndex];
                const currentScores = currentKey ? scoresByKey[currentKey] || [] : [];
                let currentScoreUrl: string | null = currentScores[0]?.file_url || null;

                // Fallback for older songs that only use songs.score_file_url (single score)
                if (!currentScoreUrl && song.score_file_url) {
                  currentScoreUrl = song.score_file_url;
                  currentKey = song.default_key || undefined;
                  uniqueKeys = currentKey ? [currentKey] : [];
                  currentIndex = 0;
                }

                return (
                  <Card 
                    key={song.id} 
                    className={cn(
                      "hover:shadow-lg transition-shadow overflow-hidden",
                      isSongSelected(song.id) && "ring-2 ring-primary"
                    )}
                  >
                    <div className="p-4">
                      {/* Two-column layout: Descriptions left, Thumbnail right */}
                      <div className="flex gap-3 mb-3">
                        {/* LEFT: Descriptions column */}
                        <div className="flex-1 min-w-0 space-y-3">
                          {/* Title, subtitle, artist */}
                          <div>
                            <h3 className="font-bold text-xl mb-1 truncate">{song.title}</h3>
                            {song.subtitle && (
                              <p className="text-sm text-muted-foreground italic mb-2 truncate">{song.subtitle}</p>
                            )}
                            {song.artist && (
                              <p className="text-base text-muted-foreground font-medium truncate">{song.artist}</p>
                            )}
                          </div>

                          {/* Badges */}
                          <div className="flex flex-wrap gap-2">
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
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{lastUsed ? `사용: ${usageCount}회` : '미사용'}</span>
                            {song.youtube_url && <Badge variant="outline" className="text-xs">🎥 유튜브</Badge>}
                            {song.song_scores?.[0] && <Badge variant="outline" className="text-xs">📄 악보</Badge>}
                          </div>
                        </div>

                        {/* RIGHT: Thumbnail column (only if score exists) */}
                        {currentScoreUrl && (
                          <div className="flex-shrink-0">
                            <div 
                              className="w-20 md:w-32 aspect-[3/4] bg-muted rounded-md overflow-hidden relative group cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewSong(song);
                                setShowPreviewDialog(true);
                              }}
                            >
                              <img
                                src={currentScoreUrl}
                                alt={`${song.title} score`}
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
                                    className="absolute left-1 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigateToPreviousScore(song.id);
                                    }}
                                  >
                                    <ChevronLeft className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="secondary"
                                    className="absolute right-1 top-1/2 -translate-y-1/2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigateToNextScore(song.id);
                                    }}
                                  >
                                    <ChevronRight className="w-3 h-3" />
                                  </Button>
                                </>
                              )}

                              {/* Key Badge */}
                              {currentKey && (
                                <Badge variant="secondary" className="absolute bottom-1 right-1 text-[10px] px-1 py-0">
                                  {currentKey} {uniqueKeys.length > 1 && `(${currentIndex + 1}/${uniqueKeys.length})`}
                                </Badge>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Buttons - Full width BELOW two-column section */}
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
                          variant={isSongSelected(song.id) ? "default" : "outline"}
                          className="flex-1 relative"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSongSelection(song);
                          }}
                        >
                          {isSongSelected(song.id) ? (
                            <>
                              <Check className="w-4 h-4 mr-1" />
                              선택됨
                            </>
                          ) : (
                            <>
                              <Plus className="w-4 h-4 mr-1" />
                              추가
                            </>
                          )}
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

      <ScorePreviewDialog
        open={showPreviewDialog}
        onOpenChange={setShowPreviewDialog}
        scoreUrl={previewSong?.score_file_url || null}
        songTitle={previewSong?.title || ""}
        songId={previewSong?.id}
      />
    </Dialog>
  );
};

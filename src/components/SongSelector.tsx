import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Youtube, ChevronLeft, ChevronRight, Check, Pencil, LayoutGrid, LayoutList, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SongDialog } from "./SongDialog";
import { ScorePreviewDialog } from "./ScorePreviewDialog";
import { useTranslation } from "@/hooks/useTranslation";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SelectedSongWithVariation {
  song: any;
  selectedKey?: string;
  selectedScoreUrl?: string;
}

interface SongSelectorProps {
  open: boolean;
  onClose: () => void;
  onSelect: (song: any, selectedKey?: string, selectedScoreUrl?: string) => void;
}

const MUSICAL_KEYS = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];

export const SongSelector = ({ open, onClose, onSelect }: SongSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const [selectedKey, setSelectedKey] = useState<string>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("title-asc");
  const [viewMode, setViewMode] = useState<"card" | "table">("card");
  const [showSongDialog, setShowSongDialog] = useState(false);
  const [selectedScoreIndexes, setSelectedScoreIndexes] = useState<Record<string, number>>({});
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [previewSong, setPreviewSong] = useState<any>(null);
  const [selectedSongs, setSelectedSongs] = useState<SelectedSongWithVariation[]>([]);
  const [editSong, setEditSong] = useState<any>(null);
  const queryClient = useQueryClient();
  const { t } = useTranslation();

  const { data: songs, isLoading } = useQuery({
    queryKey: ["songs-selector", searchQuery, selectedCategory, selectedLanguage],
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

      if (selectedLanguage !== "all") {
        query = query.eq("language", selectedLanguage);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Extract unique tags from all songs
  const uniqueTags = useMemo(() => {
    if (!songs) return [];
    const tagSet = new Set<string>();
    songs.forEach(song => {
      if (song.tags) {
        song.tags.split(',').forEach((tag: string) => {
          const trimmed = tag.trim();
          if (trimmed) tagSet.add(trimmed);
        });
      }
    });
    return Array.from(tagSet).sort();
  }, [songs]);

  // Filter and sort songs client-side
  const filteredAndSortedSongs = useMemo(() => {
    if (!songs) return [];
    
    let result = songs.filter(song => {
      // Key filter
      if (selectedKey !== "all" && song.default_key !== selectedKey) return false;
      
      // Tags filter
      if (selectedTags.length > 0) {
        const songTags = song.tags?.split(',').map((t: string) => t.trim()) || [];
        if (!selectedTags.some(t => songTags.includes(t))) return false;
      }
      
      return true;
    });

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case "title-asc":
          return (a.title || "").localeCompare(b.title || "", "ko");
        case "title-desc":
          return (b.title || "").localeCompare(a.title || "", "ko");
        case "recent":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "artist":
          return (a.artist || "").localeCompare(b.artist || "", "ko");
        default:
          return 0;
      }
    });

    return result;
  }, [songs, selectedKey, selectedTags, sortBy]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const clearAllFilters = () => {
    setSelectedCategory("all");
    setSelectedLanguage("all");
    setSelectedKey("all");
    setSelectedTags([]);
    setSortBy("title-asc");
    setSearchQuery("");
  };

  const hasActiveFilters = selectedCategory !== "all" || selectedLanguage !== "all" || selectedKey !== "all" || selectedTags.length > 0;

  const getLastUsedDate = (song: any) => {
    if (!song.set_songs || song.set_songs.length === 0) return null;
    const dates = song.set_songs
      .map((ss: any) => ss.service_sets?.date)
      .filter(Boolean)
      .sort()
      .reverse();
    return dates[0] ? new Date(dates[0]) : null;
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

  const toggleSongSelection = (song: any, selectedKey?: string, selectedScoreUrl?: string) => {
    setSelectedSongs(prev => {
      const isSelected = prev.some(s => s.song.id === song.id);
      if (isSelected) {
        return prev.filter(s => s.song.id !== song.id);
      } else {
        return [...prev, { song, selectedKey, selectedScoreUrl }];
      }
    });
  };

  const isSongSelected = (songId: string) => {
    return selectedSongs.some(s => s.song.id === songId);
  };

  const handleBulkAddToSet = () => {
    selectedSongs.forEach(({ song, selectedKey, selectedScoreUrl }) => {
      onSelect(song, selectedKey, selectedScoreUrl);
    });
    toast({
      title: "성공",
      description: `${selectedSongs.length}곡을 예배세트에 추가했습니다`,
    });
    setSelectedSongs([]);
    onClose();
  };

  const handleEditSong = (song: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditSong(song);
  };

  const handleSongDialogClose = () => {
    setShowSongDialog(false);
    setEditSong(null);
    queryClient.invalidateQueries({ queryKey: ["songs-selector"] });
  };

  const getSongScoreInfo = (song: any) => {
    const scoresByKey = song.song_scores?.reduce((acc: any, score: any) => {
      if (!score.key) return acc;
      if (!acc[score.key]) acc[score.key] = [];
      acc[score.key].push(score);
      return acc;
    }, {}) || {};

    let uniqueKeys = Object.keys(scoresByKey).sort();
    let currentIndex = selectedScoreIndexes[song.id] || 0;
    let currentKey = uniqueKeys[currentIndex];
    const currentScores = currentKey ? scoresByKey[currentKey] || [] : [];
    let currentScoreUrl: string | null = currentScores[0]?.file_url || null;

    if (!currentScoreUrl && song.score_file_url) {
      currentScoreUrl = song.score_file_url;
      currentKey = song.default_key || undefined;
      uniqueKeys = currentKey ? [currentKey] : [];
      currentIndex = 0;
    }

    return { uniqueKeys, currentIndex, currentKey, currentScoreUrl };
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        setSelectedSongs([]);
      }
      onClose();
    }}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pr-12">
          <DialogTitle>{t("songSelector.title")}</DialogTitle>
          
          <div className="flex gap-2">
            {selectedSongs.length > 0 && (
              <Button size="sm" onClick={handleBulkAddToSet}>
                <Plus className="w-4 h-4 mr-1" />
                담기
                <Badge variant="secondary" className="ml-2 bg-white text-primary">
                  {selectedSongs.length}
                </Badge>
              </Button>
            )}
            
            <Button size="sm" variant="outline" onClick={() => setShowSongDialog(true)}>
              <Plus className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">{t("songSelector.addNewSong")}</span>
            </Button>
          </div>
        </DialogHeader>

        {/* Search and Filters */}
        <div className="space-y-3">
          <SearchInput
            placeholder="곡 제목, 부제, 아티스트, 태그로 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* Filter Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="카테고리" />
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

            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="언어" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 언어</SelectItem>
                <SelectItem value="KO">한국어</SelectItem>
                <SelectItem value="EN">English</SelectItem>
                <SelectItem value="KO/EN">한/영</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedKey} onValueChange={setSelectedKey}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Key" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">전체 키</SelectItem>
                {MUSICAL_KEYS.map(key => (
                  <SelectItem key={key} value={key}>{key}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="정렬" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="title-asc">제목 (ㄱ-ㅎ)</SelectItem>
                <SelectItem value="title-desc">제목 (ㅎ-ㄱ)</SelectItem>
                <SelectItem value="recent">최근 추가</SelectItem>
                <SelectItem value="artist">아티스트</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Tag Chips */}
          {uniqueTags.length > 0 && (
            <div className="flex flex-wrap gap-1 max-h-16 overflow-y-auto">
              {uniqueTags.slice(0, 20).map(tag => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
              {uniqueTags.length > 20 && (
                <Badge variant="outline" className="text-xs text-muted-foreground">
                  +{uniqueTags.length - 20}
                </Badge>
              )}
            </div>
          )}

          {/* Active Filters & View Mode Toggle */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 flex-wrap flex-1">
              {hasActiveFilters && (
                <>
                  {selectedCategory !== "all" && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      {selectedCategory}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedCategory("all")} />
                    </Badge>
                  )}
                  {selectedLanguage !== "all" && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      {selectedLanguage}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedLanguage("all")} />
                    </Badge>
                  )}
                  {selectedKey !== "all" && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      Key: {selectedKey}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedKey("all")} />
                    </Badge>
                  )}
                  {selectedTags.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs gap-1">
                      {tag}
                      <X className="h-3 w-3 cursor-pointer" onClick={() => toggleTag(tag)} />
                    </Badge>
                  ))}
                  <Button variant="ghost" size="sm" className="text-xs h-6 px-2" onClick={clearAllFilters}>
                    초기화
                  </Button>
                </>
              )}
              <span className="text-xs text-muted-foreground ml-auto">
                {filteredAndSortedSongs.length}곡
              </span>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex gap-1 border rounded-md p-0.5">
              <Button
                variant={viewMode === "card" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("card")}
                className="h-7 w-7"
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "table" ? "secondary" : "ghost"}
                size="icon"
                onClick={() => setViewMode("table")}
                className="h-7 w-7"
              >
                <LayoutList className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Song List */}
        <div className="flex-1 overflow-y-auto mt-3">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">로딩 중...</div>
          ) : filteredAndSortedSongs.length > 0 ? (
            viewMode === "card" ? (
              // Card View
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredAndSortedSongs.map((song) => {
                  const lastUsed = getLastUsedDate(song);
                  const usageCount = song.set_songs?.length || 0;
                  const { uniqueKeys, currentIndex, currentKey, currentScoreUrl } = getSongScoreInfo(song);

                  return (
                    <Card 
                      key={song.id} 
                      className={cn(
                        "hover:shadow-lg transition-shadow overflow-hidden",
                        isSongSelected(song.id) && "ring-2 ring-primary"
                      )}
                    >
                      <div className="p-3">
                        <div className="flex gap-3 mb-2">
                          <div className="flex-1 min-w-0 space-y-2">
                            <div>
                              <h3 className="font-bold text-base truncate">{song.title}</h3>
                              {song.subtitle && (
                                <p className="text-xs text-muted-foreground italic truncate">{song.subtitle}</p>
                              )}
                              {song.artist && (
                                <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-1">
                              {song.default_key && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {song.default_key}
                                </Badge>
                              )}
                              {song.category && (
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                  {song.category}
                                </Badge>
                              )}
                              {song.language && (
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {song.language}
                                </Badge>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                              <span>{lastUsed ? `${usageCount}회 사용` : '미사용'}</span>
                              {song.youtube_url && <span>🎥</span>}
                              {(song.song_scores?.[0] || song.score_file_url) && <span>📄</span>}
                            </div>
                          </div>

                          {currentScoreUrl && (
                            <div className="flex-shrink-0">
                              <div 
                                className="w-16 aspect-[3/4] bg-muted rounded overflow-hidden relative group cursor-pointer"
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
                                  onError={(e) => { e.currentTarget.src = '/placeholder.svg'; }}
                                />
                                {uniqueKeys.length > 1 && (
                                  <>
                                    <Button
                                      size="icon"
                                      variant="secondary"
                                      className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-5 opacity-0 group-hover:opacity-100"
                                      onClick={(e) => { e.stopPropagation(); navigateToPreviousScore(song.id); }}
                                    >
                                      <ChevronLeft className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="secondary"
                                      className="absolute right-0 top-1/2 -translate-y-1/2 h-5 w-5 opacity-0 group-hover:opacity-100"
                                      onClick={(e) => { e.stopPropagation(); navigateToNextScore(song.id); }}
                                    >
                                      <ChevronRight className="w-3 h-3" />
                                    </Button>
                                  </>
                                )}
                                {currentKey && (
                                  <Badge variant="secondary" className="absolute bottom-0 right-0 text-[8px] px-1 py-0 rounded-none rounded-tl">
                                    {currentKey}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-1">
                          {song.youtube_url && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="flex-1 h-7 text-xs"
                              onClick={(e) => { e.stopPropagation(); window.open(song.youtube_url!, '_blank'); }}
                            >
                              <Youtube className="w-3 h-3 mr-1" />
                              유튜브
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-7 w-7 p-0"
                            onClick={(e) => handleEditSong(song, e)}
                          >
                            <Pencil className="w-3 h-3" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant={isSongSelected(song.id) ? "default" : "outline"}
                            className="flex-1 h-7 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleSongSelection(song, currentKey, currentScoreUrl || undefined);
                            }}
                          >
                            {isSongSelected(song.id) ? (
                              <><Check className="w-3 h-3 mr-1" />선택됨</>
                            ) : (
                              <><Plus className="w-3 h-3 mr-1" />추가</>
                            )}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            ) : (
              // Table View
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">제목 / 아티스트</TableHead>
                    <TableHead className="w-[15%]">키</TableHead>
                    <TableHead className="w-[20%]">카테고리</TableHead>
                    <TableHead className="w-[25%] text-right">액션</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedSongs.map((song) => {
                    const { currentKey, currentScoreUrl } = getSongScoreInfo(song);
                    return (
                      <TableRow 
                        key={song.id}
                        className={cn(isSongSelected(song.id) && "bg-primary/5")}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium truncate">{song.title}</p>
                            {song.artist && <p className="text-xs text-muted-foreground truncate">{song.artist}</p>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {song.default_key || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {song.category || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {song.youtube_url && (
                              <Button 
                                size="icon"
                                variant="ghost"
                                className="h-7 w-7"
                                onClick={() => window.open(song.youtube_url!, '_blank')}
                              >
                                <Youtube className="w-4 h-4" />
                              </Button>
                            )}
                            <Button 
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={(e) => handleEditSong(song, e)}
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="sm"
                              variant={isSongSelected(song.id) ? "default" : "outline"}
                              className="h-7"
                              onClick={() => toggleSongSelection(song, currentKey, currentScoreUrl || undefined)}
                            >
                              {isSongSelected(song.id) ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              검색 결과가 없습니다
            </div>
          )}
        </div>
      </DialogContent>

      <SongDialog 
        open={showSongDialog || !!editSong}
        onOpenChange={(open) => {
          if (!open) {
            setShowSongDialog(false);
            setEditSong(null);
          }
        }}
        song={editSong}
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

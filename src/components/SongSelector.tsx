import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { SearchInput } from "@/components/ui/search-input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, LayoutGrid, LayoutList, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SongDialog } from "./SongDialog";
import { SongCard } from "./SongCard";
import { SongTable } from "./SongTable";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

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
  const [selectedSongs, setSelectedSongs] = useState<SelectedSongWithVariation[]>([]);
  const [editSong, setEditSong] = useState<any>(null);
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { user } = useAuth();

  const { data: songs, isLoading } = useQuery({
    queryKey: ["songs-selector", searchQuery, selectedCategory, selectedLanguage],
    queryFn: async () => {
      let query = supabase
        .from("songs")
        .select("*")
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

  // Fetch user favorites
  const { data: userFavorites } = useQuery({
    queryKey: ["user-favorites-selector"],
    queryFn: async () => {
      if (!user) return new Set<string>();
      const { data } = await supabase
        .from("user_favorite_songs")
        .select("song_id")
        .eq("user_id", user.id);
      return new Set(data?.map(f => f.song_id) || []);
    },
    enabled: open && !!user,
  });

  // Fetch favorite counts in batch
  const { data: favoriteCounts } = useQuery({
    queryKey: ["song-favorite-counts-selector"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_favorite_songs")
        .select("song_id");
      
      const counts = new Map<string, number>();
      data?.forEach(f => {
        counts.set(f.song_id, (counts.get(f.song_id) || 0) + 1);
      });
      return counts;
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
    toast.success(t("songSelector.addedToSet", { count: selectedSongs.length }));
    setSelectedSongs([]);
    onClose();
  };

  const handleEditSong = (song: any) => {
    setEditSong(song);
  };

  const handleSongDialogClose = () => {
    setShowSongDialog(false);
    setEditSong(null);
    queryClient.invalidateQueries({ queryKey: ["songs-selector"] });
    queryClient.invalidateQueries({ queryKey: ["song-favorite-counts-selector"] });
    queryClient.invalidateQueries({ queryKey: ["user-favorites-selector"] });
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
            placeholder={t("songSelector.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* Filter Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder={t("songSelector.categoryPlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("songSelector.allCategories")}</SelectItem>
                <SelectItem value="찬송가">{t("songLibrary.categories.hymn")}</SelectItem>
                <SelectItem value="모던워십 (한국)">{t("songLibrary.categories.modernKorean")}</SelectItem>
                <SelectItem value="모던워십 (서양)">{t("songLibrary.categories.modernWestern")}</SelectItem>
                <SelectItem value="모던워십 (기타)">{t("songLibrary.categories.modernOther")}</SelectItem>
                <SelectItem value="한국 복음성가">{t("songLibrary.categories.koreanGospel")}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder={t("songLibrary.languageLabel")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("songSelector.allLanguages")}</SelectItem>
                <SelectItem value="KO">{t("songLibrary.languages.ko")}</SelectItem>
                <SelectItem value="EN">{t("songLibrary.languages.en")}</SelectItem>
                <SelectItem value="KO/EN">{t("songLibrary.languages.koen")}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedKey} onValueChange={setSelectedKey}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder={t("songLibrary.keyLabel")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("songSelector.allKeys")}</SelectItem>
                {MUSICAL_KEYS.map(key => (
                  <SelectItem key={key} value={key}>{key}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder={t("songLibrary.sortBy")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="title-asc">{t("songSelector.sortTitleAsc")}</SelectItem>
                <SelectItem value="title-desc">{t("songSelector.sortTitleDesc")}</SelectItem>
                <SelectItem value="recent">{t("songSelector.sortRecent")}</SelectItem>
                <SelectItem value="artist">{t("songSelector.sortArtist")}</SelectItem>
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
                    {t("songSelector.reset")}
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
            <div className="text-center py-8 text-muted-foreground">{t("songSelector.loading")}</div>
          ) : filteredAndSortedSongs.length > 0 ? (
            viewMode === "card" ? (
              // Card View - using unified SongCard component
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredAndSortedSongs.map((song) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    onEdit={handleEditSong}
                    selectorMode={true}
                    isSelectedForSet={isSongSelected(song.id)}
                    onSelectForSet={toggleSongSelection}
                    selectedScoreKey={song.default_key}
                    selectedScoreUrl={song.score_file_url}
                    isFavorite={userFavorites?.has(song.id) || false}
                    favoriteCount={favoriteCounts?.get(song.id) || 0}
                  />
                ))}
              </div>
            ) : (
              // Table View - using unified SongTable component
              <SongTable
                songs={filteredAndSortedSongs}
                onEdit={handleEditSong}
                selectorMode={true}
                selectedForSet={new Set(selectedSongs.map(s => s.song.id))}
                onSelectForSet={toggleSongSelection}
                favoriteIds={userFavorites || new Set()}
                favoriteCounts={favoriteCounts || new Map()}
              />
            )
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              {t("songSelector.noSongs")}
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
    </Dialog>
  );
};

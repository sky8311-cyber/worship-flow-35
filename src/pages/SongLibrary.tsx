import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/ui/search-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Music, Plus, Search, Filter, Upload, Download, LogOut, Shield, LayoutGrid, LayoutList, CheckSquare, Copy, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate } from "react-router-dom";
import { SongCard } from "@/components/SongCard";
import { SongTable } from "@/components/SongTable";
import { SongDialog } from "@/components/SongDialog";
import { CSVImportDialog } from "@/components/CSVImportDialog";
import { BulkActionsBar } from "@/components/BulkActionsBar";
import { DuplicateReviewDialog } from "@/components/DuplicateReviewDialog";
import { LanguageToggle } from "@/components/LanguageToggle";
import { FloatingSearchButton } from "@/components/FloatingSearchButton";
import { AddToSetDialog } from "@/components/AddToSetDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useTranslation } from "@/hooks/useTranslation";
import { useScrollPosition } from "@/hooks/useScrollPosition";
import { useAuth } from "@/contexts/AuthContext";
import { useSongCart } from "@/contexts/SongCartContext";
import { toast } from "sonner";
import Papa from "papaparse";
import { Home } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";

interface EditingSetContext {
  id: string;
  name: string;
}

const SongLibrary = () => {
  const { t } = useTranslation();
  const { signOut, profile, isAdmin, isWorshipLeader } = useAuth();
  const navigate = useNavigate();
  
  // Remember scroll position
  useScrollPosition("song-library");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  
  // Editing set context from sessionStorage (when coming from SetBuilder)
  const [editingSetContext, setEditingSetContext] = useState<EditingSetContext | null>(null);
  
  // Load editing context on mount
  useEffect(() => {
    const setId = sessionStorage.getItem('currentEditingSetId');
    const setName = sessionStorage.getItem('currentEditingSetName');
    if (setId) {
      setEditingSetContext({ id: setId, name: setName || '워십세트' });
    }
  }, []);

  // Debounce search query - wait 300ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const [selectedKey, setSelectedKey] = useState<string>("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("recent");
  const [viewMode, setViewMode] = useState<"card" | "table">("table");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCSVDialogOpen, setIsCSVDialogOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState<any>(null);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedSongIds, setSelectedSongIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [editedSongs, setEditedSongs] = useState<Record<string, any>>({});
  const [isDuplicateDialogOpen, setIsDuplicateDialogOpen] = useState(false);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});
  const [columnSort, setColumnSort] = useState<{ column: string | null; direction: 'asc' | 'desc' | null }>({
    column: null,
    direction: null
  });
  const [isCartDialogOpen, setIsCartDialogOpen] = useState(false);
  const [isSearchSticky, setIsSearchSticky] = useState(false);
  const [isSearchMini, setIsSearchMini] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchSentinelRef = useRef<HTMLDivElement>(null);
  
  // Use global song cart - use cartIds Set for O(1) lookups
  const { cartItems, cartIds, toggleCart, clearCart, cartCount } = useSongCart();

  useEffect(() => {
    if (window.innerWidth < 768) {
      setViewMode("card");
    }
  }, []);

  // Batch fetch all user favorites in ONE query (eliminates 520+ individual queries)
  const { data: userFavorites } = useQuery({
    queryKey: ["user-favorites-set"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return new Set<string>();
      
      const { data } = await supabase
        .from("user_favorite_songs")
        .select("song_id")
        .eq("user_id", user.user.id);
      
    return new Set(data?.map(f => f.song_id) || []);
    },
  });

  // Batch fetch favorite counts for all songs in ONE query
  const { data: favoriteCounts } = useQuery({
    queryKey: ["song-favorite-counts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_favorite_songs")
        .select("song_id");
      
      // Count favorites per song_id client-side
      const counts = new Map<string, number>();
      data?.forEach(({ song_id }) => {
        counts.set(song_id, (counts.get(song_id) || 0) + 1);
      });
      return counts;
    },
  });

  // Batch fetch usage counts for all songs in ONE query
  const { data: usageCounts } = useQuery({
    queryKey: ["song-usage-counts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("set_songs")
        .select("song_id");
      
      // Count usage per song_id client-side
      const counts = new Map<string, number>();
      data?.forEach(({ song_id }) => {
        counts.set(song_id, (counts.get(song_id) || 0) + 1);
      });
      return counts;
    },
  });

  // Fetch unique tags from all songs
  const { data: uniqueTags } = useQuery({
    queryKey: ["unique-tags"],
    queryFn: async () => {
      const { data } = await supabase.from("songs").select("tags");
      const tagSet = new Set<string>();
      data?.forEach(song => {
        if (song.tags) {
          song.tags.split(",").forEach((tag: string) => {
            const trimmed = tag.trim();
            if (trimmed) tagSet.add(trimmed);
          });
        }
      });
      return Array.from(tagSet).sort();
    },
  });

  const { data: songs, isLoading, refetch } = useQuery({
    queryKey: ["songs", debouncedSearchQuery, selectedCategory, selectedLanguage, sortBy],
    queryFn: async () => {
      let query = supabase.from("songs").select("*");

      if (debouncedSearchQuery) {
        query = query.or(`title.ilike.%${debouncedSearchQuery}%,tags.ilike.%${debouncedSearchQuery}%`);
      }

      if (selectedCategory !== "all") {
        if (selectedCategory === "uncategorized") {
          query = query.is("category", null);
        } else {
          query = query.eq("category", selectedCategory);
        }
      }

      if (selectedLanguage !== "all") {
        query = query.eq("language", selectedLanguage);
      }

      // Apply sorting
      switch (sortBy) {
        case "title-asc":
          query = query.order("title", { ascending: true });
          break;
        case "title-desc":
          query = query.order("title", { ascending: false });
          break;
        case "recent":
          query = query.order("created_at", { ascending: false });
          break;
        case "artist":
          query = query.order("artist", { ascending: true, nullsFirst: false });
          break;
        case "bpm":
          query = query.order("bpm", { ascending: false, nullsFirst: false });
          break;
        default:
          query = query.order("title");
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Apply client-side column filters + key filter + tag filter
  const filteredSongs = (songs || []).filter(song => {
    // Key filter
    if (selectedKey !== "all" && song.default_key !== selectedKey) {
      return false;
    }
    
    // Tag filter
    if (selectedTags.length > 0) {
      const songTags = song.tags ? song.tags.split(",").map((t: string) => t.trim().toLowerCase()) : [];
      const hasAllTags = selectedTags.every(tag => 
        songTags.some((st: string) => st.includes(tag.toLowerCase()))
      );
      if (!hasAllTags) return false;
    }
    
    // Column filters
    for (const [column, filterValue] of Object.entries(columnFilters)) {
      if (!filterValue) continue;
      
      const songValue = song[column];
      if (!songValue) return false;
      
      if (typeof songValue === 'string' && !songValue.toLowerCase().includes(filterValue.toLowerCase())) {
        return false;
      }
    }
    return true;
  });

  // Apply client-side column sorting
  const sortedAndFilteredSongs = [...filteredSongs].sort((a, b) => {
    if (!columnSort.column || !columnSort.direction) return 0;
    
    const aVal = a[columnSort.column] || '';
    const bVal = b[columnSort.column] || '';
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return columnSort.direction === 'asc' 
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }
    
    return columnSort.direction === 'asc' ? aVal - bVal : bVal - aVal;
  });

  const handleColumnFilter = (column: string, value: string) => {
    setColumnFilters(prev => ({ ...prev, [column]: value }));
  };

  const handleColumnSort = (column: string, direction: 'asc' | 'desc') => {
    setColumnSort({ column, direction });
  };

  const handleAddSong = () => {
    setSelectedSong(null);
    setIsDialogOpen(true);
  };

  const handleEditSong = (song: any) => {
    setSelectedSong(song);
    setIsDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsDialogOpen(false);
    setSelectedSong(null);
    refetch();
  };

  const handleLogout = async () => {
    await signOut();
    toast.success(t("dashboard.logout"));
    navigate("/login");
  };

  const handleExportCSV = () => {
    if (!songs || songs.length === 0) return;

    const csvData = songs.map(song => ({
      title: song.title,
      artist: song.artist || "",
      language: song.language || "",
      default_key: song.default_key || "",
      category: song.category || "",
      tags: song.tags || "",
      youtube_url: song.youtube_url || "",
      notes: song.notes || "",
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `songs-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleToggleSelection = (songId: string) => {
    const newSelection = new Set(selectedSongIds);
    if (newSelection.has(songId)) {
      newSelection.delete(songId);
    } else {
      newSelection.add(songId);
    }
    setSelectedSongIds(newSelection);
  };

  const handleSelectAll = () => {
    if (songs && selectedSongIds.size === songs.length) {
      setSelectedSongIds(new Set());
    } else if (songs) {
      setSelectedSongIds(new Set(songs.map(s => s.id)));
    }
  };

  const handleBulkDelete = async () => {
    const count = selectedSongIds.size;
    
    const { error } = await supabase
      .from("songs")
      .delete()
      .in("id", Array.from(selectedSongIds));

    if (error) {
      toast.error(t("common.error"));
      console.error("Bulk delete error:", error);
    } else {
      toast.success(t("songLibrary.bulkDeleteSuccess", { count }));
      setSelectedSongIds(new Set());
      setSelectionMode(false);
      setShowDeleteConfirm(false);
      refetch();
    }
  };

  const handleBulkCategorize = async (category: string) => {
    const count = selectedSongIds.size;
    const categoryValue = category === "uncategorized" ? null : category;
    
    const { error } = await supabase
      .from("songs")
      .update({ category: categoryValue })
      .in("id", Array.from(selectedSongIds));

    if (error) {
      toast.error(t("common.error"));
      console.error("Bulk categorize error:", error);
    } else {
      toast.success(t("songLibrary.bulkCategorizeSuccess", { count }));
      setSelectedSongIds(new Set());
      setSelectionMode(false);
      refetch();
    }
  };

  const handleClearSelection = () => {
    setSelectedSongIds(new Set());
    setSelectionMode(false);
    setBulkEditMode(false);
    setEditedSongs({});
  };

  const handleToggleCart = (song: any) => {
    toggleCart({ 
      id: song.id, 
      title: song.title, 
      artist: song.artist, 
      default_key: song.default_key 
    });
  };

  const handleCartSuccess = () => {
    clearCart();
    setIsCartDialogOpen(false);
  };

  const handleEnterBulkEdit = () => {
    if (selectedSongIds.size === 0) {
      toast.error(t("songLibrary.selectSongsFirst"));
      return;
    }
    setBulkEditMode(true);
    const initial = songs
      ?.filter(s => selectedSongIds.has(s.id))
      .reduce((acc, song) => {
        acc[song.id] = { ...song };
        return acc;
      }, {} as Record<string, any>);
    setEditedSongs(initial || {});
  };

  const handleSaveBulkEdit = async () => {
    try {
      const updates = Object.values(editedSongs).map(song => 
        supabase.from("songs").update({
          title: song.title,
          artist: song.artist,
          category: song.category,
          language: song.language,
          default_key: song.default_key,
          bpm: song.bpm,
          energy_level: song.energy_level,
          tags: song.tags,
          notes: song.notes,
          interpretation: song.interpretation,
        }).eq("id", song.id)
      );

      await Promise.all(updates);
      
      toast.success(t("songLibrary.bulkEditSuccess", { count: updates.length }));
      setBulkEditMode(false);
      setEditedSongs({});
      setSelectedSongIds(new Set());
      setSelectionMode(false);
      refetch();
    } catch (error) {
      console.error("Bulk edit error:", error);
      toast.error(t("common.error"));
    }
  };

  const handleCancelBulkEdit = () => {
    setBulkEditMode(false);
    setEditedSongs({});
  };

  return (
    <AppLayout>
      <main className="container mx-auto px-4 py-6 pb-24 md:pb-8">
        {/* Editing Set Context Banner */}
        {editingSetContext && (
          <Card className="shadow-md mb-4 border-primary/30 bg-primary/5">
            <CardContent className="py-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(`/set-builder/${editingSetContext.id}`)}
                    className="h-8 gap-1 sm:gap-2 shrink-0"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span className="hidden sm:inline">돌아가기</span>
                  </Button>
                  <div className="h-5 w-px bg-border hidden sm:block" />
                  <span className="text-xs sm:text-sm font-medium truncate">
                    편집 중: <span className="text-primary">{editingSetContext.name}</span>
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-muted-foreground shrink-0 h-8 px-2"
                  onClick={() => {
                    sessionStorage.removeItem('currentEditingSetId');
                    sessionStorage.removeItem('currentEditingSetName');
                    setEditingSetContext(null);
                  }}
                >
                  <X className="h-3 w-3 sm:mr-1" />
                  <span className="hidden sm:inline">편집 종료</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-md mb-6">
          <CardHeader className="relative">
            {/* View Mode Toggle - Top Right Corner */}
            <div className="absolute top-4 right-4 z-10">
              <div className="flex gap-1 border rounded-md p-1 bg-card">
                <Button
                  variant={viewMode === "card" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("card")}
                  className="h-8 w-8"
                  title={t("songLibrary.viewMode.card")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "table" ? "secondary" : "ghost"}
                  size="icon"
                  onClick={() => setViewMode("table")}
                  className="h-8 w-8"
                  title={t("songLibrary.viewMode.table")}
                >
                  <LayoutList className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-3 pr-24">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
                {t("songLibrary.searchAndFilter")}
              </CardTitle>
              <div className="flex items-center justify-between gap-2">
                {isWorshipLeader && (
                  <Button
                    variant={selectionMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectionMode(!selectionMode);
                      setSelectedSongIds(new Set());
                    }}
                    className="gap-1 px-2 text-[11px] sm:text-sm"
                  >
                    <CheckSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                    {selectionMode ? t("songLibrary.exitSelection") : t("songLibrary.selectionMode")}
                  </Button>
                )}
                {isWorshipLeader && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setIsCSVDialogOpen(true)}
                      className="h-8 w-8"
                      title={t("songLibrary.importCSV")}
                    >
                      <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={handleExportCSV}
                      disabled={!songs || songs.length === 0}
                      className="h-8 w-8"
                      title={t("songLibrary.exportCSV")}
                    >
                      <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setIsDuplicateDialogOpen(true)}
                      disabled={!songs || songs.length < 2}
                      className="h-8 w-8"
                      title={t("songLibrary.findDuplicates")}
                    >
                      <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <SearchInput
              placeholder={t("songLibrary.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder={t("songLibrary.selectCategory")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("songLibrary.allCategories")}</SelectItem>
                  <SelectItem value="uncategorized">{t("songLibrary.categories.uncategorized")}</SelectItem>
                  <SelectItem value="찬송가">{t("songLibrary.categories.hymn")}</SelectItem>
                  <SelectItem value="모던워십 (한국)">{t("songLibrary.categories.modernKorean")}</SelectItem>
                  <SelectItem value="모던워십 (서양)">{t("songLibrary.categories.modernWestern")}</SelectItem>
                  <SelectItem value="모던워십 (기타)">{t("songLibrary.categories.modernOther")}</SelectItem>
                  <SelectItem value="한국 복음성가">{t("songLibrary.categories.koreanGospel")}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder={t("songLibrary.selectLanguage")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("songLibrary.allLanguages")}</SelectItem>
                  <SelectItem value="KO">{t("songLibrary.languages.ko")}</SelectItem>
                  <SelectItem value="EN">{t("songLibrary.languages.en")}</SelectItem>
                  <SelectItem value="KO/EN">{t("songLibrary.languages.koen")}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={selectedKey} onValueChange={setSelectedKey}>
                <SelectTrigger>
                  <SelectValue placeholder={t("songLibrary.filterByKey")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("songLibrary.allKeys")}</SelectItem>
                  {["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"].map(key => (
                    <SelectItem key={key} value={key}>{key}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder={t("songLibrary.sortBy")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="title-asc">{t("songLibrary.sortOptions.titleAsc")}</SelectItem>
                  <SelectItem value="title-desc">{t("songLibrary.sortOptions.titleDesc")}</SelectItem>
                  <SelectItem value="recent">{t("songLibrary.sortOptions.recentlyAdded")}</SelectItem>
                  <SelectItem value="artist">{t("songLibrary.sortOptions.artist")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Tag filter chips */}
            {uniqueTags && uniqueTags.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">{t("songLibrary.filterByTags")}</p>
                <div className="flex flex-wrap gap-1.5">
                  {uniqueTags.slice(0, 20).map(tag => (
                    <Badge
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => {
                        setSelectedTags(prev => 
                          prev.includes(tag) 
                            ? prev.filter(t => t !== tag) 
                            : [...prev, tag]
                        );
                      }}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Active filters display */}
            {(selectedCategory !== "all" || selectedLanguage !== "all" || selectedKey !== "all" || selectedTags.length > 0) && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">{t("songLibrary.activeFilters")}:</span>
                {selectedCategory !== "all" && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {selectedCategory}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedCategory("all")} />
                  </Badge>
                )}
                {selectedLanguage !== "all" && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {selectedLanguage}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedLanguage("all")} />
                  </Badge>
                )}
                {selectedKey !== "all" && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    Key: {selectedKey}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedKey("all")} />
                  </Badge>
                )}
                {selectedTags.map(tag => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedTags(prev => prev.filter(t => t !== tag))} />
                  </Badge>
                ))}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs h-6 px-2"
                  onClick={() => {
                    setSelectedCategory("all");
                    setSelectedLanguage("all");
                    setSelectedKey("all");
                    setSelectedTags([]);
                  }}
                >
                  {t("songLibrary.clearAllFilters")}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">{t("common.loading")}</div>
        ) : sortedAndFilteredSongs && sortedAndFilteredSongs.length > 0 ? (
          viewMode === "table" ? (
            <SongTable
              songs={sortedAndFilteredSongs}
              onEdit={isWorshipLeader ? handleEditSong : undefined}
              onDelete={isWorshipLeader ? () => refetch() : undefined}
              selectionMode={selectionMode}
              selectedSongs={selectedSongIds}
              onToggleSelection={handleToggleSelection}
              onSelectAll={handleSelectAll}
              bulkEditMode={bulkEditMode}
              editedSongs={editedSongs}
              onUpdateEditedSong={(songId, field, value) => {
                setEditedSongs(prev => ({
                  ...prev,
                  [songId]: { ...prev[songId], [field]: value }
                }));
              }}
              columnFilters={columnFilters}
              onColumnFilter={handleColumnFilter}
              columnSort={columnSort}
              onColumnSort={handleColumnSort}
              isInCart={isWorshipLeader ? (id: string) => cartIds.has(id) : undefined}
              onToggleCart={isWorshipLeader ? (song: any) => handleToggleCart(song) : undefined}
              favoriteIds={userFavorites || new Set()}
              favoriteCounts={favoriteCounts || new Map()}
              usageCounts={usageCounts || new Map()}
            />
          ) : (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {sortedAndFilteredSongs.map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  onEdit={isWorshipLeader ? handleEditSong : undefined}
                  onDelete={isWorshipLeader ? () => refetch() : undefined}
                  selectionMode={selectionMode}
                  isSelected={selectedSongIds.has(song.id)}
                  onToggleSelection={handleToggleSelection}
                  inCart={isWorshipLeader ? cartIds.has(song.id) : false}
                  onToggleCart={isWorshipLeader ? () => handleToggleCart(song) : undefined}
                  isFavorite={userFavorites?.has(song.id) || false}
                  favoriteCount={favoriteCounts?.get(song.id) || 0}
                  usageCount={usageCounts?.get(song.id) || 0}
                />
              ))}
            </div>
          )
        ) : (
          <Card className="shadow-md">
            <CardContent className="text-center py-12">
              <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedCategory !== "all" || selectedLanguage !== "all"
                  ? t("common.noResults")
                  : t("songLibrary.noSongs")}
              </p>
              {isWorshipLeader && (
                <Button onClick={handleAddSong}>
                  <Plus className="w-4 h-4 mr-2" />
                  {t("songLibrary.addFirstSong")}
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </main>

      {isWorshipLeader && (
        <Button
          onClick={handleAddSong}
          className="fixed bottom-24 right-4 md:hidden rounded-full w-14 h-14 shadow-lg z-40"
          size="icon"
        >
          <Plus className="w-6 h-6" />
        </Button>
      )}

      <SongDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        song={selectedSong}
        onClose={handleDialogClose}
      />

      <CSVImportDialog
        open={isCSVDialogOpen}
        onOpenChange={setIsCSVDialogOpen}
        onImportComplete={() => refetch()}
      />

      <DuplicateReviewDialog
        open={isDuplicateDialogOpen}
        onClose={() => setIsDuplicateDialogOpen(false)}
        songs={songs || []}
        onMergeComplete={() => {
          refetch();
          setIsDuplicateDialogOpen(false);
        }}
      />

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("songLibrary.bulkDeleteConfirm", { count: selectedSongIds.size })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("songLibrary.bulkDeleteDesc", { count: selectedSongIds.size })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {selectionMode && selectedSongIds.size > 0 && (
        <BulkActionsBar
          selectedCount={selectedSongIds.size}
          onBulkDelete={() => setShowDeleteConfirm(true)}
          onBulkCategorize={handleBulkCategorize}
          onClearSelection={handleClearSelection}
          bulkEditMode={bulkEditMode}
          onEnterBulkEdit={handleEnterBulkEdit}
          onSaveBulkEdit={handleSaveBulkEdit}
          onCancelBulkEdit={handleCancelBulkEdit}
        />
      )}

      {/* Floating Search Button - Mobile only */}
      <FloatingSearchButton
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder={t("songLibrary.searchPlaceholder")}
      />

      {/* Floating "Add to Set" button when editing a set and cart has items */}
      {isWorshipLeader && cartCount > 0 && editingSetContext && (
        <Button
          onClick={() => setIsCartDialogOpen(true)}
          className="fixed bottom-24 left-4 md:bottom-8 md:left-1/2 md:-translate-x-1/2 rounded-full shadow-lg z-40 gap-2 px-6"
        >
          <Plus className="w-4 h-4" />
          세트에 {cartCount}곡 추가
        </Button>
      )}

      {/* AddToSetDialog for cart items */}
      <AddToSetDialog
        open={isCartDialogOpen}
        onOpenChange={setIsCartDialogOpen}
        songs={cartItems.map(item => ({
          id: item.id,
          title: item.title,
          artist: item.artist,
          default_key: item.default_key
        }))}
        onSuccess={handleCartSuccess}
      />
    </AppLayout>
  );
};

export default SongLibrary;

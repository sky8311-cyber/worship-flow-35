import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchInput } from "@/components/ui/search-input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Music, Plus, Search, Filter, Upload, Download, LogOut, Shield, LayoutGrid, LayoutList, Copy, X, Globe, UserRoundPen, Heart, HelpCircle } from "lucide-react";
import { TutorialOverlay } from "@/components/tutorial/TutorialOverlay";
import { useTutorial } from "@/components/tutorial/useTutorial";
import { SONG_LIBRARY_STEPS } from "@/components/tutorial/tutorialSteps";
import { Badge } from "@/components/ui/badge";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { SongCard } from "@/components/SongCard";
import { SongTable } from "@/components/SongTable";
import { SongDialog } from "@/components/SongDialog";
import { CSVImportDialog } from "@/components/CSVImportDialog";

import { DuplicateReviewDialog } from "@/components/DuplicateReviewDialog";
import { LanguageToggle } from "@/components/LanguageToggle";
import { FloatingSearchButton } from "@/components/FloatingSearchButton";
import { FloatingActionStack } from "@/components/FloatingActionStack";
import { FloatingCartIndicator } from "@/components/FloatingCartIndicator";
import { AddToSetDialog } from "@/components/AddToSetDialog";
import { MobileSelect } from "@/components/MobileSelect";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "@/hooks/useTranslation";
import { useScrollPosition } from "@/hooks/useScrollPosition";
import { useAuth } from "@/contexts/AuthContext";
import { useSongCart } from "@/contexts/SongCartContext";
import { useCrossCommunityMode } from "@/hooks/useCrossCommunityMode";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { useScrollDirection } from "@/hooks/useScrollDirection";
import { toast } from "sonner";
import Papa from "papaparse";
import XLSX from 'xlsx-js-style';
import { Home } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { cn } from "@/lib/utils";

interface EditingSetContext {
  id: string;
  name: string;
}

// SongLibrary component - refactored to use MobileSelect for better mobile UX
const SongLibrary = () => {
  const { t, language } = useTranslation();
  const { signOut, profile, isAdmin, isWorshipLeader, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const filterMode = searchParams.get("filter");
  const showMySongsOnly = filterMode === "my-songs";
  const showFavoritesOnly = filterMode === "favorites";
  const { isFeatureEnabled: isCrossCommunityFeatureEnabled, isInCrossCommunityMode, toggleMode: toggleCrossCommunityMode } = useCrossCommunityMode();
  const { playerState } = useMusicPlayer();
  const isScrollingDown = useScrollDirection();
  
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

  // Debounce search query - wait 500ms after user stops typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  // Category and Tags removed - now using Topics system
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const [selectedKey, setSelectedKey] = useState<string>("all");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>("recent");
  const [viewMode, setViewMode] = useState<"card" | "table">("table");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCSVDialogOpen, setIsCSVDialogOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState<any>(null);
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
    staleTime: 60 * 1000, // 1 minute - favorites don't change often
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
    staleTime: 60 * 1000, // 1 minute
  });

  // Batch fetch usage counts for all songs - ONLY count published sets
  const { data: usageCounts } = useQuery({
    queryKey: ["song-usage-counts-published"],
    queryFn: async () => {
      const { data } = await supabase
        .from("set_songs")
        .select(`
          song_id,
          service_sets!inner(status)
        `)
        .eq("service_sets.status", "published");
      
      // Count usage per song_id client-side (only published sets)
      const counts = new Map<string, number>();
      data?.forEach(({ song_id }) => {
        counts.set(song_id, (counts.get(song_id) || 0) + 1);
      });
      return counts;
    },
    staleTime: 60 * 1000, // 1 minute
  });

  // Tags query removed - using Topics system now

  // Fetch all topics for filter chips
  const { data: allTopics } = useQuery({
    queryKey: ["song-topics-list"],
    queryFn: async () => {
      const { data } = await supabase
        .from("song_topics")
        .select("id, name_ko, name_en")
        .order("name_ko");
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: songs, isLoading, refetch } = useQuery({
    queryKey: ["songs", debouncedSearchQuery, selectedLanguage, sortBy],
    queryFn: async () => {
      let query = supabase.from("songs").select(
        "id, title, subtitle, artist, default_key, language, tags, is_private, status, created_by, created_at, youtube_url, lyrics, notes, song_scores(id, key, file_url, page_number)"
      );

      if (debouncedSearchQuery) {
        // Search: title, subtitle, artist, tags (excludes lyrics for performance)
        query = query.or(
          `title.ilike.%${debouncedSearchQuery}%,` +
          `subtitle.ilike.%${debouncedSearchQuery}%,` +
          `artist.ilike.%${debouncedSearchQuery}%,` +
          `tags.ilike.%${debouncedSearchQuery}%`
        );
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

      const { data, error } = await query.limit(200);
      if (error) throw error;
      return data;
    },
    staleTime: 30 * 1000, // 30 seconds - songs list can be cached briefly
  });

  // Apply client-side column filters + key filter + tag filter + my songs filter + favorites filter + private songs filter
  const filteredSongs = (songs || []).filter(song => {
    // Draft filter - only show drafts to their creator
    if (song.status === 'draft' && song.created_by !== user?.id) {
      return false;
    }
    
    // Private song filter - only show private songs to their creator or admins
    if (song.is_private && song.created_by !== user?.id && !isAdmin) {
      return false;
    }
    
    // Favorites filter - show only favorited songs
    if (showFavoritesOnly && userFavorites) {
      if (!userFavorites.has(song.id)) {
        return false;
      }
    }
    
    // My Songs filter - show only songs created by current user
    if (showMySongsOnly && user?.id) {
      if (song.created_by !== user.id) {
        return false;
      }
    }
    
    // Key filter
    if (selectedKey !== "all" && song.default_key !== selectedKey) {
      return false;
    }

    // Topic filter - show only songs matching selected topics (OR logic)
    if (selectedTopics.length > 0) {
      const songTopics = song.tags?.split(',').map((t: string) => t.trim()) || [];
      const hasMatchingTopic = selectedTopics.some(topic => songTopics.includes(topic));
      if (!hasMatchingTopic) {
        return false;
      }
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

  const handleExportXLSX = async () => {
    if (!isAdmin) {
      toast.error("관리자만 데이터를 내보낼 수 있습니다");
      return;
    }
    if (!songs || songs.length === 0) return;

    toast.info("내보내기 준비 중...");

    try {
      // Server-side admin-verified export
      const { data: sessionData } = await supabase.auth.refreshSession();
      if (!sessionData?.session) {
        toast.error("세션이 만료되었습니다. 다시 로그인해주세요.");
        return;
      }

      const { data, error } = await supabase.functions.invoke('export-songs', {
        headers: {
          Authorization: `Bearer ${sessionData.session.access_token}`,
        },
      });

      if (error) {
        const msg = error.message || '';
        if (msg.includes('403') || msg.includes('Forbidden')) {
          toast.error("관리자 권한이 확인되지 않았습니다");
        } else {
          toast.error("내보내기 실패: " + msg);
        }
        return;
      }

      const exportedSongs = data.songs || [];
      const youtubeLinks = data.youtubeLinks || [];
      const scores = data.scores || [];

      if (exportedSongs.length === 0) {
        toast.error("내보낼 데이터가 없습니다");
        return;
      }

      // Build maps from server response
      const youtubeLinksMap = new Map<string, { label: string; url: string }[]>();
      youtubeLinks.forEach((link: any) => {
        const existing = youtubeLinksMap.get(link.song_id) || [];
        existing.push({ label: link.label, url: link.url });
        youtubeLinksMap.set(link.song_id, existing);
      });

      const scoresMap = new Map<string, { key: string; url: string }[]>();
      scores.forEach((score: any) => {
        const existing = scoresMap.get(score.song_id) || [];
        existing.push({ key: score.key, url: score.file_url });
        scoresMap.set(score.song_id, existing);
      });

      // Format multiple links to delimited string
      const formatYoutubeLinks = (songId: string) => {
        const links = youtubeLinksMap.get(songId) || [];
        return links.map(l => `${l.label}|${l.url}`).join(";;");
      };

      const formatScores = (songId: string) => {
        const scoresList = scoresMap.get(songId) || [];
        return scoresList.map(s => `${s.key}|${s.url}`).join(";;");
      };

      // Header style
      const headerStyle = {
        font: { bold: true, color: { rgb: "FFFFFF" } },
        fill: { fgColor: { rgb: "4F46E5" } },
        alignment: { horizontal: "center" as const }
      };

      // Headers
      const headers = [
        { v: "id", s: headerStyle },
        { v: "title", s: headerStyle },
        { v: "subtitle", s: headerStyle },
        { v: "artist", s: headerStyle },
        { v: "language", s: headerStyle },
        { v: "default_key", s: headerStyle },
        { v: "tags", s: headerStyle },
        { v: "youtube_url", s: headerStyle },
        { v: "score_file_url", s: headerStyle },
        { v: "notes", s: headerStyle },
        { v: "interpretation", s: headerStyle },
        { v: "lyrics", s: headerStyle },
        { v: "youtube_links", s: headerStyle },
        { v: "scores", s: headerStyle },
      ];

      // Data rows
      const dataRows = exportedSongs.map((song: any) => [
        song.id,
        song.title,
        song.subtitle || "",
        song.artist || "",
        song.language || "",
        song.default_key || "",
        song.tags || "",
        song.youtube_url || "",
        song.score_file_url || "",
        song.notes || "",
        song.interpretation || "",
        song.lyrics || "",
        formatYoutubeLinks(song.id),
        formatScores(song.id),
      ]);

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet([headers, ...dataRows]);
      
      // Set column widths
      ws['!cols'] = [
        { wch: 36 },  // id
        { wch: 30 },  // title
        { wch: 20 },  // subtitle
        { wch: 20 },  // artist
        { wch: 8 },   // language
        { wch: 8 },   // default_key
        { wch: 12 },  // tags
        { wch: 20 },  // youtube_url
        { wch: 40 },  // score_file_url
        { wch: 30 },  // notes
        { wch: 30 },  // interpretation
        { wch: 50 },  // lyrics
        { wch: 60 },  // youtube_links
        { wch: 60 },  // scores
      ];

      // Create workbook and download
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Songs");
      XLSX.writeFile(wb, `songs-export-${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast.success("Excel 파일이 다운로드되었습니다");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("내보내기 중 오류가 발생했습니다");
    }
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
                  size="icon"
                  className="h-6 w-6 rounded-full border border-muted-foreground/30 text-muted-foreground shrink-0"
                  onClick={() => {
                    const setId = editingSetContext.id;
                    sessionStorage.removeItem('currentEditingSetId');
                    sessionStorage.removeItem('currentEditingSetName');
                    setEditingSetContext(null);
                    navigate(`/set-builder/${setId}`);
                  }}
                  title={t("setBuilder.endEditing")}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-md mb-6">
          <CardHeader>
            {/* View Mode Toggle, Cross-Community Toggle & Action Buttons */}
            <div className="flex flex-col items-end gap-2 mb-2">
              {/* First row: Cross-Community + View Mode Toggle */}
              <div className="flex items-center gap-2">
                {/* Cross-Community Toggle */}
                {isCrossCommunityFeatureEnabled && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center gap-2 border rounded-md px-2 py-1.5 bg-card">
                          <Globe className={cn("h-4 w-4", isInCrossCommunityMode ? "text-primary" : "text-muted-foreground")} />
                          <Switch
                            checked={isInCrossCommunityMode}
                            onCheckedChange={toggleCrossCommunityMode}
                            className="h-5 w-9"
                          />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p>{isInCrossCommunityMode 
                          ? t("songLibrary.crossCommunity.enabled") 
                          : t("songLibrary.crossCommunity.disabled")}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                
                {/* View Mode Toggle */}
                <TooltipProvider>
                  <div className="flex gap-1 border rounded-md p-1 bg-card">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={viewMode === "card" ? "secondary" : "ghost"}
                          size="icon"
                          onClick={() => setViewMode("card")}
                          className="h-8 w-8"
                        >
                          <LayoutGrid className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">{t("songLibrary.viewMode.card")}</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant={viewMode === "table" ? "secondary" : "ghost"}
                          size="icon"
                          onClick={() => setViewMode("table")}
                          className="h-8 w-8"
                        >
                          <LayoutList className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">{t("songLibrary.viewMode.table")}</TooltipContent>
                    </Tooltip>
                  </div>
                </TooltipProvider>
              </div>

              {/* Second row: Action Buttons (Desktop/Tablet only) */}
              <div className="hidden sm:flex items-center gap-1">
                <TooltipProvider>
                  {(isWorshipLeader || isAdmin) && (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={handleAddSong}
                      className="gap-1 px-3"
                    >
                      <Plus className="w-4 h-4" />
                      {t("songLibrary.addSong")}
                    </Button>
                  )}
                  {isWorshipLeader && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setIsCSVDialogOpen(true)}
                          className="h-8 w-8"
                        >
                          <Upload className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        {language === "ko" ? "CSV 파일로 곡 일괄 가져오기" : "Import songs from CSV"}
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {isAdmin && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={handleExportXLSX}
                          disabled={!songs || songs.length === 0}
                          className="h-8 w-8"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        {language === "ko" ? "곡 목록 Excel 내보내기" : "Export songs to Excel"}
                      </TooltipContent>
                    </Tooltip>
                  )}
                  {isWorshipLeader && (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => setIsDuplicateDialogOpen(true)}
                          disabled={!songs || songs.length < 2}
                          className="h-8 w-8"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        {language === "ko" ? "중복 곡 자동 검색" : "Find duplicate songs"}
                      </TooltipContent>
                    </Tooltip>
                  )}
                </TooltipProvider>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <CardTitle className="text-base md:text-lg flex items-center gap-2">
                  <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
                  {t("songLibrary.searchAndFilter")}
                </CardTitle>
                
                {/* Favorites Filter Badge */}
                {showFavoritesOnly && (
                  <Badge variant="secondary" className="gap-1 pl-2">
                    <Heart className="h-3 w-3" />
                    {t("navigation.favorites")}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                      onClick={() => navigate("/songs")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
                
                {/* My Songs Filter Badge */}
                {showMySongsOnly && (
                  <Badge variant="secondary" className="gap-1 pl-2">
                    <UserRoundPen className="h-3 w-3" />
                    {t("songLibrary.mySongs")}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-4 w-4 p-0 ml-1 hover:bg-transparent"
                      onClick={() => navigate("/songs")}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </Badge>
                )}
              </div>
              
              {/* Mobile only: Action Buttons */}
              <div className="flex sm:hidden items-center gap-2">
                {(isWorshipLeader || isAdmin) && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleAddSong}
                    className="gap-1 px-2"
                  >
                    <Plus className="w-3 h-3" />
                    추가
                  </Button>
                )}
                {isWorshipLeader && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsCSVDialogOpen(true)}
                    className="h-7 w-7"
                  >
                    <Upload className="w-3 h-3" />
                  </Button>
                )}
                {isAdmin && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleExportXLSX}
                    disabled={!songs || songs.length === 0}
                    className="h-7 w-7"
                  >
                    <Download className="w-3 h-3" />
                  </Button>
                )}
                {isWorshipLeader && (
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => setIsDuplicateDialogOpen(true)}
                    disabled={!songs || songs.length < 2}
                    className="h-7 w-7"
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <MobileSelect
                value={selectedLanguage}
                onValueChange={setSelectedLanguage}
                placeholder={t("songLibrary.selectLanguage")}
                options={[
                  { value: "all", label: t("songLibrary.allLanguages") },
                  { value: "KO", label: t("songLibrary.languages.ko") },
                  { value: "EN", label: t("songLibrary.languages.en") },
                  { value: "KO/EN", label: t("songLibrary.languages.koen") },
                ]}
              />

              <MobileSelect
                value={selectedKey}
                onValueChange={setSelectedKey}
                placeholder={t("songLibrary.filterByKey")}
                options={[
                  { value: "all", label: t("songLibrary.allKeys") },
                  ...["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"].map(key => ({
                    value: key,
                    label: key,
                  })),
                ]}
              />

              <MobileSelect
                value={sortBy}
                onValueChange={setSortBy}
                placeholder={t("songLibrary.sortBy")}
                options={[
                  { value: "title-asc", label: t("songLibrary.sortOptions.titleAsc") },
                  { value: "title-desc", label: t("songLibrary.sortOptions.titleDesc") },
                  { value: "recent", label: t("songLibrary.sortOptions.recentlyAdded") },
                  { value: "artist", label: t("songLibrary.sortOptions.artist") },
                ]}
              />
            </div>

            {/* Topic Filter Chips */}
            {allTopics && allTopics.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs text-muted-foreground font-medium">
                  {t("songLibrary.topicFilter")}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[...(allTopics || [])].sort((a, b) => a.name_ko.localeCompare(b.name_ko, 'ko')).map((topic) => (
                    <Badge
                      key={topic.id}
                      variant={selectedTopics.includes(topic.name_ko) ? "default" : "outline"}
                      className={cn(
                        "cursor-pointer transition-colors",
                        selectedTopics.includes(topic.name_ko) 
                          ? "bg-primary hover:bg-primary/90" 
                          : "hover:bg-muted"
                      )}
                      onClick={() => {
                        if (selectedTopics.includes(topic.name_ko)) {
                          setSelectedTopics(selectedTopics.filter(t => t !== topic.name_ko));
                        } else {
                          setSelectedTopics([...selectedTopics, topic.name_ko]);
                        }
                      }}
                    >
                      {topic.name_ko}
                      {selectedTopics.includes(topic.name_ko) && (
                        <X className="h-3 w-3 ml-1" />
                      )}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Active filters display */}
            {(selectedLanguage !== "all" || selectedKey !== "all" || selectedTopics.length > 0 || isInCrossCommunityMode) && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-muted-foreground">{t("songLibrary.activeFilters")}:</span>
                {isInCrossCommunityMode && (
                  <Badge variant="default" className="flex items-center gap-1 bg-primary/90">
                    <Globe className="h-3 w-3" />
                    {t("songLibrary.crossCommunity.label")}
                    <X className="h-3 w-3 cursor-pointer" onClick={toggleCrossCommunityMode} />
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
                {selectedTopics.map(topic => (
                  <Badge key={topic} variant="secondary" className="flex items-center gap-1">
                    {topic}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => setSelectedTopics(selectedTopics.filter(t => t !== topic))} 
                    />
                  </Badge>
                ))}
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs h-6 px-2"
                  onClick={() => {
                    setSelectedLanguage("all");
                    setSelectedKey("all");
                    setSelectedTopics([]);
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
              songs={sortedAndFilteredSongs.map(song => ({
                ...song,
                score_file_url: (song as any).song_scores?.[0]?.file_url || null
              }))}
              onEdit={isWorshipLeader ? handleEditSong : undefined}
              onDelete={isWorshipLeader ? () => refetch() : undefined}
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
                  song={{ ...song, score_file_url: (song as any).song_scores?.[0]?.file_url || null }}
                  onEdit={isWorshipLeader ? handleEditSong : undefined}
                  onDelete={isWorshipLeader ? () => refetch() : undefined}
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
                {searchQuery || selectedLanguage !== "all"
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

      {/* Mobile Floating Action Stack */}
      <FloatingActionStack hasMiniPlayer={playerState === 'mini'} hidden={isScrollingDown}>
        {/* Cart indicator - bottom of stack */}
        <FloatingCartIndicator 
          count={cartCount} 
          onClick={() => setIsCartDialogOpen(true)}
          label={language === "ko" ? "곡 담기" : "Cart"}
        />
        
        {/* Add Song button */}
        {isWorshipLeader && (
          <div className="flex flex-col items-center gap-1">
            <Button
              onClick={handleAddSong}
              className="h-14 w-14 rounded-full shadow-lg"
              size="icon"
            >
              <Plus className="w-6 h-6" />
            </Button>
            <span className="text-[10px] font-medium text-muted-foreground">
              {language === "ko" ? "새곡 추가" : "Add"}
            </span>
          </div>
        )}
        
        {/* Search button - top of stack */}
        <FloatingSearchButton
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={t("songLibrary.searchPlaceholder")}
          label={language === "ko" ? "곡 검색" : "Search"}
        />
      </FloatingActionStack>

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

      {/* Song Add/Edit Dialog */}
      <SongDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        song={selectedSong}
        onClose={handleDialogClose}
      />

      {/* CSV Import Dialog */}
      <CSVImportDialog
        open={isCSVDialogOpen}
        onOpenChange={setIsCSVDialogOpen}
        onImportComplete={() => {
          refetch();
          setIsDuplicateDialogOpen(true);
        }}
      />

      {/* Duplicate Review Dialog */}
      <DuplicateReviewDialog
        open={isDuplicateDialogOpen}
        onClose={() => setIsDuplicateDialogOpen(false)}
        songs={songs || []}
        onMergeComplete={() => refetch()}
      />
    </AppLayout>
  );
};

export default SongLibrary;

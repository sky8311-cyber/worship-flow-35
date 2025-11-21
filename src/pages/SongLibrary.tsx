import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Music, Plus, Search, Filter, Upload, Download, LogOut, Shield, LayoutGrid, LayoutList, CheckSquare, Copy } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { SongCard } from "@/components/SongCard";
import { SongTable } from "@/components/SongTable";
import { SongDialog } from "@/components/SongDialog";
import { CSVImportDialog } from "@/components/CSVImportDialog";
import { BulkActionsBar } from "@/components/BulkActionsBar";
import { DuplicateReviewDialog } from "@/components/DuplicateReviewDialog";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import Papa from "papaparse";

const SongLibrary = () => {
  const { t } = useTranslation();
  const { signOut, profile, isAdmin, isWorshipLeader } = useAuth();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("title-asc");
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

  const { data: songs, isLoading, refetch } = useQuery({
    queryKey: ["songs", searchQuery, selectedCategory, selectedLanguage, sortBy],
    queryFn: async () => {
      let query = supabase.from("songs").select("*");

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,tags.ilike.%${searchQuery}%`);
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
    <div className="min-h-screen bg-gradient-soft pb-20 md:pb-8">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Music className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground">{t("songLibrary.title")}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {profile?.full_name && (
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  {profile.full_name}
                </span>
              )}
              <LanguageToggle />
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  title={t("dashboard.adminMenu")}
                >
                  <Link to="/admin">
                    <Shield className="h-5 w-5" />
                  </Link>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                title={t("dashboard.logout")}
              >
                <LogOut className="h-5 w-5" />
              </Button>
              {isWorshipLeader && (
                <Button onClick={handleAddSong} className="hidden md:flex">
                  <Plus className="w-4 h-4 mr-2" />
                  {t("songLibrary.addSong")}
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-24 md:pb-8">
        <Card className="shadow-md mb-6">
          <CardHeader>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <CardTitle className="text-base md:text-lg flex items-center gap-2">
                <Filter className="w-4 h-4 sm:w-5 sm:h-5" />
                {t("songLibrary.searchAndFilter")}
              </CardTitle>
              <div className="flex gap-2 w-full sm:w-auto">
                {isWorshipLeader && (
                  <Button
                    variant={selectionMode ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setSelectionMode(!selectionMode);
                      setSelectedSongIds(new Set());
                    }}
                    className="gap-2 text-xs sm:text-sm"
                  >
                    <CheckSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                    {selectionMode ? t("songLibrary.exitSelection") : t("songLibrary.selectionMode")}
                  </Button>
                )}
                <div className="flex gap-1 border rounded-md p-1">
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
                {isWorshipLeader && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsCSVDialogOpen(true)}
                      className="gap-2 text-xs sm:text-sm"
                    >
                      <Upload className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">{t("songLibrary.importCSV")}</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportCSV}
                      disabled={!songs || songs.length === 0}
                      className="gap-2 text-xs sm:text-sm"
                    >
                      <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">{t("songLibrary.exportCSV")}</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsDuplicateDialogOpen(true)}
                      disabled={!songs || songs.length < 2}
                      className="gap-2 text-xs sm:text-sm"
                    >
                      <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">{t("songLibrary.findDuplicates")}</span>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder={t("songLibrary.searchPlaceholder")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">{t("common.loading")}</div>
        ) : songs && songs.length > 0 ? (
          viewMode === "table" ? (
            <SongTable
              songs={songs}
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
            />
          ) : (
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {songs.map((song) => (
                <SongCard
                  key={song.id}
                  song={song}
                  onEdit={isWorshipLeader ? handleEditSong : undefined}
                  onDelete={isWorshipLeader ? () => refetch() : undefined}
                  selectionMode={selectionMode}
                  isSelected={selectedSongIds.has(song.id)}
                  onToggleSelection={handleToggleSelection}
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

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg md:hidden z-50">
        <div className="flex justify-around py-3">
          <Link to="/" className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground hover:text-foreground transition-colors">
            <Music className="w-5 h-5" />
            <span className="text-xs font-medium">{t("common.home")}</span>
          </Link>
          <Link to="/songs" className="flex flex-col items-center gap-1 px-4 py-2 text-primary">
            <Music className="w-5 h-5" />
            <span className="text-xs font-medium">{t("common.songLibrary")}</span>
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default SongLibrary;

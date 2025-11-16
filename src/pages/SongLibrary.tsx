import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Music, Plus, Search, Filter, Upload, Download } from "lucide-react";
import { Link } from "react-router-dom";
import { SongCard } from "@/components/SongCard";
import { SongDialog } from "@/components/SongDialog";
import { CSVImportDialog } from "@/components/CSVImportDialog";
import { LanguageToggle } from "@/components/LanguageToggle";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTranslation } from "@/hooks/useTranslation";
import Papa from "papaparse";

const SongLibrary = () => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCSVDialogOpen, setIsCSVDialogOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState<any>(null);

  const { data: songs, isLoading, refetch } = useQuery({
    queryKey: ["songs", searchQuery, selectedCategory, selectedLanguage],
    queryFn: async () => {
      let query = supabase
        .from("songs")
        .select(`
          *,
          set_songs(
            service_set_id,
            service_sets(date)
          )
        `)
        .order("title");

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,tags.ilike.%${searchQuery}%`);
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

  const handleExportCSV = () => {
    if (!songs || songs.length === 0) return;

    const csvData = songs.map(song => ({
      title: song.title,
      artist: song.artist || "",
      language: song.language || "",
      default_key: song.default_key || "",
      bpm: song.bpm || "",
      time_signature: song.time_signature || "",
      energy_level: song.energy_level || "",
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
                <Music className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">{t("songLibrary.title")}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LanguageToggle />
              <Button onClick={handleAddSong} className="hidden md:flex">
                <Plus className="w-4 h-4 mr-2" />
                {t("songLibrary.addSong")}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Card className="shadow-md mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="w-5 h-5" />
                {t("songLibrary.searchAndFilter")}
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCSVDialogOpen(true)}
                  className="gap-2"
                >
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">{t("songLibrary.importCSV")}</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportCSV}
                  disabled={!songs || songs.length === 0}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">{t("songLibrary.exportCSV")}</span>
                </Button>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder={t("songLibrary.selectCategory")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("songLibrary.allCategories")}</SelectItem>
                  <SelectItem value="오프닝">{t("songLibrary.categories.opening")}</SelectItem>
                  <SelectItem value="찬양">{t("songLibrary.categories.worship")}</SelectItem>
                  <SelectItem value="헌금">{t("songLibrary.categories.offering")}</SelectItem>
                  <SelectItem value="응답">{t("songLibrary.categories.response")}</SelectItem>
                  <SelectItem value="파송">{t("songLibrary.categories.sending")}</SelectItem>
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
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">{t("common.loading")}</div>
        ) : songs && songs.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {songs.map((song) => (
              <SongCard
                key={song.id}
                song={song}
                onEdit={handleEditSong}
                onDelete={() => refetch()}
              />
            ))}
          </div>
        ) : (
          <Card className="shadow-md">
            <CardContent className="text-center py-12">
              <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">
                {searchQuery || selectedCategory !== "all" || selectedLanguage !== "all"
                  ? t("common.noResults")
                  : t("songLibrary.noSongs")}
              </p>
              <Button onClick={handleAddSong}>
                <Plus className="w-4 h-4 mr-2" />
                {t("songLibrary.addFirstSong")}
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      <Button
        onClick={handleAddSong}
        className="fixed bottom-20 right-4 md:hidden rounded-full w-14 h-14 shadow-lg"
        size="icon"
      >
        <Plus className="w-6 h-6" />
      </Button>

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

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg md:hidden">
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

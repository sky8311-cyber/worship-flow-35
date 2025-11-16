import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Music, Plus, Search, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import { SongCard } from "@/components/SongCard";
import { SongDialog } from "@/components/SongDialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const SongLibrary = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedLanguage, setSelectedLanguage] = useState<string>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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
                <h1 className="text-2xl font-bold text-foreground">곡 라이브러리</h1>
              </div>
            </div>
            <Button onClick={handleAddSong} className="hidden md:flex">
              <Plus className="w-4 h-4 mr-2" />
              곡 추가
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <Card className="shadow-md mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5" />
              검색 및 필터
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="곡 제목 또는 태그로 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="언어 선택" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">전체 언어</SelectItem>
                  <SelectItem value="KO">한국어</SelectItem>
                  <SelectItem value="EN">영어</SelectItem>
                  <SelectItem value="KO/EN">한영 혼합</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">로딩 중...</div>
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
                  ? "검색 결과가 없습니다"
                  : "아직 등록된 곡이 없습니다"}
              </p>
              <Button onClick={handleAddSong}>
                <Plus className="w-4 h-4 mr-2" />
                첫 번째 곡 추가하기
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

      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t shadow-lg md:hidden">
        <div className="flex justify-around py-3">
          <Link to="/" className="flex flex-col items-center gap-1 px-4 py-2 text-muted-foreground hover:text-foreground transition-colors">
            <Music className="w-5 h-5" />
            <span className="text-xs font-medium">홈</span>
          </Link>
          <Link to="/songs" className="flex flex-col items-center gap-1 px-4 py-2 text-primary">
            <Music className="w-5 h-5" />
            <span className="text-xs font-medium">곡 라이브러리</span>
          </Link>
        </div>
      </nav>
    </div>
  );
};

export default SongLibrary;

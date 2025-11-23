import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { SongTable } from "@/components/SongTable";
import { SongCard } from "@/components/SongCard";
import { Button } from "@/components/ui/button";
import { LayoutGrid, LayoutList, Home, Heart } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import logo from "@/assets/kworship-logo.png";

export default function FavoritesList() {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"card" | "table">("table");
  
  const { data: favoriteSongs, isLoading } = useQuery({
    queryKey: ["favorite-songs"],
    queryFn: async () => {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) return [];
      
      const { data, error } = await supabase
        .from("user_favorite_songs")
        .select(`
          song_id,
          songs(*)
        `)
        .eq("user_id", user.user.id)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data.map(f => f.songs).filter(Boolean);
    },
  });
  
  return (
    <div className="min-h-screen bg-gradient-soft">
      <header className="sticky top-0 z-10 border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-3 items-center py-4">
            <div className="flex items-center gap-2">
              <Link to="/dashboard">
                <Button variant="ghost" size="icon">
                  <Home className="w-5 h-5" />
                </Button>
              </Link>
              <span className="text-sm text-muted-foreground hidden md:inline">/ 즐겨찾기</span>
            </div>
            
            <Link to="/dashboard" className="flex justify-center">
              <img src={logo} alt="K-Worship" className="h-20 cursor-pointer" />
            </Link>
            
            <div className="flex justify-end gap-2">
              <Button
                variant={viewMode === "table" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("table")}
              >
                <LayoutList className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "card" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("card")}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-8">
        <Card className="p-6">
          <h1 className="text-2xl font-bold mb-6">❤️ 즐겨찾기 ({favoriteSongs?.length || 0})</h1>
          
          {isLoading ? (
            <p>로딩 중...</p>
          ) : favoriteSongs && favoriteSongs.length > 0 ? (
            viewMode === "table" ? (
              <SongTable songs={favoriteSongs} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {favoriteSongs.map((song) => (
                  <SongCard key={song.id} song={song} />
                ))}
              </div>
            )
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Heart className="w-16 h-16 mx-auto mb-4 opacity-20" />
              <p>즐겨찾기한 곡이 없습니다</p>
              <Button className="mt-4" onClick={() => navigate("/songs")}>
                곡 라이브러리 보기
              </Button>
            </div>
          )}
        </Card>
      </main>
    </div>
  );
}

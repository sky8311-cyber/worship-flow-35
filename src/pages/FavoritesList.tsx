import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { SongTable } from "@/components/SongTable";
import { SongCard } from "@/components/SongCard";
import { Button } from "@/components/ui/button";
import { LayoutGrid, LayoutList, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { AppLayout } from "@/components/layout/AppLayout";

export default function FavoritesList() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<"card" | "table">("table");
  
  useEffect(() => {
    if (window.innerWidth < 768) {
      setViewMode("card");
    }
  }, []);
  
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
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">❤️ {t("navigation.favorites")} ({favoriteSongs?.length || 0})</h1>
          
          <div className="flex items-center gap-2">
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
        
        <Card className="p-6">
          {isLoading ? (
            <p>{t("common.loading")}</p>
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
      </div>
    </AppLayout>
  );
}

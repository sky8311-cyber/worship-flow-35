import { useState, useEffect, useMemo } from "react";
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

  // Batch fetch favorite counts for all songs
  const { data: favoriteCounts } = useQuery({
    queryKey: ["song-favorite-counts"],
    queryFn: async () => {
      const { data } = await supabase
        .from("user_favorite_songs")
        .select("song_id");
      
      const counts = new Map<string, number>();
      data?.forEach(({ song_id }) => {
        counts.set(song_id, (counts.get(song_id) || 0) + 1);
      });
      return counts;
    },
  });

  // Create a Set of favorite song IDs for the FavoriteButton
  const favoriteIds = useMemo(() => {
    return new Set(favoriteSongs?.map(s => s.id) || []);
  }, [favoriteSongs]);
  
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
              <SongTable songs={favoriteSongs} favoriteIds={favoriteIds} favoriteCounts={favoriteCounts || new Map()} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {favoriteSongs.map((song) => (
                  <SongCard key={song.id} song={song} isFavorite={true} favoriteCount={favoriteCounts?.get(song.id) || 0} />
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

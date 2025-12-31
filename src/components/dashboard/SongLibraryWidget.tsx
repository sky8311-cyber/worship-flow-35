import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, LayoutList, Plus } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SongLibraryWidgetProps {
  onAddSong: () => void;
  canAddSong?: boolean;
}

export function SongLibraryWidget({ onAddSong, canAddSong = true }: SongLibraryWidgetProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { data: songsCount } = useQuery({
    queryKey: ["songs-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("songs")
        .select("*", { count: "exact", head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: recentSongs } = useQuery({
    queryKey: ["recent-songs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("songs")
        .select("id, title, artist")
        .order("created_at", { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Music className="w-4 h-4" />
          {t("songLibrary.title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Statistics Section */}
        <div 
          className="text-center py-4 mb-4 bg-primary/5 rounded-lg cursor-pointer hover:bg-primary/10 transition-colors"
          onClick={() => navigate("/songs")}
        >
          <p className="text-3xl font-bold text-primary">{songsCount || 0}</p>
          <p className="text-xs text-muted-foreground">{t("dashboard.totalSongs")}</p>
        </div>

        {/* Recent Songs Preview */}
        {recentSongs && recentSongs.length > 0 && (
          <div className="space-y-2 mb-4">
            <p className="text-xs font-medium text-muted-foreground mb-2">
              {t("songLibrary.recentlyAdded")}
            </p>
            {recentSongs.slice(0, 3).map((song) => (
              <div key={song.id} className="text-sm border-b pb-2 last:border-0">
                <p className="font-medium truncate">{song.title}</p>
                <p className="text-xs text-muted-foreground truncate">{song.artist || "Unknown Artist"}</p>
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => navigate("/songs")}
          >
            <LayoutList className="w-3 h-3 mr-2" />
            {t("songLibrary.viewAllLibrary")}
          </Button>
          {canAddSong && (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onAddSong}
            >
              <Plus className="w-3 h-3 mr-2" />
              {t("songLibrary.addSong")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

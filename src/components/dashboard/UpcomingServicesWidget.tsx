import { useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Calendar, Music, Youtube, FileText, ChevronRight } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "@/hooks/useTranslation";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ServiceSet {
  id: string;
  date: string;
  service_name: string;
  worship_leader?: string | null;
}

interface UpcomingServicesWidgetProps {
  sets: ServiceSet[];
  maxVisible?: number;
}

export function UpcomingServicesWidget({ sets, maxVisible = 3 }: UpcomingServicesWidgetProps) {
  const { t } = useTranslation();
  const visibleSets = sets?.slice(0, maxVisible) || [];
  const [expandedSetId, setExpandedSetId] = useState<string | null>(null);

  const { data: setSongs } = useQuery({
    queryKey: ["set-songs-preview", expandedSetId],
    queryFn: async () => {
      if (!expandedSetId) return null;
      
      const { data, error } = await supabase
        .from("set_songs")
        .select(`
          *,
          songs(
            id,
            title,
            subtitle,
            artist,
            youtube_url,
            song_scores(file_url)
          )
        `)
        .eq("service_set_id", expandedSetId)
        .order("position");
      
      if (error) throw error;
      return data;
    },
    enabled: !!expandedSetId,
  });

  const getYouTubeThumbnail = (url: string | null) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
    return match ? `https://img.youtube.com/vi/${match[1]}/default.jpg` : null;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <CalendarDays className="w-4 h-4" />
          {t("dashboard.upcomingServices")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {visibleSets.length > 0 ? (
          <div className="space-y-4">
            {visibleSets.map((set) => (
              <div key={set.id} className="border rounded-lg overflow-hidden">
                <div 
                  className="flex items-start gap-3 p-3 hover:bg-accent transition-colors cursor-pointer"
                  onClick={() => setExpandedSetId(expandedSetId === set.id ? null : set.id)}
                >
                  <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary shrink-0">
                    <span className="text-xs font-medium">
                      {format(new Date(set.date), "MMM")}
                    </span>
                    <span className="text-lg font-bold">
                      {format(new Date(set.date), "d")}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{set.service_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {set.worship_leader || t("dashboard.noLeader")}
                    </p>
                  </div>
                  <ChevronRight 
                    className={`w-5 h-5 transition-transform ${expandedSetId === set.id ? 'rotate-90' : ''}`}
                  />
                </div>
                
                {expandedSetId === set.id && setSongs && (
                  <div className="bg-muted/30 p-3 space-y-2 border-t">
                    {setSongs.slice(0, 3).map((setSong: any) => (
                      <div key={setSong.id} className="flex items-center gap-3 p-2 bg-card rounded">
                        <div className="w-16 h-12 bg-muted rounded overflow-hidden shrink-0">
                          {setSong.songs.song_scores?.[0]?.file_url ? (
                            <img 
                              src={setSong.songs.song_scores[0].file_url}
                              className="w-full h-full object-cover"
                              alt="Score"
                            />
                          ) : setSong.songs.youtube_url && getYouTubeThumbnail(setSong.songs.youtube_url) ? (
                            <img 
                              src={getYouTubeThumbnail(setSong.songs.youtube_url)}
                              className="w-full h-full object-cover"
                              alt="YouTube"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Music className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{setSong.songs.title}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {setSong.key && <span className="px-2 py-0.5 bg-primary/10 rounded">Key: {setSong.key}</span>}
                            {setSong.songs.artist && <span>{setSong.songs.artist}</span>}
                          </div>
                        </div>
                        
                        <div className="flex gap-1">
                          {setSong.songs.youtube_url && (
                            <Youtube className="w-4 h-4 text-red-500" />
                          )}
                          {setSong.songs.song_scores?.[0] && (
                            <FileText className="w-4 h-4 text-blue-500" />
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {setSongs.length > 3 && (
                      <p className="text-xs text-muted-foreground text-center pt-2">
                        +{setSongs.length - 3}곡 더 보기
                      </p>
                    )}
                    
                    <Link 
                      to={`/set-builder/${set.id}`}
                      className="block text-center text-sm text-primary hover:underline mt-2"
                    >
                      전체 보기 →
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-muted-foreground">
            <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-xs">{t("dashboard.noUpcoming")}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

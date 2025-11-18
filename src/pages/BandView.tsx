import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Music, Calendar, Youtube, FileText } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

const BandView = () => {
  const { id } = useParams();

  const { data: serviceSet, isLoading } = useQuery({
    queryKey: ["band-view", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_sets")
        .select(`
          *,
          set_songs(
            *,
            songs(*)
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <div className="text-center">
          <Music className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  if (!serviceSet) {
    return (
      <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
        <div className="text-center">
          <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">워십세트를 찾을 수 없습니다</p>
        </div>
      </div>
    );
  }

  const sortedSetSongs = serviceSet.set_songs
    ?.sort((a: any, b: any) => a.position - b.position) || [];

  return (
    <div className="min-h-screen bg-gradient-soft">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Music className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">워십세트</h1>
              <p className="text-sm text-muted-foreground">팀 공유 뷰</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <Card className="shadow-lg mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <Calendar className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {serviceSet.service_name}
                </h2>
                <p className="text-lg text-muted-foreground mb-2">
                  {format(new Date(serviceSet.date), "yyyy년 M월 d일 (EEEE)", { locale: ko })}
                </p>
                {serviceSet.worship_leader && (
                  <p className="text-sm text-muted-foreground">
                    인도자: {serviceSet.worship_leader}
                  </p>
                )}
                {serviceSet.band_name && (
                  <p className="text-sm text-muted-foreground">
                    팀: {serviceSet.band_name}
                  </p>
                )}
                {serviceSet.theme && (
                  <p className="text-sm text-foreground mt-2">
                    <span className="font-semibold">주제:</span> {serviceSet.theme}
                  </p>
                )}
                {serviceSet.notes && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {serviceSet.notes}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {sortedSetSongs.map((setSong: any) => {
            const song = setSong.songs;
            return (
              <Card key={setSong.id} className="shadow-md">
                <CardContent className="p-6">
                  <div className="flex gap-6">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-xl bg-gradient-primary flex items-center justify-center">
                        <span className="text-3xl font-bold text-white">
                          {setSong.position}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-foreground mb-2">
                        {song.title}
                      </h3>
                      {song.artist && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {song.artist}
                        </p>
                      )}

                      <div className="flex items-center gap-2 flex-wrap mb-3">
                        {setSong.key && (
                          <span className="px-3 py-1.5 bg-primary/10 text-primary text-sm rounded-full font-semibold">
                            키: {setSong.key}
                          </span>
                        )}
                        {song.bpm && (
                          <span className="px-3 py-1.5 bg-secondary text-secondary-foreground text-sm rounded-full">
                            BPM: {song.bpm}
                          </span>
                        )}
                        {song.time_signature && (
                          <span className="px-3 py-1.5 bg-secondary text-secondary-foreground text-sm rounded-full">
                            {song.time_signature}
                          </span>
                        )}
                      </div>

                      {setSong.custom_notes && (
                        <div className="mb-3 p-3 bg-accent/50 rounded-lg">
                          <p className="text-sm text-foreground">
                            <span className="font-semibold">노트:</span> {setSong.custom_notes}
                          </p>
                        </div>
                      )}

                      <div className="flex gap-2 flex-wrap">
                        {(setSong.override_youtube_url || song.youtube_url) && (
                          <Button
                            variant="outline"
                            onClick={() =>
                              window.open(
                                setSong.override_youtube_url || song.youtube_url,
                                "_blank"
                              )
                            }
                            className="flex-1 sm:flex-none"
                          >
                            <Youtube className="w-4 h-4 mr-2" />
                            유튜브 보기
                          </Button>
                        )}
                        {(setSong.override_score_file_url || song.score_file_url) && (
                          <Button
                            variant="outline"
                            onClick={() =>
                              window.open(
                                setSong.override_score_file_url || song.score_file_url,
                                "_blank"
                              )
                            }
                            className="flex-1 sm:flex-none"
                          >
                            <FileText className="w-4 h-4 mr-2" />
                            악보 보기
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {sortedSetSongs.length === 0 && (
          <Card className="shadow-md">
            <CardContent className="text-center py-12">
              <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                아직 곡이 추가되지 않았습니다
              </p>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
};

export default BandView;

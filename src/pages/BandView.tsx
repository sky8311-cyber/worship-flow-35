import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Music, Calendar, Printer } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const BandView = () => {
  const { id } = useParams();

  const { data: serviceSet, isLoading } = useQuery({
    queryKey: ["band-view", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_sets")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
    refetchOnMount: "always",
    staleTime: 0,
  });

  const { data: setSongs } = useQuery({
    queryKey: ["band-view-songs", id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("set_songs")
        .select(`
          *,
          songs(*),
          song_scores:songs(
            song_scores(*)
          )
        `)
        .eq("service_set_id", id)
        .order("position", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    refetchOnMount: "always",
    staleTime: 0,
  });

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

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

  const sortedSetSongs = setSongs || [];

  return (
    <div className="min-h-[100dvh] bg-gradient-soft print:bg-white">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10 print:hidden">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
                <Music className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">워십세트</h1>
                <p className="text-sm text-muted-foreground">팀 공유 뷰</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => window.print()}
              className="flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              인쇄
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 pb-8 max-w-5xl">
        {/* Service Set Header */}
        <Card className="shadow-lg mb-6 print:shadow-none">
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <Calendar className="w-6 h-6 text-primary flex-shrink-0 mt-1 print:hidden" />
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-foreground">
                    {serviceSet.service_name}
                  </h2>
                  <Badge variant={serviceSet.status === "published" ? "default" : "secondary"}>
                    {serviceSet.status === "published" ? "게시됨" : "임시저장"}
                  </Badge>
                </div>
                <p className="text-lg text-muted-foreground mb-3">
                  {format(new Date(serviceSet.date), "yyyy년 M월 d일 (EEEE)", { locale: ko })}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  {serviceSet.worship_leader && (
                    <p className="text-muted-foreground">
                      <span className="font-semibold">인도자:</span> {serviceSet.worship_leader}
                    </p>
                  )}
                  {serviceSet.band_name && (
                    <p className="text-muted-foreground">
                      <span className="font-semibold">팀:</span> {serviceSet.band_name}
                    </p>
                  )}
                  {serviceSet.target_audience && (
                    <p className="text-muted-foreground">
                      <span className="font-semibold">대상:</span> {serviceSet.target_audience}
                    </p>
                  )}
                  {serviceSet.worship_duration && (
                    <p className="text-muted-foreground">
                      <span className="font-semibold">찬양시간:</span> {serviceSet.worship_duration}분
                    </p>
                  )}
                </div>

                {serviceSet.theme && (
                  <p className="text-sm text-foreground mt-3">
                    <span className="font-semibold">주제/설교제목:</span> {serviceSet.theme}
                  </p>
                )}
                {serviceSet.scripture_reference && (
                  <p className="text-sm text-foreground mt-2">
                    <span className="font-semibold">본문:</span> {serviceSet.scripture_reference}
                  </p>
                )}
                {serviceSet.notes && (
                  <p className="text-sm text-muted-foreground mt-3 p-3 bg-accent/30 rounded-lg">
                    {serviceSet.notes}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Song List */}
        <div className="space-y-6">
          {sortedSetSongs.map((setSong: any) => {
            const song = setSong.songs;
            const youtubeUrl = setSong.override_youtube_url || song?.youtube_url;
            const videoId = getYouTubeVideoId(youtubeUrl);
            
            // Get score files for the selected key
            const scoreFiles = song?.song_scores?.song_scores?.filter(
              (score: any) => score.key === setSong.key
            ).sort((a: any, b: any) => (a.position || 0) - (b.position || 0)) || [];

            // Fallback to default score_file_url if no key-specific scores
            const defaultScoreUrl = setSong.override_score_file_url || song?.score_file_url;

            return (
              <Card key={setSong.id} className="shadow-md print:shadow-none print:break-inside-avoid">
                <CardContent className="p-6">
                  {/* Song Header */}
                  <div className="flex gap-4 mb-4">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-xl bg-gradient-primary flex items-center justify-center print:bg-gray-800">
                        <span className="text-3xl font-bold text-white">
                          {setSong.position}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-foreground mb-1">
                        {song?.title || "제목 없음"}
                      </h3>
                      {song?.subtitle && (
                        <p className="text-sm italic text-muted-foreground mb-2">
                          {song.subtitle}
                        </p>
                      )}
                      {song?.artist && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {song.artist}
                        </p>
                      )}

                      {/* Song Metadata Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {setSong.key && (
                          <Badge variant="default" className="text-sm">
                            키: {setSong.key}
                          </Badge>
                        )}
                        {setSong.bpm && (
                          <Badge variant="secondary" className="text-sm">
                            BPM: {setSong.bpm}
                          </Badge>
                        )}
                        {setSong.time_signature && (
                          <Badge variant="secondary" className="text-sm">
                            {setSong.time_signature}
                          </Badge>
                        )}
                        {setSong.energy_level && (
                          <Badge variant="secondary" className="text-sm">
                            에너지: {setSong.energy_level}/5
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Performance Notes */}
                  {setSong.custom_notes && (
                    <div className="mb-4 p-3 bg-accent/50 rounded-lg">
                      <p className="text-sm text-foreground">
                        <span className="font-semibold">진행설명:</span> {setSong.custom_notes}
                      </p>
                    </div>
                  )}

                  {/* Embedded YouTube Player */}
                  {videoId && (
                    <div className="mb-4 print:hidden">
                      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                        <iframe
                          className="absolute top-0 left-0 w-full h-full rounded-lg"
                          src={`https://www.youtube.com/embed/${videoId}`}
                          title={song?.title || "YouTube video"}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  )}

                  {/* Embedded Score Images */}
                  {scoreFiles.length > 0 ? (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-foreground">
                        악보 ({setSong.key} Key)
                      </p>
                      <div className="grid grid-cols-1 gap-3">
                        {scoreFiles.map((score: any, idx: number) => (
                          <div key={score.id} className="border rounded-lg overflow-hidden bg-white">
                            <img
                              src={score.file_url}
                              alt={`${song?.title} - Page ${idx + 1}`}
                              className="w-full h-auto"
                              loading="lazy"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : defaultScoreUrl ? (
                    <div className="space-y-3">
                      <p className="text-sm font-semibold text-foreground">악보</p>
                      <div className="border rounded-lg overflow-hidden bg-white">
                        <img
                          src={defaultScoreUrl}
                          alt={song?.title || "Score"}
                          className="w-full h-auto"
                          loading="lazy"
                        />
                      </div>
                    </div>
                  ) : null}
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

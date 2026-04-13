import { useParams, Link } from "react-router-dom";
import { SignedScoreImage } from "@/components/score/SignedScoreImage";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Music, Calendar, Clock, Globe, Eye } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMemo } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DOMPurify from "dompurify";
import { 
  Timer, HandMetal, HandHeart, BookOpen, Mic, Heart, Megaphone, 
  ScrollText, Sparkles, Music2, MessageCircle, Wine, Droplets, 
  Users, MessagesSquare, Circle
} from "lucide-react";
import { WorshipComponentType, getComponentLabel } from "@/lib/worshipComponents";
import { NativeSafeYouTubeEmbed } from "@/components/ui/NativeSafeYouTubeEmbed";
import { parseLocalDate } from "@/lib/countdownHelper";

const iconMap: Record<string, React.ComponentType<any>> = {
  Timer, HandMetal, HandHeart, BookOpen, Mic, Heart, Megaphone, 
  ScrollText, Sparkles, Music2, MessageCircle, Wine, Droplets, 
  Users, MessagesSquare, Circle,
};

const getIconForType = (type: WorshipComponentType): React.ComponentType<any> => {
  const iconNames: Record<string, string> = {
    countdown: "Timer",
    welcome: "HandMetal",
    prayer: "HandHeart",
    bible_reading: "BookOpen",
    sermon: "Mic",
    offering: "Heart",
    announcement: "Megaphone",
    lords_prayer: "ScrollText",
    apostles_creed: "ScrollText",
    benediction: "Sparkles",
    special_song: "Music2",
    testimony: "MessageCircle",
    communion: "Wine",
    baptism: "Droplets",
    small_group: "Users",
    responsive_reading: "MessagesSquare",
    custom: "Circle",
  };
  return iconMap[iconNames[type]] || Circle;
};

type SetItem = 
  | { type: "song"; data: any; position: number }
  | { type: "component"; data: any; position: number };

interface PublicWorshipSet {
  id: string;
  service_name: string;
  date: string;
  service_time: string | null;
  worship_leader: string | null;
  band_name: string | null;
  theme: string | null;
  notes: string | null;
  scripture_reference: string | null;
  target_audience: string | null;
  worship_duration: number | null;
  community_id: string | null;
  community_name: string | null;
}

interface PublicSetSong {
  id: string;
  song_id: string;
  song_position: number;
  song_key: string | null;
  key_change_to: string | null;
  bpm: number | null;
  custom_notes: string | null;
  lyrics: string | null;
  override_youtube_url: string | null;
  override_score_file_url: string | null;
  song_title: string;
  song_artist: string | null;
  song_default_key: string | null;
  song_youtube_url: string | null;
  song_score_file_url: string | null;
}

interface PublicSetComponent {
  id: string;
  component_position: number;
  component_type: string;
  label: string;
  notes: string | null;
  content: string | null;
  duration_minutes: number | null;
  assigned_to: string | null;
}

interface PublicSongScore {
  id: string;
  song_id: string;
  score_key: string;
  file_url: string;
  score_position: number;
  page_number: number;
}

const PublicBandView = () => {
  const { token } = useParams();

  // Fetch public worship set using RPC
  const { data: serviceSet, isLoading: isLoadingSet } = useQuery<PublicWorshipSet | null>({
    queryKey: ["public-worship-set", token],
    queryFn: async () => {
      if (!token) return null;
      const { data, error } = await supabase.rpc("get_public_worship_set" as any, { 
        share_token: token 
      });
      if (error) throw error;
      return (data as PublicWorshipSet[])?.[0] || null;
    },
    enabled: !!token,
  });

  // Fetch public set songs
  const { data: setSongs } = useQuery<PublicSetSong[]>({
    queryKey: ["public-set-songs", token],
    queryFn: async () => {
      if (!token) return [];
      const { data, error } = await supabase.rpc("get_public_set_songs" as any, { 
        share_token: token 
      });
      if (error) throw error;
      return (data as PublicSetSong[]) || [];
    },
    enabled: !!token && !!serviceSet,
  });

  // Fetch public set components
  const { data: setComponents } = useQuery<PublicSetComponent[]>({
    queryKey: ["public-set-components", token],
    queryFn: async () => {
      if (!token) return [];
      const { data, error } = await supabase.rpc("get_public_set_components" as any, { 
        share_token: token 
      });
      if (error) throw error;
      return (data as PublicSetComponent[]) || [];
    },
    enabled: !!token && !!serviceSet,
  });

  // Fetch public song scores
  const { data: allSongScores } = useQuery<PublicSongScore[]>({
    queryKey: ["public-song-scores", token],
    queryFn: async () => {
      if (!token) return [];
      const { data, error } = await supabase.rpc("get_public_song_scores" as any, { 
        share_token: token 
      });
      if (error) throw error;
      return (data as PublicSongScore[]) || [];
    },
    enabled: !!token && !!serviceSet,
  });

  // Fetch YouTube links for public songs
  const songIds = setSongs?.map(s => s.song_id) || [];
  const { data: allYoutubeLinks } = useQuery({
    queryKey: ["public-youtube-links", token, songIds.join(",")],
    queryFn: async () => {
      if (songIds.length === 0) return [];
      const { data, error } = await supabase
        .from("song_youtube_links")
        .select("*")
        .in("song_id", songIds)
        .order("position", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!setSongs && songIds.length > 0,
  });

  // Helper to get YouTube links for a specific song
  const getYoutubeLinksForSong = (songId: string) => {
    return (allYoutubeLinks || [])
      .filter(link => link.song_id === songId)
      .sort((a, b) => (a.position || 0) - (b.position || 0));
  };

  // Extract YouTube video ID from URL
  const getYouTubeVideoId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[2].length === 11 ? match[2] : null;
  };

  // Merge songs and components by position
  const mergedItems: SetItem[] = useMemo(() => {
    return [
      ...(setSongs || []).map((song: any) => ({ 
        type: "song" as const, 
        data: song, 
        position: song.song_position 
      })),
      ...(setComponents || []).map((comp: any) => ({ 
        type: "component" as const, 
        data: comp, 
        position: comp.component_position 
      })),
    ].sort((a, b) => a.position - b.position);
  }, [setSongs, setComponents]);

  // Helper function to get score files
  const getScoreFilesWithFallback = (songId: string, selectedKey: string) => {
    const songScores = allSongScores?.filter((s: any) => s.song_id === songId) || [];
    
    let scoreFiles = songScores
      .filter((score: any) => score.score_key === selectedKey)
      .sort((a: any, b: any) => (a.page_number || 1) - (b.page_number || 1));
    
    let scoreKeyUsed = selectedKey;
    
    if (scoreFiles.length === 0 && songScores.length > 0) {
      scoreKeyUsed = songScores[0]?.score_key;
      scoreFiles = songScores
        .filter((s: any) => s.score_key === scoreKeyUsed)
        .sort((a: any, b: any) => (a.page_number || 1) - (b.page_number || 1));
    }
    
    return { scoreFiles, scoreKeyUsed, isUsingFallback: scoreKeyUsed !== selectedKey && scoreFiles.length > 0 };
  };

  // Show loading state
  if (isLoadingSet) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Music className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-muted-foreground">로딩 중...</p>
        </div>
      </div>
    );
  }

  // Show error state if set not found or not public
  if (!serviceSet) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Globe className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">링크를 찾을 수 없습니다</h1>
          <p className="text-muted-foreground mb-6">
            이 링크가 만료되었거나 비활성화되었습니다.
          </p>
          <Button asChild>
            <Link to="/">홈으로 돌아가기</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Public View Banner */}
      <div className="bg-accent/10 border-b border-accent/30">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-accent" />
            <span className="text-sm font-medium">
              공개 링크로 보기 (읽기 전용)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/login">로그인</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/signup">회원가입</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 max-w-5xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
            <Music className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">예배 순서</h1>
            <Badge variant="secondary" className="text-xs mt-1">
              <Eye className="w-3 h-3 mr-1" />
              읽기 전용
            </Badge>
          </div>
        </div>

        {/* Service Set Header */}
        <Card className="shadow-lg mb-6">
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <Calendar className="w-6 h-6 text-primary flex-shrink-0 mt-1" />
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-foreground mb-2">
                  {serviceSet.service_name}
                </h2>
                <p className="text-lg text-muted-foreground mb-3">
                  {format(parseLocalDate(serviceSet.date), "yyyy년 M월 d일 (EEEE)", { locale: ko })}
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  {serviceSet.worship_leader && (
                    <p className="text-muted-foreground">
                      <span className="font-semibold">예배인도:</span> {serviceSet.worship_leader}
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
                      <span className="font-semibold">시간:</span> {serviceSet.worship_duration}분
                    </p>
                  )}
                </div>

                {serviceSet.theme && (
                  <p className="text-sm text-foreground mt-3">
                    <span className="font-semibold">주제:</span> {serviceSet.theme}
                  </p>
                )}
                {serviceSet.scripture_reference && (
                  <p className="text-sm text-foreground mt-2">
                    <span className="font-semibold">성경구절:</span> {serviceSet.scripture_reference}
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

        {/* Items List */}
        <div className="space-y-6">
          {mergedItems.map((item) => {
            if (item.type === "component") {
              const component = item.data;
              const IconComponent = getIconForType(component.component_type);
              
              return (
                <Card key={`component-${component.id}`} className="shadow-md border-l-4 border-l-accent">
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center">
                          <span className="text-xl font-bold text-accent">
                            {item.position}
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="gap-1.5">
                            <IconComponent className="w-3.5 h-3.5" />
                            {component.component_type !== "custom" 
                              ? getComponentLabel(component.component_type, "ko")
                              : null
                            }
                          </Badge>
                          {component.component_type === "custom" && (
                            <span className="font-semibold text-foreground">{component.label}</span>
                          )}
                          {component.duration_minutes && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {component.duration_minutes}분
                            </span>
                          )}
                        </div>
                        
                        {component.label && component.component_type !== "custom" && (
                          <p className="text-sm text-foreground">{component.label}</p>
                        )}
                        
                        {component.content && (
                          <div 
                            className="prose prose-sm max-w-none mt-3 p-3 bg-background rounded-lg border"
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(component.content) }}
                          />
                        )}

                        {component.notes && (
                          <p className="text-sm text-muted-foreground mt-2 p-2 bg-accent/10 rounded">
                            {component.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            }

            // Song item
            const song = item.data;
            
            // Get multiple YouTube links for this song
            const youtubeLinks = getYoutubeLinksForSong(song.song_id);
            // Fallback to legacy single URL
            const fallbackYoutubeUrl = song.override_youtube_url || song.song_youtube_url;
            const fallbackVideoId = getYouTubeVideoId(fallbackYoutubeUrl);
            
            const { scoreFiles, scoreKeyUsed, isUsingFallback } = getScoreFilesWithFallback(
              song.song_id, 
              song.song_key
            );

            const defaultScoreUrl = song.override_score_file_url || song.song_score_file_url;

            return (
              <Card key={`song-${song.id}`} className="shadow-md">
                <CardContent className="p-6">
                  {/* Song Header */}
                  <div className="flex gap-4 mb-4">
                    <div className="flex-shrink-0">
                      <div className="w-16 h-16 rounded-xl bg-gradient-primary flex items-center justify-center">
                        <span className="text-3xl font-bold text-white">
                          {item.position}
                        </span>
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold text-foreground mb-1">
                        {song.song_title || "제목 없음"}
                      </h3>
                      {song.song_artist && (
                        <p className="text-sm text-muted-foreground mb-3">
                          {song.song_artist}
                        </p>
                      )}

                      {/* Song Metadata Badges */}
                      <div className="flex items-center gap-2 flex-wrap">
                        {song.song_key && (
                          <Badge variant="default" className="text-sm">
                            Key: {song.song_key}
                            {song.key_change_to && ` → ${song.key_change_to}`}
                          </Badge>
                        )}
                        {song.bpm && (
                          <Badge variant="secondary" className="text-sm">
                            BPM: {song.bpm}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Performance Notes */}
                  {song.custom_notes && (
                    <div className="mb-4 p-3 bg-accent/50 rounded-lg">
                      <p className="text-sm text-foreground">
                        <span className="font-semibold">연주 노트:</span> {song.custom_notes}
                      </p>
                    </div>
                  )}

                  {/* Lyrics Section */}
                  {song.lyrics && (
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-foreground mb-2">가사</p>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <pre className="text-sm whitespace-pre-wrap font-sans text-foreground">{song.lyrics}</pre>
                      </div>
                    </div>
                  )}

                  {/* Embedded YouTube Player(s) */}
                  {youtubeLinks.length > 0 ? (
                    <div className="mb-4">
                      {youtubeLinks.length === 1 ? (
                        // Single link: show directly
                        (() => {
                          const videoId = getYouTubeVideoId(youtubeLinks[0].url);
                          return videoId ? (
                            <div>
                              {youtubeLinks[0].label && (
                                <p className="text-sm font-semibold text-foreground mb-2">{youtubeLinks[0].label}</p>
                              )}
                              <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                                <NativeSafeYouTubeEmbed
                                  videoId={videoId}
                                  title={youtubeLinks[0].label || song.song_title || "YouTube video"}
                                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                                />
                              </div>
                            </div>
                          ) : null;
                        })()
                      ) : (
                        // Multiple links: show as tabs
                        <Tabs defaultValue="0" className="w-full">
                          <TabsList className="mb-2 flex-wrap h-auto">
                            {youtubeLinks.map((link, idx) => (
                              <TabsTrigger key={link.id} value={String(idx)} className="text-xs">
                                {link.label || `영상 ${idx + 1}`}
                              </TabsTrigger>
                            ))}
                          </TabsList>
                          {youtubeLinks.map((link, idx) => {
                            const videoId = getYouTubeVideoId(link.url);
                            return (
                              <TabsContent key={link.id} value={String(idx)}>
                                {videoId && (
                                  <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                                    <NativeSafeYouTubeEmbed
                                      videoId={videoId}
                                      title={link.label || song.song_title || "YouTube video"}
                                      className="absolute top-0 left-0 w-full h-full rounded-lg"
                                    />
                                  </div>
                                )}
                              </TabsContent>
                            );
                          })}
                        </Tabs>
                      )}
                    </div>
                  ) : fallbackVideoId ? (
                    // Fallback to legacy single youtube_url field
                    <div className="mb-4">
                      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
                        <NativeSafeYouTubeEmbed
                          videoId={fallbackVideoId}
                          title={song.song_title || "YouTube video"}
                          className="absolute top-0 left-0 w-full h-full rounded-lg"
                        />
                      </div>
                    </div>
                  ) : null}

                  {/* Score Images */}
                  {scoreFiles.length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          악보 (Key: {scoreKeyUsed})
                        </p>
                        {isUsingFallback && (
                          <Badge variant="outline" className="text-xs text-amber-600 border-amber-400 bg-amber-50 dark:bg-amber-900/20">
                            선택된 키: {song.song_key}
                          </Badge>
                        )}
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        {scoreFiles.map((score: any, idx: number) => (
                          <div key={score.id} className="border rounded-lg overflow-hidden bg-white">
                            <SignedScoreImage
                              src={score.file_url}
                              alt={`${song.song_title} - Page ${idx + 1}`}
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
                        <SignedScoreImage
                          src={defaultScoreUrl}
                          alt={song.song_title || "Score"}
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

        {mergedItems.length === 0 && (
          <Card className="shadow-md">
            <CardContent className="text-center py-12">
              <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                아직 추가된 곡이 없습니다
              </p>
            </CardContent>
          </Card>
        )}

        {/* Footer CTA */}
        <Card className="mt-8 bg-gradient-to-r from-primary/10 to-accent/10 border-none">
          <CardContent className="p-6 text-center">
            <h3 className="text-lg font-bold mb-2">K-Worship으로 예배를 준비하세요</h3>
            <p className="text-sm text-muted-foreground mb-4">
              곡 라이브러리, 세트 빌더, 팀 협업 기능을 무료로 사용해보세요
            </p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" asChild>
                <Link to="/login">로그인</Link>
              </Button>
              <Button asChild>
                <Link to="/signup">무료 회원가입</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default PublicBandView;

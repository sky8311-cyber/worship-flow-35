import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SEOHead } from "@/components/seo/SEOHead";
import { DemoSignupCTA } from "@/components/demo/DemoSignupCTA";
import { ScorePreviewDialog } from "@/components/ScorePreviewDialog";
import { useTranslation } from "@/hooks/useTranslation";
import { useSongCart } from "@/contexts/SongCartContext";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { openYouTubeUrl } from "@/lib/youtubeHelper";
import { Link } from "react-router-dom";
import {
  Music, Search, Youtube, Eye, ShoppingCart, Check, Plus, ArrowLeft,
  LayoutGrid, LayoutList, FileMusic, X
} from "lucide-react";
import { cn } from "@/lib/utils";

const DEMO_LIMIT = 100;

const Demo = () => {
  const { t, language } = useTranslation();
  const { isInCart, toggleCart, cartCount } = useSongCart();
  const { playYouTube } = useMusicPlayer();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [ctaOpen, setCtaOpen] = useState(false);
  const [scorePreviewOpen, setScorePreviewOpen] = useState(false);
  const [selectedSong, setSelectedSong] = useState<any>(null);
  const [languageFilter, setLanguageFilter] = useState<string>("all");

  const { data: songs = [], isLoading } = useQuery({
    queryKey: ["demo-songs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("songs")
        .select("id, title, artist, default_key, language, youtube_url, created_at, song_scores(id, key, file_url, position, page_number)")
        .eq("is_private", false)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(DEMO_LIMIT);
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const filteredSongs = useMemo(() => {
    let result = songs;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (s: any) =>
          s.title?.toLowerCase().includes(q) ||
          s.artist?.toLowerCase().includes(q)
      );
    }
    if (languageFilter !== "all") {
      result = result.filter((s: any) => s.language === languageFilter);
    }
    return result;
  }, [songs, search, languageFilter]);

  const languages = useMemo(() => {
    const set = new Set(songs.map((s: any) => s.language).filter(Boolean));
    return Array.from(set).sort();
  }, [songs]);

  const handleScorePreview = (song: any) => {
    setSelectedSong(song);
    setScorePreviewOpen(true);
  };

  // JSON-LD for SEO
  const jsonLd = useMemo(() => {
    if (!songs.length) return undefined;
    const itemList = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: language === "ko" ? "K-Worship 찬양 라이브러리" : "K-Worship Song Library",
      numberOfItems: songs.length,
      itemListElement: songs.map((s: any, i: number) => ({
        "@type": "ListItem",
        position: i + 1,
        item: {
          "@type": "MusicComposition",
          name: s.title,
          composer: s.artist || undefined,
          musicalKey: s.default_key || undefined,
          url: s.youtube_url || undefined,
        },
      })),
    };
    return itemList;
  }, [songs, language]);

  const scoreUrl = (song: any) => song.song_scores?.[0]?.file_url || null;

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Song Library Demo - K-Worship"
        titleKo="찬양 라이브러리 데모 - K-Worship"
        description="Try K-Worship's song library with 100+ worship songs. Search, preview scores, watch YouTube videos, and build worship sets."
        descriptionKo="K-Worship 찬양 라이브러리를 체험해보세요. 100곡 이상의 찬양곡 검색, 악보 미리보기, 유튜브 재생, 워십세트 만들기를 무료로 써볼 수 있습니다."
        keywords="worship songs, 찬양, CCM, hymns, worship set, score, sheet music, K-Worship demo"
        keywordsKo="찬양 라이브러리, 찬양곡 검색, CCM 악보, 워십 악보, 찬양팀 곡 관리, 피아워십, 마커스워십, K-Worship 데모"
        canonicalPath="/demo"
        jsonLd={jsonLd}
      />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                <Music className="h-5 w-5 text-primary" />
                {language === "ko" ? "찬양 라이브러리 데모" : "Song Library Demo"}
              </h1>
              <p className="text-xs text-muted-foreground">
                {language === "ko"
                  ? `${songs.length}곡의 찬양을 무료로 체험하세요`
                  : `Try ${songs.length} worship songs for free`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {cartCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCtaOpen(true)}
                className="relative"
              >
                <ShoppingCart className="h-4 w-4 mr-1" />
                {language === "ko" ? "워십세트 만들기" : "Create Set"}
                <Badge variant="secondary" className="ml-1 text-xs px-1.5">
                  {cartCount}
                </Badge>
              </Button>
            )}
            <Button asChild size="sm">
              <Link to="/signup">
                {language === "ko" ? "무료 가입" : "Sign up"}
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Search & Filters */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === "ko" ? "곡 제목 또는 아티스트 검색..." : "Search by title or artist..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
            {search && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearch("")}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="all">{language === "ko" ? "전체 언어" : "All Languages"}</option>
              {languages.map((lang) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
            <div className="flex border rounded-md">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                className="h-10 w-10 rounded-r-none"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                className="h-10 w-10 rounded-l-none"
                onClick={() => setViewMode("list")}
              >
                <LayoutList className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="mb-6 p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <p className="font-medium text-foreground">
                {language === "ko"
                  ? "🎵 이 곡들로 워십세트를 만들어보세요!"
                  : "🎵 Build a worship set with these songs!"}
              </p>
              <p className="text-sm text-muted-foreground">
                {language === "ko"
                  ? "카트에 곡을 담고 워십세트를 만들 수 있습니다. 가입하면 모든 기능을 이용할 수 있어요."
                  : "Add songs to cart and create worship sets. Sign up to unlock all features."}
              </p>
            </div>
            <Button asChild variant="outline" size="sm" className="shrink-0">
              <Link to="/signup">
                <Plus className="h-4 w-4 mr-1" />
                {language === "ko" ? "새 곡 추가하기" : "Add new song"}
              </Link>
            </Button>
          </div>
        </div>

        {/* Results info */}
        <div className="mb-3 text-sm text-muted-foreground">
          {search || languageFilter !== "all"
            ? language === "ko"
              ? `${filteredSongs.length}곡 검색됨`
              : `${filteredSongs.length} songs found`
            : language === "ko"
              ? `총 ${songs.length}곡`
              : `${songs.length} songs total`}
        </div>

        {/* Song Grid / List */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4 h-32" />
              </Card>
            ))}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredSongs.map((song: any) => {
              const inCart = isInCart(song.id);
              const hasScore = !!scoreUrl(song);
              return (
                <Card
                  key={song.id}
                  className={cn(
                    "transition-all hover:shadow-md",
                    inCart && "ring-2 ring-primary/50"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-foreground truncate">{song.title}</h3>
                        <p className="text-sm text-muted-foreground truncate">{song.artist || "-"}</p>
                      </div>
                      <div className="flex items-center gap-1 ml-2 shrink-0">
                        {song.default_key && (
                          <Badge variant="outline" className="text-xs">{song.default_key}</Badge>
                        )}
                        {song.language && (
                          <Badge variant="secondary" className="text-xs">{song.language}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 mt-3">
                      {song.youtube_url && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => openYouTubeUrl(song.youtube_url, playYouTube)}
                          title="YouTube"
                        >
                          <Youtube className="h-4 w-4 text-red-500" />
                        </Button>
                      )}
                      {hasScore && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleScorePreview(song)}
                          title={language === "ko" ? "악보 보기" : "View score"}
                        >
                          <FileMusic className="h-4 w-4 text-primary" />
                        </Button>
                      )}
                      <div className="flex-1" />
                      <Button
                        variant={inCart ? "default" : "outline"}
                        size="sm"
                        className="h-8"
                        onClick={() =>
                          toggleCart({
                            id: song.id,
                            title: song.title,
                            artist: song.artist,
                            default_key: song.default_key,
                          })
                        }
                      >
                        {inCart ? (
                          <Check className="h-3.5 w-3.5 mr-1" />
                        ) : (
                          <ShoppingCart className="h-3.5 w-3.5 mr-1" />
                        )}
                        {inCart
                          ? language === "ko" ? "담김" : "Added"
                          : language === "ko" ? "담기" : "Add"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          /* List view */
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">
                    {language === "ko" ? "제목" : "Title"}
                  </th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden sm:table-cell">
                    {language === "ko" ? "아티스트" : "Artist"}
                  </th>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground hidden md:table-cell">
                    {language === "ko" ? "키" : "Key"}
                  </th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">
                    {language === "ko" ? "액션" : "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSongs.map((song: any) => {
                  const inCart = isInCart(song.id);
                  const hasScore = !!scoreUrl(song);
                  return (
                    <tr key={song.id} className={cn("border-b hover:bg-muted/30", inCart && "bg-primary/5")}>
                      <td className="p-3">
                        <p className="font-medium text-foreground">{song.title}</p>
                        <p className="text-xs text-muted-foreground sm:hidden">{song.artist || "-"}</p>
                      </td>
                      <td className="p-3 text-sm text-muted-foreground hidden sm:table-cell">{song.artist || "-"}</td>
                      <td className="p-3 hidden md:table-cell">
                        {song.default_key && <Badge variant="outline" className="text-xs">{song.default_key}</Badge>}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center justify-end gap-1">
                          {song.youtube_url && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openYouTubeUrl(song.youtube_url, playYouTube)}>
                              <Youtube className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          )}
                          {hasScore && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleScorePreview(song)}>
                              <FileMusic className="h-3.5 w-3.5 text-primary" />
                            </Button>
                          )}
                          <Button
                            variant={inCart ? "default" : "outline"}
                            size="icon"
                            className="h-7 w-7"
                            onClick={() =>
                              toggleCart({
                                id: song.id,
                                title: song.title,
                                artist: song.artist,
                                default_key: song.default_key,
                              })
                            }
                          >
                            {inCart ? <Check className="h-3.5 w-3.5" /> : <ShoppingCart className="h-3.5 w-3.5" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {filteredSongs.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <Music className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">
              {language === "ko" ? "검색 결과가 없습니다" : "No songs found"}
            </p>
          </div>
        )}

        {/* SEO: Hidden song list for crawlers */}
        <noscript>
          <div>
            <h2>{language === "ko" ? "찬양곡 목록" : "Worship Song List"}</h2>
            <ul>
              {songs.map((s: any) => (
                <li key={s.id}>
                  {s.title} - {s.artist} ({s.default_key}) {s.youtube_url && <a href={s.youtube_url}>YouTube</a>}
                </li>
              ))}
            </ul>
          </div>
        </noscript>
      </div>

      {/* Score Preview */}
      {selectedSong && (
        <ScorePreviewDialog
          open={scorePreviewOpen}
          onOpenChange={setScorePreviewOpen}
          scores={selectedSong.song_scores || []}
          songTitle={selectedSong.title}
          songId={selectedSong.id}
        />
      )}

      {/* Signup CTA */}
      <DemoSignupCTA open={ctaOpen} onOpenChange={setCtaOpen} />
    </div>
  );
};

export default Demo;

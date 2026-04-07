import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SEOHead } from "@/components/seo/SEOHead";
import { DemoSignupCTA } from "@/components/demo/DemoSignupCTA";
import { SongCard } from "@/components/SongCard";
import { useTranslation } from "@/hooks/useTranslation";
import { useSongCart } from "@/contexts/SongCartContext";
import { Link } from "react-router-dom";
import {
  Music, Search, ShoppingCart, Plus, ArrowLeft,
  LayoutGrid, LayoutList, X, SlidersHorizontal
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

const DEMO_LIMIT = 100;

const Demo = () => {
  const { t, language } = useTranslation();
  const { isInCart, toggleCart, cartCount } = useSongCart();
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [ctaOpen, setCtaOpen] = useState(false);
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const { data: songs = [], isLoading } = useQuery({
    queryKey: ["demo-songs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("songs")
        .select("id, title, artist, default_key, language, tempo, youtube_url, created_at, song_scores(id, key, file_url, position, page_number)")
        .eq("is_private", false)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(DEMO_LIMIT);
      if (error) throw error;
      return (data || []).map((s: any) => ({
        ...s,
        score_file_url: s.song_scores?.[0]?.file_url || null,
        status: "published",
        is_private: false,
      }));
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

  // JSON-LD for SEO
  const jsonLd = useMemo(() => {
    if (!songs.length) return undefined;
    return {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: language === "ko" ? "K-Worship 예배 자료 라이브러리" : "K-Worship Worship Library",
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
  }, [songs, language]);

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
        <div className="container mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Link to="/">
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-lg font-bold text-foreground flex items-center gap-1.5 truncate">
                <Music className="h-4 w-4 sm:h-5 sm:w-5 text-primary shrink-0" />
                <span className="truncate">
                  {language === "ko" ? "찬양 라이브러리 데모" : "Song Library Demo"}
                </span>
              </h1>
              <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                {language === "ko"
                  ? `${songs.length}곡의 찬양을 무료로 체험하세요`
                  : `Try ${songs.length} worship songs for free`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {cartCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCtaOpen(true)}
                className="relative h-8 px-2 sm:px-3 text-xs sm:text-sm"
              >
                <ShoppingCart className="h-3.5 w-3.5 sm:mr-1" />
                <span className="hidden sm:inline">
                  {language === "ko" ? "워십세트 만들기" : "Create Set"}
                </span>
                <Badge variant="secondary" className="ml-1 text-[10px] px-1">
                  {cartCount}
                </Badge>
              </Button>
            )}
            <Button asChild size="sm" className="h-8 px-2.5 sm:px-3 text-xs sm:text-sm">
              <Link to="/signup">
                {language === "ko" ? "무료 가입" : "Sign up"}
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        {/* Search & Filters */}
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={language === "ko" ? "곡 제목 또는 아티스트 검색..." : "Search title or artist..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-9 text-sm"
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

          {/* Mobile: filter toggle */}
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 sm:hidden shrink-0"
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>

          {/* Desktop: inline filters */}
          <div className="hidden sm:flex gap-2">
            <select
              value={languageFilter}
              onChange={(e) => setLanguageFilter(e.target.value)}
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
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
                className="h-9 w-9 rounded-r-none"
                onClick={() => setViewMode("grid")}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                className="h-9 w-9 rounded-l-none"
                onClick={() => setViewMode("list")}
              >
                <LayoutList className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile collapsible filters */}
        <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
          <CollapsibleContent className="sm:hidden mb-3">
            <div className="flex gap-2">
              <select
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value)}
                className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm"
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
                  className="h-9 w-9 rounded-r-none"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="icon"
                  className="h-9 w-9 rounded-l-none"
                  onClick={() => setViewMode("list")}
                >
                  <LayoutList className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* CTA Banner - compact on mobile */}
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs sm:text-sm font-medium text-foreground">
              {language === "ko"
                ? "🎵 곡을 담고 워십세트를 만들어보세요!"
                : "🎵 Add songs & build a worship set!"}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 h-7 sm:h-8 text-xs"
              onClick={() => setCtaOpen(true)}
            >
              <Plus className="h-3 w-3 mr-1" />
              <span className="hidden sm:inline">
                {language === "ko" ? "새 곡 추가하기" : "Add new song"}
              </span>
              <span className="sm:hidden">
                {language === "ko" ? "추가" : "Add"}
              </span>
            </Button>
          </div>
        </div>

        {/* Results info */}
        <div className="mb-2 sm:mb-3 text-xs sm:text-sm text-muted-foreground">
          {search || languageFilter !== "all"
            ? language === "ko"
              ? `${filteredSongs.length}곡 검색됨`
              : `${filteredSongs.length} songs found`
            : language === "ko"
              ? `총 ${songs.length}곡`
              : `${songs.length} songs total`}
        </div>

        {/* Song Grid using SongCard */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <div className="h-24 bg-muted rounded-t-lg" />
                <CardContent className="p-3 h-20" />
              </Card>
            ))}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {filteredSongs.map((song: any) => (
              <SongCard
                key={song.id}
                song={song}
                inCart={isInCart(song.id)}
                onToggleCart={() =>
                  toggleCart({
                    id: song.id,
                    title: song.title,
                    artist: song.artist,
                    default_key: song.default_key,
                  })
                }
              />
            ))}
          </div>
        ) : (
          /* List view */
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-medium text-muted-foreground">
                    {language === "ko" ? "제목" : "Title"}
                  </th>
                  <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-medium text-muted-foreground hidden sm:table-cell">
                    {language === "ko" ? "아티스트" : "Artist"}
                  </th>
                  <th className="text-left p-2 sm:p-3 text-xs sm:text-sm font-medium text-muted-foreground hidden md:table-cell">
                    {language === "ko" ? "키" : "Key"}
                  </th>
                  <th className="text-right p-2 sm:p-3 text-xs sm:text-sm font-medium text-muted-foreground">
                    {language === "ko" ? "액션" : "Actions"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredSongs.map((song: any) => {
                  const inCart = isInCart(song.id);
                  return (
                    <tr key={song.id} className={cn("border-b hover:bg-muted/30", inCart && "bg-primary/5")}>
                      <td className="p-2 sm:p-3">
                        <p className="font-medium text-foreground text-sm">{song.title}</p>
                        <p className="text-xs text-muted-foreground sm:hidden">{song.artist || "-"}</p>
                      </td>
                      <td className="p-2 sm:p-3 text-sm text-muted-foreground hidden sm:table-cell">{song.artist || "-"}</td>
                      <td className="p-2 sm:p-3 hidden md:table-cell">
                        {song.default_key && <Badge variant="outline" className="text-xs">{song.default_key}</Badge>}
                      </td>
                      <td className="p-2 sm:p-3">
                        <div className="flex items-center justify-end gap-1">
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
                            <ShoppingCart className="h-3.5 w-3.5" />
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

      {/* Signup CTA */}
      <DemoSignupCTA open={ctaOpen} onOpenChange={setCtaOpen} />
    </div>
  );
};

export default Demo;

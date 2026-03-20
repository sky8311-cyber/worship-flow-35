import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SmartSongEntry } from "@/components/songs/SmartSongEntry";
import { DuplicateReviewDialog } from "@/components/DuplicateReviewDialog";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Search, ChevronLeft, ChevronRight, Check, X, Youtube,
  AlertTriangle, Copy, Loader2, Save, Music
} from "lucide-react";

const PAGE_SIZE = 20;

// ─── Tab 1: All Songs ───
const AllSongsTab = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-songs-all", search, page],
    queryFn: async () => {
      let q = supabase
        .from("songs")
        .select("id, title, artist, youtube_url, tags, lyrics, created_at", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (search.trim()) {
        q = q.or(`title.ilike.%${search.trim()}%,artist.ilike.%${search.trim()}%`);
      }
      const { data: songs, count, error } = await q;
      if (error) throw error;
      return { songs: songs || [], total: count || 0 };
    },
  });

  const startEdit = (song: any) => {
    setEditingId(song.id);
    setEditValues({ title: song.title, artist: song.artist || "", tags: song.tags || "" });
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    try {
      const { error } = await supabase.from("songs").update({
        title: editValues.title,
        artist: editValues.artist || null,
        tags: editValues.tags || null,
      }).eq("id", id);
      if (error) throw error;
      toast.success("저장 완료");
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-songs-all"] });
    } catch {
      toast.error("저장 실패");
    } finally {
      setSaving(false);
    }
  };

  const totalPages = Math.ceil((data?.total || 0) / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder="제목 또는 아티스트 검색..."
            className="pl-9"
          />
        </div>
        <Badge variant="secondary">{data?.total ?? "..."} 곡</Badge>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-3 font-medium">제목</th>
                <th className="text-left p-3 font-medium hidden sm:table-cell">아티스트</th>
                <th className="text-center p-3 font-medium w-16">YT</th>
                <th className="text-center p-3 font-medium w-16 hidden sm:table-cell">가사</th>
                <th className="text-center p-3 font-medium w-16 hidden md:table-cell">태그</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data?.songs.map((song: any) => (
                <tr key={song.id} className="hover:bg-muted/30">
                  {editingId === song.id ? (
                    <>
                      <td className="p-2">
                        <Input value={editValues.title} onChange={(e) => setEditValues(v => ({ ...v, title: e.target.value }))} className="h-8 text-sm" />
                      </td>
                      <td className="p-2 hidden sm:table-cell">
                        <Input value={editValues.artist} onChange={(e) => setEditValues(v => ({ ...v, artist: e.target.value }))} className="h-8 text-sm" />
                      </td>
                      <td className="p-2 text-center">{song.youtube_url ? <Check className="w-4 h-4 text-green-500 mx-auto" /> : <X className="w-4 h-4 text-muted-foreground mx-auto" />}</td>
                      <td className="p-2 text-center hidden sm:table-cell">{song.lyrics ? <Check className="w-4 h-4 text-green-500 mx-auto" /> : <X className="w-4 h-4 text-muted-foreground mx-auto" />}</td>
                      <td className="p-2 text-center hidden md:table-cell">
                        <Input value={editValues.tags} onChange={(e) => setEditValues(v => ({ ...v, tags: e.target.value }))} className="h-8 text-sm" />
                      </td>
                      <td className="p-2 flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => saveEdit(song.id)} disabled={saving}><Save className="w-3 h-3" /></Button>
                        <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}><X className="w-3 h-3" /></Button>
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-3 font-medium truncate max-w-[200px]">{song.title}</td>
                      <td className="p-3 text-muted-foreground truncate max-w-[150px] hidden sm:table-cell">{song.artist || "—"}</td>
                      <td className="p-3 text-center">{song.youtube_url ? <Check className="w-4 h-4 text-green-500 mx-auto" /> : <X className="w-4 h-4 text-muted-foreground mx-auto" />}</td>
                      <td className="p-3 text-center hidden sm:table-cell">{song.lyrics ? <Check className="w-4 h-4 text-green-500 mx-auto" /> : <X className="w-4 h-4 text-muted-foreground mx-auto" />}</td>
                      <td className="p-3 text-center hidden md:table-cell">{song.tags ? <Check className="w-4 h-4 text-green-500 mx-auto" /> : <X className="w-4 h-4 text-muted-foreground mx-auto" />}</td>
                      <td className="p-3"><Button size="sm" variant="ghost" onClick={() => startEdit(song)} className="text-xs">편집</Button></td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
          <Button size="sm" variant="outline" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
};

// ─── Tab 2: YouTube Matching ───
const YouTubeMatchingTab = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  const { data: songs, isLoading } = useQuery({
    queryKey: ["admin-songs-no-youtube"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("songs")
        .select("id, title, artist")
        .is("youtube_url", null)
        .order("title");
      if (error) throw error;
      return data || [];
    },
  });

  const availableSongs = songs?.filter((s) => !skippedIds.has(s.id)) || [];
  const currentSong = availableSongs[currentIndex];

  const handleSave = async (data: { youtubeUrl: string; artist?: string }) => {
    if (!currentSong) return;
    try {
      const updateObj: any = { youtube_url: data.youtubeUrl };
      if (data.artist) updateObj.artist = data.artist;
      const { error } = await supabase.from("songs").update(updateObj).eq("id", currentSong.id);
      if (error) throw error;
      toast.success(`"${currentSong.title}" YouTube 매칭 완료`);
      queryClient.invalidateQueries({ queryKey: ["admin-songs-no-youtube"] });
      queryClient.invalidateQueries({ queryKey: ["admin-songs-all"] });
    } catch {
      toast.error("저장 실패");
    }
  };

  const handleSkip = () => {
    if (!currentSong) return;
    setSkippedIds((prev) => new Set(prev).add(currentSong.id));
  };

  if (isLoading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="text-base px-3 py-1">
          <Youtube className="w-4 h-4 mr-2" />
          {songs?.length ?? 0}곡 남음
        </Badge>
        {skippedIds.size > 0 && (
          <Badge variant="secondary">{skippedIds.size}곡 건너뜀</Badge>
        )}
      </div>

      {!currentSong ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Check className="w-12 h-12 text-green-500 mx-auto mb-3" />
            <p className="text-lg font-medium">모든 곡의 YouTube 매칭이 완료되었습니다!</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Music className="w-4 h-4" />
              {currentSong.title}
              {currentSong.artist && <span className="text-muted-foreground font-normal">— {currentSong.artist}</span>}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SmartSongEntry
              key={currentSong.id}
              songId={currentSong.id}
              initialTitle={currentSong.title}
              initialArtist={currentSong.artist || ""}
              onSave={handleSave}
              onSkip={handleSkip}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// ─── Tab 3: Duplicate Detection ───
const DuplicateDetectionTab = () => {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: songs, isLoading } = useQuery({
    queryKey: ["admin-songs-for-duplicates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("songs").select("*");
      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="py-8 text-center space-y-4">
          <Copy className="w-10 h-10 text-muted-foreground mx-auto" />
          <div>
            <p className="font-medium">중복곡 자동 감지</p>
            <p className="text-sm text-muted-foreground mt-1">
              제목, 아티스트, YouTube URL을 기반으로 중복곡을 자동으로 찾습니다.
            </p>
          </div>
          <Button
            onClick={() => setIsOpen(true)}
            disabled={isLoading || !songs?.length}
            className="gap-2"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            중복 검사 시작 ({songs?.length ?? 0}곡)
          </Button>
        </CardContent>
      </Card>

      {songs && (
        <DuplicateReviewDialog
          open={isOpen}
          onClose={() => setIsOpen(false)}
          songs={songs}
          onMergeComplete={() => {
            queryClient.invalidateQueries({ queryKey: ["admin-songs"] });
            setIsOpen(false);
          }}
        />
      )}
    </div>
  );
};

// ─── Tab 4: Incomplete Songs ───
const IncompleteSongsTab = () => {
  const [filter, setFilter] = useState<"no_lyrics" | "no_tags" | "no_artist">("no_lyrics");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  const { data: songs, isLoading } = useQuery({
    queryKey: ["admin-songs-incomplete", filter],
    queryFn: async () => {
      let q = supabase.from("songs").select("id, title, artist, lyrics, tags").order("title");
      if (filter === "no_lyrics") q = q.or("lyrics.is.null,lyrics.eq.");
      else if (filter === "no_tags") q = q.or("tags.is.null,tags.eq.");
      else if (filter === "no_artist") q = q.or("artist.is.null,artist.eq.");
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

  const saveEdit = async (id: string) => {
    setSaving(true);
    try {
      const { error } = await supabase.from("songs").update(editValues).eq("id", id);
      if (error) throw error;
      toast.success("저장 완료");
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["admin-songs-incomplete"] });
    } catch {
      toast.error("저장 실패");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {([
          ["no_lyrics", "가사 없음"],
          ["no_tags", "태그 없음"],
          ["no_artist", "아티스트 없음"],
        ] as const).map(([key, label]) => (
          <Button
            key={key}
            size="sm"
            variant={filter === key ? "default" : "outline"}
            onClick={() => setFilter(key)}
          >
            {label}
          </Button>
        ))}
        <Badge variant="secondary" className="ml-auto">{songs?.length ?? 0}곡</Badge>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : songs?.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Check className="w-10 h-10 text-green-500 mx-auto mb-2" />
            <p className="font-medium">해당 필터에 미완성 곡이 없습니다!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {songs?.map((song: any) => (
            <Card key={song.id}>
              <CardContent className="p-3">
                {editingId === song.id ? (
                  <div className="space-y-2">
                    <Input
                      value={editValues.title ?? song.title}
                      onChange={(e) => setEditValues((v) => ({ ...v, title: e.target.value }))}
                      placeholder="제목"
                      className="h-8 text-sm"
                    />
                    <Input
                      value={editValues.artist ?? song.artist ?? ""}
                      onChange={(e) => setEditValues((v) => ({ ...v, artist: e.target.value }))}
                      placeholder="아티스트"
                      className="h-8 text-sm"
                    />
                    <Input
                      value={editValues.tags ?? song.tags ?? ""}
                      onChange={(e) => setEditValues((v) => ({ ...v, tags: e.target.value }))}
                      placeholder="태그 (쉼표 구분)"
                      className="h-8 text-sm"
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => saveEdit(song.id)} disabled={saving} className="gap-1">
                        <Save className="w-3 h-3" /> 저장
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>취소</Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{song.title}</p>
                      <p className="text-xs text-muted-foreground">{song.artist || "아티스트 없음"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!song.lyrics && <Badge variant="outline" className="text-xs"><AlertTriangle className="w-3 h-3 mr-1" />가사</Badge>}
                      {!song.tags && <Badge variant="outline" className="text-xs"><AlertTriangle className="w-3 h-3 mr-1" />태그</Badge>}
                      {!song.artist && <Badge variant="outline" className="text-xs"><AlertTriangle className="w-3 h-3 mr-1" />아티스트</Badge>}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setEditingId(song.id);
                          setEditValues({});
                        }}
                        className="text-xs"
                      >
                        편집
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Main Page ───
const AdminSongLibrary = () => {
  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <h1 className="text-2xl font-bold mb-6">Song Library 관리</h1>

        <Tabs defaultValue="all" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">전체 목록</TabsTrigger>
            <TabsTrigger value="youtube">YouTube 매칭</TabsTrigger>
            <TabsTrigger value="duplicates">중복 감지</TabsTrigger>
            <TabsTrigger value="incomplete">미완성 곡</TabsTrigger>
          </TabsList>

          <TabsContent value="all"><AllSongsTab /></TabsContent>
          <TabsContent value="youtube"><YouTubeMatchingTab /></TabsContent>
          <TabsContent value="duplicates"><DuplicateDetectionTab /></TabsContent>
          <TabsContent value="incomplete"><IncompleteSongsTab /></TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSongLibrary;

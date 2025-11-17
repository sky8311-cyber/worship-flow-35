import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, Plus, Save, Share2, Music, Search, Shield, LogOut } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { SetSongItem } from "@/components/SetSongItem";
import { SongSelector } from "@/components/SongSelector";
import { SetCollaborators } from "@/components/SetCollaborators";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";

const SetBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin, signOut } = useAuth();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    service_name: "",
    worship_leader: "",
    band_name: "",
    theme: "",
    notes: "",
  });
  const [songs, setSongs] = useState<any[]>([]);
  const [showSongSelector, setShowSongSelector] = useState(false);
  const [status, setStatus] = useState<"draft" | "published">("draft");

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const { data: existingSet, isLoading } = useQuery({
    queryKey: ["service-set", id],
    queryFn: async () => {
      if (!id) return null;
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

  useEffect(() => {
    if (existingSet) {
      setFormData({
        date: existingSet.date,
        service_name: existingSet.service_name,
        worship_leader: existingSet.worship_leader || "",
        band_name: existingSet.band_name || "",
        theme: existingSet.theme || "",
        notes: existingSet.notes || "",
      });
      setSongs(
        existingSet.set_songs
          ?.sort((a: any, b: any) => a.position - b.position)
          .map((ss: any) => ({
            ...ss,
            song: ss.songs,
          })) || []
      );
    }
  }, [existingSet]);

  const saveSetMutation = useMutation({
    mutationFn: async (publishStatus?: "draft" | "published") => {
      const statusToSave = publishStatus || status;
      let setId = id;

      if (!setId) {
        const { data, error } = await supabase
          .from("service_sets")
          .insert([formData])
          .select()
          .single();

        if (error) throw error;
        setId = data.id;
      } else {
        const { error } = await supabase
          .from("service_sets")
          .update(formData)
          .eq("id", setId);

        if (error) throw error;
      }

      // Delete existing set_songs
      if (setId) {
        await supabase.from("set_songs").delete().eq("service_set_id", setId);
      }

      // Insert new set_songs
      const setSongsData = songs.map((ss, index) => ({
        service_set_id: setId,
        song_id: ss.song_id || ss.song.id,
        position: index + 1,
        key: ss.key || ss.song.default_key,
        custom_notes: ss.custom_notes || "",
        override_score_file_url: ss.override_score_file_url || null,
        override_youtube_url: ss.override_youtube_url || null,
      }));

      if (setSongsData.length > 0) {
        const { error } = await supabase.from("set_songs").insert(setSongsData);
        if (error) throw error;
      }

      return setId;
    },
    onSuccess: (setId) => {
      toast.success("예배 세트가 저장되었습니다");
      queryClient.invalidateQueries({ queryKey: ["service-set", setId] });
      queryClient.invalidateQueries({ queryKey: ["upcoming-sets"] });
      if (!id) {
        navigate(`/set-builder/${setId}`);
      }
    },
    onError: (error: any) => {
      toast.error("저장 실패: " + error.message);
    },
  });

  const handleAddSong = (song: any) => {
    setSongs([
      ...songs,
      {
        song,
        song_id: song.id,
        key: song.default_key,
        custom_notes: "",
        override_score_file_url: null,
        override_youtube_url: null,
      },
    ]);
    setShowSongSelector(false);
  };

  const handleRemoveSong = (index: number) => {
    setSongs(songs.filter((_, i) => i !== index));
  };

  const handleUpdateSetSong = (index: number, updates: any) => {
    setSongs(songs.map((ss, i) => (i === index ? { ...ss, ...updates } : ss)));
  };

  const handleLogout = async () => {
    await signOut();
    toast.success(t("dashboard.logout"));
    navigate("/login");
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      setSongs((items) => {
        const oldIndex = items.findIndex((item, i) => i === active.id);
        const newIndex = items.findIndex((item, i) => i === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleCopyLink = () => {
    if (id) {
      const url = `${window.location.origin}/band-view/${id}`;
      navigator.clipboard.writeText(url);
      toast.success("팀 링크가 복사되었습니다");
    } else {
      toast.error("먼저 예배 세트를 저장해주세요");
    }
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

  return (
    <div className="min-h-screen bg-gradient-soft pb-8">
      <header className="border-b bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link to="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="w-5 h-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-2">
                <Calendar className="w-6 h-6 text-primary" />
                <h1 className="text-2xl font-bold text-foreground">
                  {id ? "예배 세트 편집" : "새 예배 세트"}
                </h1>
              </div>
            </div>
            <div className="flex gap-2">
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon"
                  asChild
                  title={t("dashboard.adminMenu")}
                >
                  <Link to="/admin">
                    <Shield className="h-5 w-5" />
                  </Link>
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                title={t("dashboard.logout")}
              >
                <LogOut className="h-5 w-5" />
              </Button>
              {id && (
                <Button variant="outline" onClick={handleCopyLink}>
                  <Share2 className="w-4 h-4 mr-2" />
                  팀 링크
                </Button>
              )}
              <Button onClick={() => saveSetMutation.mutate("draft")} disabled={saveSetMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                {saveSetMutation.isPending ? "저장 중..." : "저장"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>예배 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="date">날짜 *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service_name">예배 이름 *</Label>
                  <Input
                    id="service_name"
                    value={formData.service_name}
                    onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                    placeholder="예: 주일 2부 예배"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="worship_leader">예배 인도자</Label>
                  <Input
                    id="worship_leader"
                    value={formData.worship_leader}
                    onChange={(e) => setFormData({ ...formData, worship_leader: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="band_name">팀/밴드 이름</Label>
                  <Input
                    id="band_name"
                    value={formData.band_name}
                    onChange={(e) => setFormData({ ...formData, band_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="theme">주제</Label>
                  <Input
                    id="theme"
                    value={formData.theme}
                    onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">메모</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2">
            <Card className="shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>곡 목록</CardTitle>
                  <Button onClick={() => setShowSongSelector(true)} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    곡 추가
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {songs.length === 0 ? (
                  <div className="text-center py-12">
                    <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">아직 곡이 추가되지 않았습니다</p>
                    <Button onClick={() => setShowSongSelector(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      첫 번째 곡 추가하기
                    </Button>
                  </div>
                ) : (
                  <>
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={songs.map((_, i) => i)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-3">
                          {songs.map((setSong, index) => (
                            <SetSongItem
                              key={index}
                              setSong={setSong}
                              index={index}
                              onRemove={handleRemoveSong}
                              onUpdate={handleUpdateSetSong}
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>

                    <div className="mt-6 p-4 bg-accent/50 rounded-lg">
                      <h4 className="font-semibold mb-2">요약</h4>
                      <p className="text-sm text-muted-foreground">
                        총 {songs.length}곡
                      </p>
                      <p className="text-sm text-muted-foreground">
                        키 순서: {songs.map((ss) => ss.key || ss.song?.default_key || "?").join(" → ")}
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {id && user && existingSet && (
              <SetCollaborators
                serviceSetId={id}
                createdBy={existingSet.created_by}
                currentUserId={user.id}
              />
            )}
          </div>
        </div>
      </main>

      {showSongSelector && (
        <SongSelector
          open={showSongSelector}
          onClose={() => setShowSongSelector(false)}
          onSelect={handleAddSong}
        />
      )}
    </div>
  );
};

export default SetBuilder;

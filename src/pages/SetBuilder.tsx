import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Calendar, Plus, Save, Share2, Music, Search, Shield, LogOut, Upload, Lock } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { format } from "date-fns";
import { SetSongItem } from "@/components/SetSongItem";
import { SongSelector } from "@/components/SongSelector";
import { SetCollaborators } from "@/components/SetCollaborators";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Home } from "lucide-react";
import { HeaderLogo } from "@/components/layout/HeaderLogo";
import { AppLayout } from "@/components/layout/AppLayout";

const SetBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin, signOut } = useAuth();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    service_time: "",
    service_name: "",
    community_id: "",
    target_audience: "",
    worship_leader: "",
    band_name: "",
    scripture_reference: "",
    theme: "",
    worship_duration: "",
    notes: "",
  });
  const [songs, setSongs] = useState<any[]>([]);
  const [showSongSelector, setShowSongSelector] = useState(false);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [statusInitialized, setStatusInitialized] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Refs to ensure mutation always reads latest values
  const formDataRef = useRef(formData);
  const songsRef = useRef(songs);

  // Keep refs in sync with state
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    songsRef.current = songs;
  }, [songs]);

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
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const { data: existingSetSongs } = useQuery({
    queryKey: ["set-songs", id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("set_songs")
        .select(`
          *,
          songs(*)
        `)
        .eq("service_set_id", id)
        .order("position", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    refetchOnMount: "always",
    staleTime: 0,
  });

  // Fetch user's communities
  const { data: userCommunities } = useQuery({
    queryKey: ["user-communities", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("community_members")
        .select(`
          community_id,
          worship_communities(id, name)
        `)
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data?.map(m => m.worship_communities).filter(Boolean) || [];
    },
    enabled: !!user,
  });

  // Phase 2: Permission check and redirect logic
  useEffect(() => {
    if (existingSet && user) {
      const isCreator = existingSet.created_by === user.id;
      const isPublished = existingSet.status === 'published';
      
      // For published sets, redirect non-owners to BandView
      if (isPublished && !isCreator && !isAdmin) {
        navigate(`/band-view/${id}`, { replace: true });
        toast.info("게시된 워십세트를 읽기 전용으로 보고 있습니다");
        return;
      }
      
      // For draft sets, check if user has any permission
      if (!isPublished && !isCreator && !isAdmin) {
        navigate('/dashboard', { replace: true });
        toast.error("이 임시저장 워십세트를 볼 권한이 없습니다");
        return;
      }
    }
  }, [existingSet, user, isAdmin, navigate, id]);

  // Load form data from existing set with merge strategy
  useEffect(() => {
    if (!existingSet || isLoading || isSaving) return;

    setFormData(current => ({
      date: existingSet.date ?? current.date,
      service_time: existingSet.service_time ?? current.service_time,
      service_name: existingSet.service_name ?? current.service_name,
      community_id: existingSet.community_id ?? current.community_id,
      target_audience: existingSet.target_audience ?? current.target_audience,
      worship_leader: existingSet.worship_leader ?? current.worship_leader,
      band_name: existingSet.band_name ?? current.band_name,
      scripture_reference: existingSet.scripture_reference ?? current.scripture_reference,
      theme: existingSet.theme ?? current.theme,
      worship_duration: existingSet.worship_duration?.toString() ?? current.worship_duration,
      notes: existingSet.notes ?? current.notes,
    }));
    
    if (!statusInitialized) {
      setStatus(existingSet.status || "draft");
      setStatusInitialized(true);
    }

    // Safety patch for legacy sets without created_by
    if (!existingSet.created_by && user?.id) {
      supabase
        .from("service_sets")
        .update({ created_by: user.id })
        .eq("id", existingSet.id)
        .then(({ error }) => {
          if (!error) {
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey: ["service-set", existingSet.id] });
              queryClient.invalidateQueries({ queryKey: ["set-songs", existingSet.id] });
            }, 100);
          }
        });
    }
  }, [existingSet, isLoading, isSaving, statusInitialized, user]);

  // Load songs separately to prevent interference
  useEffect(() => {
    if (existingSetSongs && !isSaving) {
      setSongs(
        existingSetSongs.map((ss: any) => ({
          ...ss,
          song: ss.songs,
        }))
      );
    }
  }, [existingSetSongs, isSaving]);

  const handlePublishToggle = () => {
    if (status === "draft") {
      // Validate before publishing
      if (!formData.community_id) {
        toast.error("예배공동체를 선택해주세요");
        return;
      }
      if (songs.length === 0) {
        toast.error("최소 1곡 이상 추가해주세요");
        return;
      }
      
      // Show confirmation dialog
      setShowPublishConfirm(true);
    } else {
      // Unpublish directly
      saveSetMutation.mutate("draft");
    }
  };

  const confirmPublish = () => {
    saveSetMutation.mutate("published");
    setShowPublishConfirm(false);
  };

  const saveSetMutation = useMutation({
    mutationFn: async (publishStatus?: "draft" | "published") => {
      // Read from refs to ensure we have the latest values
      const currentForm = formDataRef.current;
      const currentSongs = songsRef.current;

      // Phase 2: Permission validation before save
      if (existingSet && user) {
        const isCreator = existingSet.created_by === user.id;
        if (!isCreator && !isAdmin) {
          throw new Error("이 워십세트를 수정할 권한이 없습니다");
        }
      }

      // Validation before save
      if (!currentForm.community_id) {
        throw new Error(t("setBuilder.errors.communityRequired"));
      }
      if (publishStatus === "published" && currentSongs.length === 0) {
        throw new Error(t("setBuilder.errors.noSongsPublish"));
      }

      const statusToSave = publishStatus || status;
      let setId = id;

      // Explicitly map all fields to ensure they're saved correctly
      const dataToSave = {
        // Required fields
        date: currentForm.date,
        service_name: currentForm.service_name,
        community_id: currentForm.community_id,
        
        // Optional worship info fields
        service_time: currentForm.service_time || null,
        target_audience: currentForm.target_audience || null,
        worship_leader: currentForm.worship_leader || null,
        band_name: currentForm.band_name || null,
        scripture_reference: currentForm.scripture_reference || null,
        theme: currentForm.theme || null,
        worship_duration: currentForm.worship_duration ? parseInt(currentForm.worship_duration, 10) : null,
        notes: currentForm.notes || null,
        
        // Status
        status: statusToSave,
      };
      
      console.log("Saving service_set with data:", dataToSave);

      if (!setId) {
        const { data, error } = await supabase
          .from("service_sets")
          .insert([
            {
              ...dataToSave,
              created_by: user.id,
            },
          ])
          .select()
          .single();

        if (error) throw error;
        setId = data.id;
      } else {
        const updateData: any = { ...dataToSave };
        // Ensure legacy sets without created_by get correctly assigned
        if (!existingSet?.created_by && user?.id) {
          updateData.created_by = user.id;
        }

        const { error } = await supabase
          .from("service_sets")
          .update(updateData)
          .eq("id", setId);

        if (error) throw error;
      }

      // Delete existing set_songs
      if (setId) {
        await supabase.from("set_songs").delete().eq("service_set_id", setId);
      }

      // Insert new set_songs
      const setSongsData = currentSongs.map((ss, index) => ({
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
    onMutate: () => {
      setIsSaving(true);
    },
    onSuccess: (setId, publishStatus) => {
      const currentForm = formDataRef.current;

      toast.success(t("setBuilder.successSave"));
      
      // Optimistically update React Query cache with current form values
      queryClient.setQueryData(["service-set", setId], (prev: any) => ({
        ...prev,
        date: currentForm.date,
        service_name: currentForm.service_name,
        community_id: currentForm.community_id,
        service_time: currentForm.service_time || null,
        target_audience: currentForm.target_audience || null,
        worship_leader: currentForm.worship_leader || null,
        band_name: currentForm.band_name || null,
        scripture_reference: currentForm.scripture_reference || null,
        theme: currentForm.theme || null,
        worship_duration: currentForm.worship_duration ? parseInt(currentForm.worship_duration, 10) : null,
        notes: currentForm.notes || null,
        status: publishStatus || prev?.status,
      }));

      // Update local state with current form data
      setFormData(currentForm);
      if (publishStatus) {
        setStatus(publishStatus);
      }
      
      // Delay invalidation to ensure DB transaction completes
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["service-set", setId] });
        queryClient.invalidateQueries({ queryKey: ["set-songs", setId] });
        queryClient.invalidateQueries({ queryKey: ["unified-community-feed"] });
        queryClient.invalidateQueries({ queryKey: ["worship-sets"] });
      }, 100);
      
      if (!id) {
        navigate(`/set-builder/${setId}`);
      }
    },
    onError: (error: any) => {
      toast.error("저장 실패: " + error.message);
    },
    onSettled: () => {
      setIsSaving(false);
    },
  });

  const handleAddSong = (songOrSongs: any) => {
    // Handle both single song and array of songs
    const songsToAdd = Array.isArray(songOrSongs) ? songOrSongs : [songOrSongs];
    
    const newSetSongs = songsToAdd.map(song => ({
      song,
      song_id: song.id,
      key: song.default_key,
      custom_notes: "",
      override_score_file_url: null,
      override_youtube_url: null,
    }));
    
    setSongs(prev => [...prev, ...newSetSongs]);
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
      toast.error("먼저 워십세트를 저장해주세요");
    }
  };

  if (isLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-gradient-soft flex items-center justify-center">
          <div className="text-center">
            <Music className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">로딩 중...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="min-h-[100dvh] pb-8">

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>예배 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date" className="text-sm">날짜 *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                      className="text-sm"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="service_time" className="text-sm">시간</Label>
                    <Input
                      id="service_time"
                      type="time"
                      value={formData.service_time}
                      onChange={(e) => setFormData({ ...formData, service_time: e.target.value })}
                      className="text-sm"
                      placeholder="HH:MM"
                    />
                  </div>
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
                  <Label htmlFor="community_id" className="text-destructive">
                    {t("setBuilder.community")} *
                  </Label>
                  <Select
                    value={formData.community_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, community_id: value })
                    }
                  >
                    <SelectTrigger id="community_id">
                      <SelectValue placeholder={t("setBuilder.selectCommunity")} />
                    </SelectTrigger>
                    <SelectContent>
                      {userCommunities?.map((community: any) => (
                        <SelectItem key={community.id} value={community.id}>
                          {community.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target_audience">{t("setBuilder.targetAudience")}</Label>
                  <Select value={formData.target_audience} onValueChange={(value) => setFormData({ ...formData, target_audience: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("setBuilder.selectTargetAudience")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="전체">{t("setBuilder.audiences.all")}</SelectItem>
                      <SelectItem value="청년">{t("setBuilder.audiences.youngAdults")}</SelectItem>
                      <SelectItem value="장년">{t("setBuilder.audiences.adults")}</SelectItem>
                      <SelectItem value="청소년">{t("setBuilder.audiences.youth")}</SelectItem>
                      <SelectItem value="어린이">{t("setBuilder.audiences.children")}</SelectItem>
                      <SelectItem value="영어권">{t("setBuilder.audiences.english")}</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <Label htmlFor="scripture_reference">{t("setBuilder.scriptureReference")}</Label>
                  <Input
                    id="scripture_reference"
                    value={formData.scripture_reference}
                    onChange={(e) => setFormData({ ...formData, scripture_reference: e.target.value })}
                    placeholder="예: 시편 23편, 요한복음 3:16"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="theme">{t("setBuilder.themeSermonTitle")}</Label>
                  <Input
                    id="theme"
                    value={formData.theme}
                    onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="worship_duration">{t("setBuilder.worshipDuration")}</Label>
                  <Input
                    id="worship_duration"
                    type="number"
                    value={formData.worship_duration}
                    onChange={(e) => setFormData({ ...formData, worship_duration: e.target.value })}
                    placeholder="20"
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

      <AlertDialog open={showPublishConfirm} onOpenChange={setShowPublishConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>워십세트 게시</AlertDialogTitle>
            <AlertDialogDescription>
              이 워십세트는 선택한 예배공동체의 모든 팀멤버에게 공개됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={confirmPublish}>게시하기</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </AppLayout>
  );
};

export default SetBuilder;

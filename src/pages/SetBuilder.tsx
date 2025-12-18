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
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Calendar, Plus, Save, Share2, Music, Search, Shield, LogOut, Upload, Lock, Check, FileText, Copy, Trash2, Loader2, Circle, CheckCircle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { format } from "date-fns";
import { SetSongItem } from "@/components/SetSongItem";
import { SetComponentItem } from "@/components/SetComponentItem";
import { SongSelector } from "@/components/SongSelector";
import { SetCollaborators } from "@/components/SetCollaborators";
import { WorshipComponentPalette } from "@/components/WorshipComponentPalette";
import { TemplateSelector } from "@/components/TemplateSelector";
import { SaveTemplateDialog } from "@/components/SaveTemplateDialog";
import { CreateCommunityDialog } from "@/components/CreateCommunityDialog";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useScrollPosition, clearScrollPosition } from "@/hooks/useScrollPosition";
import { Home, AlertCircle } from "lucide-react";
import { HeaderLogo } from "@/components/layout/HeaderLogo";
import { AppLayout } from "@/components/layout/AppLayout";
import { WorshipComponentType, getComponentLabel } from "@/lib/worshipComponents";
import { WorshipSetPositionsManager } from "@/components/worship-set/WorshipSetPositionsManager";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShareLinkDialog } from "@/components/ShareLinkDialog";
import { useAutoSaveDraft, clearLastEditedDraft } from "@/hooks/useAutoSaveDraft";

// Union type for items in the worship set (songs and components)
type SetItem = 
  | { type: "song"; data: any; id: string }
  | { type: "component"; data: any; id: string };

const SetBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAdmin, signOut } = useAuth();
  const { t, language } = useTranslation();
  const { user } = useAuth();
  
  // Remember scroll position per set
  useScrollPosition(id ? `set-builder-${id}` : "set-builder-new");
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
  const [items, setItems] = useState<SetItem[]>([]);
  const [showSongSelector, setShowSongSelector] = useState(false);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [statusInitialized, setStatusInitialized] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  // Auto-save draft hook
  const { 
    hasUnsavedChanges: autoSaveHasChanges, 
    isSaving: autoSaveIsSaving, 
    lastSavedAt,
    forceSave,
    newSetId
  } = useAutoSaveDraft({
    id,
    formData,
    items,
    status,
    enabled: status === "draft",
  });

  // Navigate to new set URL if created via auto-save
  useEffect(() => {
    if (newSetId && !id) {
      navigate(`/set-builder/${newSetId}`, { replace: true });
    }
  }, [newSetId, id, navigate]);

  const [isSaving, setIsSaving] = useState(false);

  // Delete mutation
  const deleteSetMutation = useMutation({
    mutationFn: async () => {
      if (!id) throw new Error("No set ID");
      const { error } = await supabase
        .from("service_sets")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["service-sets"] });
      queryClient.invalidateQueries({ queryKey: ["user-draft-count"] });
      // Clear last edited draft if deleting the same set
      clearLastEditedDraft();
      // Clear scroll position for this set
      if (id) clearScrollPosition(`set-builder-${id}`);
      toast.success(language === "ko" ? "예배세트가 삭제되었습니다" : "Worship set deleted");
      navigate("/worship-sets");
    },
    onError: (error: any) => {
      toast.error(language === "ko" ? "삭제 중 오류가 발생했습니다" : "Failed to delete worship set");
      console.error("Delete error:", error);
    },
  });

  // Refs to ensure mutation always reads latest values
  const formDataRef = useRef(formData);
  const itemsRef = useRef(items);

  // Keep refs in sync with state
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

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

  // Permission check for delete (only creator or admin)
  const canDelete = existingSet && (existingSet.created_by === user?.id || isAdmin);

  const { data: existingSetSongs } = useQuery({
    queryKey: ["set-songs", id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("set_songs")
        .select(`
          *,
          songs(*, song_scores(id, key, file_url, page_number, position))
        `)
        .eq("service_set_id", id)
        .order("position", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    refetchOnMount: "always",
    staleTime: 0,
  });

  const { data: existingSetComponents } = useQuery({
    queryKey: ["set-components", id],
    enabled: !!id,
    queryFn: async () => {
      if (!id) return [];
      const { data, error } = await supabase
        .from("set_components")
        .select("*")
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
          worship_communities(id, name, church_account_id)
        `)
        .eq("user_id", user.id);
      
      if (error) throw error;
      return data?.map(m => m.worship_communities).filter(Boolean) || [];
    },
    enabled: !!user,
  });

  // Check if user is a collaborator for this set
  const { data: isCollaborator } = useQuery({
    queryKey: ["set-collaborator-check", id, user?.id],
    queryFn: async () => {
      if (!id || !user) return false;
      const { data } = await supabase
        .from("set_collaborators")
        .select("id")
        .eq("service_set_id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!id && !!user,
  });

  // Check if user is a community leader for the set's community
  const { data: isCommunityLeaderForSet } = useQuery({
    queryKey: ["community-leader-check", existingSet?.community_id, user?.id],
    queryFn: async () => {
      if (!existingSet?.community_id || !user) return false;
      const { data } = await supabase
        .from("community_members")
        .select("role")
        .eq("community_id", existingSet.community_id)
        .eq("user_id", user.id)
        .eq("role", "community_leader")
        .maybeSingle();
      return !!data;
    },
    enabled: !!existingSet?.community_id && !!user,
  });

  // Get church_account_id for the selected community
  const selectedCommunity = userCommunities?.find((c: any) => c.id === formData.community_id);
  const churchAccountId = selectedCommunity?.church_account_id;

  // Phase 2: Permission check and redirect logic
  useEffect(() => {
    if (existingSet && user) {
      const isCreator = existingSet.created_by === user.id;
      const isPublished = existingSet.status === 'published';
      const hasEditPermission = isCreator || isAdmin || isCollaborator || isCommunityLeaderForSet;
      
      // For published sets, redirect non-owners to BandView
      if (isPublished && !hasEditPermission) {
        navigate(`/band-view/${id}`, { replace: true });
        toast.info("게시된 워십세트를 읽기 전용으로 보고 있습니다");
        return;
      }
      
      // For draft sets, check if user has any permission
      if (!isPublished && !hasEditPermission) {
        navigate('/dashboard', { replace: true });
        toast.error("이 임시저장 워십세트를 볼 권한이 없습니다");
        return;
      }
    }
  }, [existingSet, user, isAdmin, isCollaborator, isCommunityLeaderForSet, navigate, id]);

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

  // Merge and load songs + components by position
  useEffect(() => {
    if (isSaving) return;
    
    const songs: SetItem[] = (existingSetSongs || []).map((ss: any) => ({
      type: "song" as const,
      id: `song-${ss.id}`,
      data: { ...ss, song: ss.songs },
    }));
    
    const components: SetItem[] = (existingSetComponents || []).map((comp: any) => ({
      type: "component" as const,
      id: `component-${comp.id}`,
      data: comp,
    }));
    
    // Merge and sort by position
    const merged = [...songs, ...components].sort((a, b) => {
      const posA = a.type === "song" ? a.data.position : a.data.position;
      const posB = b.type === "song" ? b.data.position : b.data.position;
      return posA - posB;
    });
    
    setItems(merged);
  }, [existingSetSongs, existingSetComponents, isSaving]);

  const handlePublishToggle = () => {
    if (status === "draft") {
      // Validate before publishing
      if (!formData.community_id) {
        toast.error("예배공동체를 선택해주세요");
        return;
      }
      const songCount = items.filter(i => i.type === "song").length;
      if (songCount === 0) {
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
      const currentItems = itemsRef.current;

      // Phase 2: Permission validation before save
      if (existingSet && user) {
        const isCreator = existingSet.created_by === user.id;
        if (!isCreator && !isAdmin && !isCollaborator && !isCommunityLeaderForSet) {
          throw new Error("이 워십세트를 수정할 권한이 없습니다");
        }
      }

      // Validation before save
      if (!currentForm.community_id) {
        throw new Error(t("setBuilder.errors.communityRequired"));
      }
      const songCount = currentItems.filter(i => i.type === "song").length;
      if (publishStatus === "published" && songCount === 0) {
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

      // Delete existing set_songs and set_components
      if (setId) {
        await supabase.from("set_songs").delete().eq("service_set_id", setId);
        await supabase.from("set_components").delete().eq("service_set_id", setId);
      }

      // Separate items into songs and components with positions
      const songsData: any[] = [];
      const componentsData: any[] = [];
      
      currentItems.forEach((item, index) => {
        const position = index + 1;
        if (item.type === "song") {
          songsData.push({
            service_set_id: setId,
            song_id: item.data.song_id || item.data.song?.id,
            position,
            key: item.data.key || item.data.song?.default_key,
            key_change_to: item.data.key_change_to || null,
            custom_notes: item.data.custom_notes || "",
            override_score_file_url: item.data.override_score_file_url || null,
            override_youtube_url: item.data.override_youtube_url || null,
            lyrics: item.data.lyrics || null,
            bpm: item.data.bpm || null,
            time_signature: item.data.time_signature || null,
            energy_level: item.data.energy_level || null,
          });
        } else {
          componentsData.push({
            service_set_id: setId,
            position,
            component_type: item.data.component_type,
            label: item.data.label,
            notes: item.data.notes || null,
            duration_minutes: item.data.duration_minutes || null,
            assigned_to: item.data.assigned_to || null,
            content: item.data.content || null,
          });
        }
      });

      // Insert songs
      if (songsData.length > 0) {
        const { error } = await supabase.from("set_songs").insert(songsData);
        if (error) throw error;
      }

      // Insert components
      if (componentsData.length > 0) {
        const { error } = await supabase.from("set_components").insert(componentsData);
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
        queryClient.invalidateQueries({ queryKey: ["set-components", setId] });
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

  const handleAddSong = (song: any, selectedKey?: string, selectedScoreUrl?: string) => {
    // Single song addition with optional key variation
    const newSetItem: SetItem = {
      type: "song",
      id: `song-new-${Date.now()}`,
      data: {
        song,
        song_id: song.id,
        key: selectedKey || song.default_key,
        custom_notes: "",
        override_score_file_url: selectedScoreUrl || null,
        override_youtube_url: null,
        lyrics: null,
      },
    };
    
    setItems(prev => [...prev, newSetItem]);
  };

  const handleAddComponent = (type: WorshipComponentType, customLabel?: string) => {
    const label = customLabel || getComponentLabel(type, language as "en" | "ko");
    const newComponent: SetItem = {
      type: "component",
      id: `component-new-${Date.now()}`,
      data: {
        component_type: type,
        label,
        notes: "",
        duration_minutes: null,
      },
    };
    
    setItems(prev => [...prev, newComponent]);
  };

  const handleSelectTemplate = (template: any) => {
    // Apply template data to form
    setFormData(prev => ({
      ...prev,
      service_name: template.service_name || prev.service_name,
      community_id: template.community_id || prev.community_id,
      target_audience: template.target_audience || prev.target_audience,
      worship_leader: template.worship_leader || prev.worship_leader,
      band_name: template.band_name || prev.band_name,
      scripture_reference: template.scripture_reference || prev.scripture_reference,
      theme: template.theme || prev.theme,
      worship_duration: template.worship_duration?.toString() || prev.worship_duration,
      service_time: template.service_time || prev.service_time,
      notes: template.notes || prev.notes,
    }));
    
    // Apply template components
    if (template.template_components && template.template_components.length > 0) {
      const sortedComponents = [...template.template_components].sort((a, b) => a.position - b.position);
      const newItems: SetItem[] = sortedComponents.map((comp: any) => ({
        type: "component" as const,
        id: `component-template-${Date.now()}-${comp.position}`,
        data: {
          component_type: comp.component_type,
          label: comp.label,
          notes: comp.notes || "",
          duration_minutes: comp.duration_minutes || null,
          assigned_to: comp.default_assigned_to || "",
          content: comp.default_content || "",
        },
      }));
      
      setItems(prev => [...newItems, ...prev]);
      toast.success(language === "ko" ? "템플릿이 적용되었습니다" : "Template applied");
    }
  };

  const getComponentsForTemplate = () => {
    return items
      .filter(item => item.type === "component")
      .map(item => ({
        component_type: item.data.component_type,
        label: item.data.label,
        notes: item.data.notes,
        duration_minutes: item.data.duration_minutes,
        assigned_to: item.data.assigned_to,
        content: item.data.content,
      }));
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, updates: any) => {
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      return { ...item, data: { ...item.data, ...updates } };
    }));
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    setItems(prev => arrayMove(prev, index, index - 1));
  };

  const handleMoveDown = (index: number) => {
    if (index >= items.length - 1) return;
    setItems(prev => arrayMove(prev, index, index + 1));
  };

  const handleLogout = async () => {
    await signOut();
    toast.success(t("dashboard.logout"));
    navigate("/login");
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;

    if (active.id !== over?.id) {
      setItems((currentItems) => {
        const oldIndex = currentItems.findIndex((item) => item.id === active.id);
        const newIndex = currentItems.findIndex((item) => item.id === over?.id);
        if (oldIndex === -1 || newIndex === -1) return currentItems;
        return arrayMove(currentItems, oldIndex, newIndex);
      });
    }
  };

  const handleCopyLink = () => {
    if (id) {
      setShowShareDialog(true);
    } else {
      toast.error("먼저 워십세트를 저장해주세요");
    }
  };

  const songCount = items.filter(i => i.type === "song").length;
  const componentCount = items.filter(i => i.type === "component").length;

  // Reusable Action Buttons Component
  const renderActionButtons = (className?: string) => (
    <div className={`flex items-center justify-center gap-2 flex-wrap ${className || 'mb-4'}`}>
      {id && canDelete && (
        <Button 
          variant="destructive" 
          size="sm" 
          className="h-8 gap-1.5" 
          onClick={() => setShowDeleteConfirm(true)}
          disabled={deleteSetMutation.isPending}
        >
          <Trash2 className="w-4 h-4 shrink-0" />
          <span>{language === "ko" ? "삭제" : "Delete"}</span>
        </Button>
      )}
      
      {id && (
        <Button variant="outline" size="sm" className="h-8 gap-1.5" onClick={handleCopyLink}>
          <Share2 className="w-4 h-4 shrink-0" />
          <span>{language === "ko" ? "링크 공유" : "Share Link"}</span>
        </Button>
      )}

      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5"
        onClick={() => navigate("/templates")}
      >
        <FileText className="w-4 h-4 shrink-0" />
        <span>{language === "ko" ? "템플릿" : "Templates"}</span>
      </Button>
      <Button
        variant="secondary"
        size="sm"
        className="h-8 gap-1.5"
        onClick={() => setShowSaveTemplate(true)}
      >
        <Copy className="w-4 h-4 shrink-0" />
        <span>{language === "ko" ? "템플릿 저장" : "Save Template"}</span>
      </Button>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="h-8 gap-1.5"
              onClick={() => saveSetMutation.mutate(undefined)}
              disabled={saveSetMutation.isPending}
            >
              <Save className="w-4 h-4 shrink-0" />
              <span>{saveSetMutation.isPending ? "저장 중..." : "저장"}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p>{t("tooltips.setBuilder.save")}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size="sm" 
              className="h-8"
              onClick={handlePublishToggle}
              disabled={saveSetMutation.isPending}
            >
              {status === "draft" ? "게시하기" : "게시취소"}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p>{status === "draft" 
              ? t("tooltips.setBuilder.publish") 
              : t("tooltips.setBuilder.unpublish")
            }</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );

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
      <div className="container mx-auto px-4 py-6">
        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/worship-sets")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            뒤로
          </Button>
          
          <div className="flex items-center gap-3">
            {/* Auto-save status indicator */}
            {status === "draft" && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                {autoSaveIsSaving ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>저장 중...</span>
                  </>
                ) : autoSaveHasChanges ? (
                  <>
                    <Circle className="h-2 w-2 fill-orange-500 text-orange-500" />
                    <span>저장 대기</span>
                  </>
                ) : lastSavedAt ? (
                  <>
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    <span>자동 저장됨</span>
                  </>
                ) : null}
              </div>
            )}

            {status === "draft" ? (
              <Badge variant="outline">
                <Lock className="w-3 h-3 mr-1" />
                임시저장
              </Badge>
            ) : (
              <Badge>
                <Check className="w-3 h-3 mr-1" />
                게시됨
              </Badge>
            )}
          </div>
        </div>
        
        {/* Action Buttons Component */}
        {renderActionButtons()}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Worship Info */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="shadow-md">
              <CardHeader>
                <CardTitle>예배 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                {/* Template Selector - only show when creating new set */}
                {!id && (
                  <TemplateSelector
                    communityId={formData.community_id}
                    onSelectTemplate={handleSelectTemplate}
                  />
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5 min-w-0">
                    <Label htmlFor="date" className="text-sm">날짜 *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                      className="text-sm h-9"
                    />
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <Label htmlFor="service_time" className="text-sm">시간</Label>
                    <Input
                      id="service_time"
                      type="time"
                      value={formData.service_time}
                      onChange={(e) => setFormData({ ...formData, service_time: e.target.value })}
                      className="text-sm h-9"
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
                    onValueChange={(value) => {
                      if (value === "__create_new__") {
                        setShowCreateCommunity(true);
                      } else {
                        setFormData({ ...formData, community_id: value });
                      }
                    }}
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
                      <SelectItem value="__create_new__" className="text-primary font-medium">
                        <span className="flex items-center gap-2">
                          <Plus className="w-4 h-4" />
                          {t("setBuilder.createCommunity")}
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {/* Warning when no communities available */}
                  {(!userCommunities || userCommunities.length === 0) && (
                    <Alert variant="default" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        {t("setBuilder.noCommunityWarning")}
                      </AlertDescription>
                    </Alert>
                  )}
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

            {/* Worship Components Palette */}
            <WorshipComponentPalette onAddComponent={handleAddComponent} />

            {/* Team Positions Manager - only for church accounts */}
            {id && churchAccountId && (
              <WorshipSetPositionsManager
                serviceSetId={id}
                communityId={formData.community_id}
                churchAccountId={churchAccountId}
              />
            )}
          </div>

          {/* Main Content - Items List */}
          <div className="lg:col-span-3">
            <Card className="shadow-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>
                    {language === "ko" ? "예배 순서" : "Worship Order"}
                  </CardTitle>
                  <Button onClick={() => setShowSongSelector(true)} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    곡 추가
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <div className="text-center py-12">
                    <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      {language === "ko" 
                        ? "아직 순서가 추가되지 않았습니다" 
                        : "No items added yet"}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <Button onClick={() => setShowSongSelector(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        {language === "ko" ? "첫 번째 곡 추가하기" : "Add First Song"}
                      </Button>
                      <Button variant="outline" onClick={() => handleAddComponent("welcome")}>
                        <Plus className="w-4 h-4 mr-2" />
                        {language === "ko" ? "순서 추가하기" : "Add Component"}
                      </Button>
        </div>

      </div>
                ) : (
                  <>
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragEnd={handleDragEnd}
                    >
                      <SortableContext
                        items={items.map((item) => item.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-3">
                          {items.map((item, index) => 
                            item.type === "song" ? (
                              <SetSongItem
                                key={item.id}
                                setSong={item.data}
                                index={index}
                                totalCount={items.length}
                                onRemove={handleRemoveItem}
                                onUpdate={handleUpdateItem}
                                onMoveUp={handleMoveUp}
                                onMoveDown={handleMoveDown}
                              />
                            ) : (
                              <SetComponentItem
                                key={item.id}
                                component={{ ...item.data, id: item.id }}
                                index={index}
                                totalCount={items.length}
                                onRemove={handleRemoveItem}
                                onUpdate={handleUpdateItem}
                                onMoveUp={handleMoveUp}
                                onMoveDown={handleMoveDown}
                              />
                            )
                          )}
                        </div>
                      </SortableContext>
                    </DndContext>

                    <div className="mt-6 p-4 bg-accent/50 rounded-lg">
                      <h4 className="font-semibold mb-2">
                        {language === "ko" ? "요약" : "Summary"}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {language === "ko" 
                          ? `총 ${items.length}개 항목 (곡 ${songCount}개, 순서 ${componentCount}개)`
                          : `Total ${items.length} items (${songCount} songs, ${componentCount} components)`
                        }
                      </p>
                      {songCount > 0 && (
                        <p className="text-sm text-muted-foreground">
                          {language === "ko" ? "키 순서: " : "Key sequence: "}
                          {items
                            .filter(i => i.type === "song")
                            .map((i) => i.data.key || i.data.song?.default_key || "?")
                            .join(" → ")}
                        </p>
                      )}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Bottom Action Buttons */}
            {renderActionButtons("mt-6 pt-6 border-t mb-8")}

            {id && user && existingSet && (
              <SetCollaborators
                serviceSetId={id}
                createdBy={existingSet.created_by}
                currentUserId={user.id}
              />
            )}
          </div>
        </div>
      </div>

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

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === "ko" ? "예배세트를 삭제하시겠습니까?" : "Delete Worship Set?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === "ko" 
                ? "이 작업은 되돌릴 수 없습니다. 모든 곡과 순서 항목이 함께 삭제됩니다."
                : "This action cannot be undone. All songs and components will be permanently deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {language === "ko" ? "취소" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => deleteSetMutation.mutate()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {language === "ko" ? "삭제" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <SaveTemplateDialog
        open={showSaveTemplate}
        onOpenChange={setShowSaveTemplate}
        formData={formData}
        components={getComponentsForTemplate()}
      />

      <CreateCommunityDialog
        open={showCreateCommunity}
        onOpenChange={setShowCreateCommunity}
      />

      {id && (
        <ShareLinkDialog
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          setId={id}
          publicShareToken={(existingSet as any)?.public_share_token || null}
          publicShareEnabled={(existingSet as any)?.public_share_enabled || false}
          onUpdate={() => {
            queryClient.invalidateQueries({ queryKey: ["service-set", id] });
            queryClient.invalidateQueries({ queryKey: ["upcoming-sets"] });
          }}
        />
      )}
    </AppLayout>
  );
};

export default SetBuilder;

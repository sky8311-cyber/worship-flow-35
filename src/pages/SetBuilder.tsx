import { useState, useEffect, useRef, useCallback, type MouseEvent } from "react";
import { useParams, useNavigate, Link, useSearchParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Calendar, Plus, Save, Share2, Music, Search, Shield, LogOut, Upload, Lock, Check, FileText, Copy, Trash2, Loader2, Circle, CheckCircle, XCircle, History } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { format } from "date-fns";
import { SetSongItem } from "@/components/SetSongItem";
import { SetComponentItem } from "@/components/SetComponentItem";
import { CollaboratorsHeader } from "@/components/CollaboratorsHeader";
import { WorshipComponentPalette } from "@/components/WorshipComponentPalette";

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
import { SetHistoryTab } from "@/components/worship-set/SetHistoryTab";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ShareLinkDialog } from "@/components/ShareLinkDialog";
import { useAutoSaveDraft, clearLastEditedDraft, upsertSongsAndComponents, type DbIdUpdate } from "@/hooks/useAutoSaveDraft";
import { useSetRealtimeSync, useRealtimeHandlers } from "@/hooks/useSetRealtimeSync";
import { useSetEditLock } from "@/hooks/useSetEditLock";
import { AlertTriangle, Edit2, Eye, BookOpen } from "lucide-react";
import { SEOHead } from "@/components/seo/SEOHead";
import { AISetBuilderPanel } from "@/components/AISetBuilderPanel";
import { useTierFeature } from "@/hooks/useTierFeature";
import { useAppSettings } from "@/hooks/useAppSettings";
import { LockedFeatureBanner } from "@/components/LockedFeatureBanner";
import { Sparkles } from "lucide-react";

// Union type for items in the worship set (songs and components)
type SetItem = 
  | { type: "song"; data: any; id: string; dbId?: string }
  | { type: "component"; data: any; id: string; dbId?: string };

const SetBuilder = () => {
  const { id } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const templateIdFromUrl = searchParams.get("templateId");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAdmin, signOut } = useAuth();
  const { t, language } = useTranslation();
  
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
  const [hasInitializedItems, setHasInitializedItems] = useState(false);
  const localChangeIdsRef = useRef<Set<string>>(new Set());
  const itemsEndRef = useRef<HTMLDivElement>(null);
  const externalAddedIdsRef = useRef<Set<string>>(new Set()); // Track externally added items
  const suppressAutoSaveRef = useRef(false); // Suppress auto-save during revert
  const prevIdRef = useRef<string | undefined>(undefined);
  const [status, setStatus] = useState<"draft" | "published">("draft");
  const [statusInitialized, setStatusInitialized] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [showCreateCommunity, setShowCreateCommunity] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const { hasFeature } = useTierFeature();
  const { isAiSetBuilderEnabled } = useAppSettings();
  const [templateApplied, setTemplateApplied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Query to get set creator for auto-acquire decision (lightweight)
  const { data: setCreatorInfo } = useQuery({
    queryKey: ["set-creator", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("service_sets")
        .select("created_by")
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
    staleTime: 60000,
  });

  // State for explicit edit mode request
  const [wantsToEdit, setWantsToEdit] = useState(false);
  const [showEditRequestDialog, setShowEditRequestDialog] = useState(false);

  // Determine if we should auto-acquire lock
  // Only auto-acquire for new sets OR if user is the creator OR if user was recently editing this set
  const isNewSet = !id;
  const isOwnerForLock = !!setCreatorInfo && setCreatorInfo.created_by === user?.id;
  const currentEditingSetId = typeof window !== 'undefined' ? sessionStorage.getItem('currentEditingSetId') : null;
  const wasRecentlyEditing = !!id && currentEditingSetId === id;
  const shouldAutoAcquire = isNewSet || isOwnerForLock || wasRecentlyEditing || isAdmin;

  // Smart edit lock - replaces old presence-based system
  const { 
    lockStatus, 
    lockHolder, 
    isEditMode, 
    isAcquiring, 
    acquireLock, 
    releaseLock,
    showWelcomeMessage,
    dismissWelcomeMessage,
    inactivityWarning,
    sessionTimeRemaining,
    // Takeover flow
    requestTakeover,
    cancelTakeoverRequest,
    respondToTakeover,
    isRequestingTakeover,
    takeoverCountdown,
    takeoverRequester,
    isTakeoverRequested,
    takeoverResponseCountdown,
  } = useSetEditLock(id, {
    autoAcquire: shouldAutoAcquire,
  });
  
  // Derived states
  const isBlocked = !isEditMode && lockStatus === "locked_by_other";
  const isReadOnlyMode = !isEditMode && !isNewSet && !isOwnerForLock;
  
  // Handle explicit edit request from read-only mode
  const handleRequestEdit = async () => {
    if (lockStatus === "locked_by_other") {
      // Someone is editing - show dialog to confirm request
      setShowEditRequestDialog(true);
    } else {
      // No one is editing - acquire lock directly
      const acquired = await acquireLock();
      if (acquired) {
        setWantsToEdit(true);
        toast.success(language === "ko" ? "편집 모드로 전환되었습니다" : "Switched to edit mode");
      } else {
        toast.error(language === "ko" ? "편집 모드로 전환할 수 없습니다" : "Could not switch to edit mode");
      }
    }
  };

  // Confirm edit request when someone else is editing
  const handleConfirmEditRequest = async () => {
    setShowEditRequestDialog(false);
    await requestTakeover();
  };
  
  // Debug logging for edit lock
  useEffect(() => {
    console.log("[SetBuilder] EditLock state - lockStatus:", lockStatus, "isEditMode:", isEditMode, "lockHolder:", lockHolder, "isReadOnlyMode:", isReadOnlyMode);
  }, [lockStatus, isEditMode, lockHolder, isReadOnlyMode]);

  // Auto-restore edit mode when returning from song library
  useEffect(() => {
    if (id && !isEditMode && lockStatus !== 'locked_by_other' && !isAcquiring) {
      const wasEditing = sessionStorage.getItem(`wasEditing:${id}`);
      if (wasEditing === 'true') {
        console.log("[SetBuilder] Auto-restoring edit mode for set:", id);
        acquireLock().then((acquired) => {
          if (acquired) {
            sessionStorage.removeItem(`wasEditing:${id}`);
            // Also clear the currentEditingSetId as we've successfully restored
            const currentId = sessionStorage.getItem('currentEditingSetId');
            if (currentId === id) {
              sessionStorage.removeItem('currentEditingSetId');
              sessionStorage.removeItem('currentEditingSetName');
            }
          }
        });
      }
    }
  }, [id, isEditMode, lockStatus, isAcquiring, acquireLock]);

  // Prevent redirect glitches by only running permission checks once per set id
  const permissionCheckedForIdRef = useRef<string | undefined>(undefined);

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

  const { data: existingSet, isLoading: isExistingSetLoading } = useQuery({
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
    staleTime: 0, // Always get fresh data to reflect status changes from WorshipSets
  });

  // Separate lightweight query for delete permission to avoid cache overwrites
  const { data: setOwner, isLoading: isSetOwnerLoading } = useQuery({
    queryKey: ["service-set-owner", id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await supabase
        .from("service_sets")
        .select("id, created_by")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!id,
    refetchOnMount: "always",
    refetchOnWindowFocus: false,
    staleTime: 30000,
  });

  // Permission check for delete (only creator or admin) - ensure user is loaded
  const canDelete =
    !!user && !!setOwner?.created_by && (setOwner.created_by === user.id || isAdmin);

  const { data: existingSetSongs, isFetching: isFetchingSongs, dataUpdatedAt: songsUpdatedAt } = useQuery({
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
    refetchOnWindowFocus: false, // Prevent refetch on app switch to preserve local changes
    staleTime: 0,
  });

  const { data: existingSetComponents, isFetching: isFetchingComponents, dataUpdatedAt: componentsUpdatedAt } = useQuery({
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
    refetchOnWindowFocus: false, // Prevent refetch on app switch to preserve local changes
    staleTime: 0,
  });

  // Track last initialized timestamp to detect fresh data
  const lastInitializedAtRef = useRef<number>(0);

  // Determine if existing data is fully loaded for auto-save safety
  // For new sets, always consider loaded. For existing sets, wait until items are initialized.
  const isExistingDataLoaded = !id || hasInitializedItems;

  // Callback to update items with newly assigned dbIds after INSERT
  const handleDbIdsUpdated = useCallback((updates: DbIdUpdate[]) => {
    if (updates.length === 0) return;
    
    setItems(currentItems => {
      const updateMap = new Map(updates.map(u => [u.localId, u.dbId]));
      return currentItems.map(item => {
        const newDbId = updateMap.get(item.id);
        if (newDbId && !item.dbId) {
          return { ...item, dbId: newDbId };
        }
        return item;
      });
    });
  }, []);

  // Auto-save draft hook - placed after queries to ensure data loading check works
  // CRITICAL: Disable auto-save when blocked to prevent data overwrites
  const { 
    hasUnsavedChanges: autoSaveHasChanges, 
    isSaving: autoSaveIsSaving, 
    lastSavedAt,
    forceSave,
    cancelPendingAutoSave,
    newSetId,
    consecutiveErrors: autoSaveConsecutiveErrors,
    autoSaveError,
  } = useAutoSaveDraft({
    id,
    formData,
    items,
    status,
    enabled: status === "draft" && isExistingDataLoaded && !suppressAutoSaveRef.current && !isBlocked,
    isDataLoaded: isExistingDataLoaded,
    localChangeIdsRef,
    externalAddedIdsRef,
    onDbIdsUpdated: handleDbIdsUpdated,
  });

  // Show user-facing toast when auto-save has consecutive auth errors
  const autoSaveErrorShownRef = useRef(false);
  useEffect(() => {
    if (autoSaveError && autoSaveConsecutiveErrors >= 3 && !autoSaveErrorShownRef.current) {
      autoSaveErrorShownRef.current = true;
      toast.error(
        language === "ko" 
          ? "자동저장에 문제가 발생했습니다. 페이지를 새로고침하거나 다시 로그인해주세요." 
          : "Auto-save is failing. Please refresh the page or re-login.",
        { duration: 10000 }
      );
    }
    // Reset the flag when errors clear
    if (autoSaveConsecutiveErrors === 0) {
      autoSaveErrorShownRef.current = false;
    }
  }, [autoSaveError, autoSaveConsecutiveErrors, language]);

  // Realtime sync - receive changes from other tabs/users
  const { handleSongRealtimeChange, handleComponentRealtimeChange } = useRealtimeHandlers(
    setItems,
    localChangeIdsRef,
    externalAddedIdsRef
  );

  useSetRealtimeSync(id, {
    onSongChange: handleSongRealtimeChange,
    onComponentChange: handleComponentRealtimeChange,
    onSetChange: (payload) => {
      // Refetch set data when the set itself is updated
      queryClient.invalidateQueries({ queryKey: ["service-set", id] });
    },
  });

  // Navigate to new set URL if created via auto-save
  useEffect(() => {
    if (newSetId && !id) {
      navigate(`/set-builder/${newSetId}`, { replace: true });
    }
  }, [newSetId, id, navigate]);

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
  const { data: isCollaborator, isLoading: isCollaboratorLoading } = useQuery({
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
  const { data: isCommunityLeaderForSet, isLoading: isCommunityLeaderLoading } = useQuery({
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
    // Skip if permission check already passed for this set id
    if (permissionCheckedForIdRef.current === id) return;
    
    // Wait for existingSet query to complete loading first
    if (isExistingSetLoading) return;
    
    // Wait for existingSet and user to be available
    if (!existingSet || !user) return;
    
    // Additional safety check - make sure created_by is defined
    if (!existingSet.created_by) {
      console.warn('SetBuilder: existingSet.created_by is undefined, waiting for complete data');
      return;
    }
    
    // Wait for collaborator check to complete (loading OR data not yet available)
    if (id && (isCollaboratorLoading || isCollaborator === undefined)) return;
    
    // Wait for community leader check to complete (only if set has a community)
    if (existingSet.community_id && (isCommunityLeaderLoading || isCommunityLeaderForSet === undefined)) return;
    
    const isCreator = existingSet.created_by === user.id;
    const isPublished = existingSet.status === 'published';
    const hasEditPermission = isCreator || isAdmin || !!isCollaborator || !!isCommunityLeaderForSet;
    
    console.log('SetBuilder permission check:', {
      isCreator,
      createdBy: existingSet.created_by,
      userId: user.id,
      isAdmin,
      isCollaborator,
      isCommunityLeaderForSet,
      hasEditPermission,
    });
    
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
    
    // Permission check passed - mark as checked for this set id
    permissionCheckedForIdRef.current = id;
  }, [existingSet, user, isAdmin, isCollaborator, isCommunityLeaderForSet, isExistingSetLoading, isCollaboratorLoading, isCommunityLeaderLoading, navigate, id]);

  // Collaborator management permission: creator, admin, or community leader can add collaborators
  const isCreator = existingSet?.created_by === user?.id;
  const hasCollaboratorManagePermission = isCreator || isAdmin || !!isCommunityLeaderForSet;

  // Track if form data has been initialized for this set
  const [formDataInitialized, setFormDataInitialized] = useState(false);

  // Load form data from existing set with merge strategy
  // CRITICAL: Once initialized and in edit mode, do NOT overwrite user changes with refetched data
  useEffect(() => {
    if (!existingSet || isExistingSetLoading || isSaving) return;
    
    // If already initialized and user is in edit mode, preserve their changes
    if (formDataInitialized && isEditMode) {
      console.log("[SetBuilder] Skipping formData overwrite - user is editing");
      return;
    }

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
    
    setFormDataInitialized(true);
    
    if (!statusInitialized) {
      // Check if coming from unpublish action via URL parameter
      const unpublishedFromUrl = searchParams.get("unpublished") === "true";
      if (unpublishedFromUrl) {
        setStatus("draft");
        // Clear the URL parameter
        const newParams = new URLSearchParams(searchParams);
        newParams.delete("unpublished");
        setSearchParams(newParams, { replace: true });
      } else {
        setStatus(existingSet.status || "draft");
      }
      setStatusInitialized(true);
    }
  }, [existingSet, isExistingSetLoading, isSaving, statusInitialized, formDataInitialized, isEditMode]);

  // Reset initialization flag when navigating to a DIFFERENT set (not on mount/remount)
  useEffect(() => {
    // Only reset if we're actually navigating to a different set
    // Skip on initial mount (prevIdRef.current will be undefined)
    if (prevIdRef.current !== undefined && prevIdRef.current !== id) {
      setHasInitializedItems(false);
      setItems([]);
      setStatusInitialized(false); // Reset status so it syncs from DB on next load
      setFormDataInitialized(false); // Reset formData initialization for new set
    }
    prevIdRef.current = id;
  }, [id]);

  // Load externally added song IDs from sessionStorage on mount
  useEffect(() => {
    if (!id) return;
    const storedKey = `recentlyAddedSetSongIds:${id}`;
    const stored = sessionStorage.getItem(storedKey);
    if (stored) {
      try {
        const { ids, timestamp } = JSON.parse(stored);
        // Only use if less than 15 seconds old
        if (Date.now() - timestamp < 15000 && Array.isArray(ids)) {
          ids.forEach((songId: string) => {
            externalAddedIdsRef.current.add(songId);
            console.log("[SetBuilder] Loaded externally added song ID from sessionStorage:", songId);
          });
          // Clear after loading
          sessionStorage.removeItem(storedKey);
          // Auto-clear protection after 10 seconds
          setTimeout(() => {
            ids.forEach((songId: string) => externalAddedIdsRef.current.delete(songId));
          }, 10000);
        } else {
          sessionStorage.removeItem(storedKey);
        }
      } catch (e) {
        sessionStorage.removeItem(storedKey);
      }
    }
  }, [id]);

  // Merge and load songs + components by position - ONLY on initial load or after fresh fetch
  useEffect(() => {
    // Skip if currently saving
    if (isSaving) return;
    
    // For existing sets, wait until queries have FINISHED fetching (not just have cached data)
    if (id) {
      // Must have data
      if (existingSetSongs === undefined || existingSetComponents === undefined) return;
      // Must NOT be currently fetching (prevents using stale cache during refetch)
      if (isFetchingSongs || isFetchingComponents) return;
    }
    
    // Check if this is truly fresh data by comparing timestamps
    const latestUpdateAt = Math.max(songsUpdatedAt || 0, componentsUpdatedAt || 0);
    
    // Skip if we've already initialized with this exact data
    if (hasInitializedItems && lastInitializedAtRef.current >= latestUpdateAt) {
      return;
    }
    
    const songs: SetItem[] = (existingSetSongs || []).map((ss: any) => ({
      type: "song" as const,
      id: `song-${ss.id}`,
      dbId: ss.id,
      data: { ...ss, song: ss.songs },
    }));
    
    const components: SetItem[] = (existingSetComponents || []).map((comp: any) => ({
      type: "component" as const,
      id: `component-${comp.id}`,
      dbId: comp.id,
      data: comp,
    }));
    
    // Merge and sort by position
    const merged = [...songs, ...components].sort((a, b) => {
      const posA = a.type === "song" ? a.data.position : a.data.position;
      const posB = b.type === "song" ? b.data.position : b.data.position;
      return posA - posB;
    });
    
    console.log("[SetBuilder] Initializing items from query data, count:", merged.length, "hasInitialized:", hasInitializedItems);
    setItems(merged);
    setHasInitializedItems(true);
    lastInitializedAtRef.current = latestUpdateAt;
  }, [existingSetSongs, existingSetComponents, isSaving, id, hasInitializedItems, isFetchingSongs, isFetchingComponents, songsUpdatedAt, componentsUpdatedAt]);

  // Load template from URL parameter (for "Create Set from Template" feature)
  useEffect(() => {
    const loadTemplateFromUrl = async () => {
      if (!templateIdFromUrl || !user || templateApplied) return;
      
      // Only apply template for new sets (no id)
      if (id) {
        // Clear the templateId from URL if editing existing set
        setSearchParams({});
        return;
      }
      
      try {
        const { data: template, error } = await supabase
          .from("worship_set_templates")
          .select(`
            *,
            template_components(*)
          `)
          .eq("id", templateIdFromUrl)
          .single();
        
        if (error) throw error;
        
        if (template) {
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
            const sortedComponents = [...template.template_components].sort((a: any, b: any) => a.position - b.position);
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
            
            setItems(newItems);
          }
          
          toast.success(language === "ko" ? `템플릿 "${template.name}"이(가) 적용되었습니다` : `Template "${template.name}" applied`);
          setTemplateApplied(true);
          
          // Clear the templateId from URL
          setSearchParams({});
        }
      } catch (error) {
        console.error("Failed to load template:", error);
        toast.error(language === "ko" ? "템플릿을 불러오는데 실패했습니다" : "Failed to load template");
      }
    };
    
    loadTemplateFromUrl();
  }, [templateIdFromUrl, user, id, templateApplied, language, setSearchParams]);
  const handlePublishToggle = () => {
    if (status === "draft") {
      // Validate before publishing
      if (!formData.community_id) {
        toast.error("예배공동체를 선택해주세요");
        return;
      }
      if (!formData.service_time) {
        toast.error("예배 시간을 입력해주세요");
        return;
      }
      if (!formData.worship_leader?.trim()) {
        toast.error("예배 인도자를 입력해주세요");
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
    suppressAutoSaveRef.current = true;
    cancelPendingAutoSave();
    saveSetMutation.mutate("published");
    setShowPublishConfirm(false);
  };

  const saveSetMutation = useMutation({
    mutationFn: async (publishStatus?: "draft" | "published") => {
      // Validate user is logged in
      if (!user?.id) {
        throw new Error("로그인이 필요합니다");
      }

      // Read from refs to ensure we have the latest values
      const currentForm = formDataRef.current;
      const currentItems = itemsRef.current;

      // Permission validation - only check if existingSet AND created_by are both available
      // If created_by is not loaded yet, we skip client-side check and rely on RLS
      if (existingSet && existingSet.created_by) {
        const isCreator = existingSet.created_by === user.id;
        if (!isCreator && !isAdmin && !isCollaborator && !isCommunityLeaderForSet) {
          throw new Error("이 워십세트를 수정할 권한이 없습니다");
        }
      }

      // Validation before save
      if (!currentForm.community_id) {
        throw new Error(t("setBuilder.errors.communityRequired"));
      }
      
      // Validate required fields for publishing
      const songCount = currentItems.filter(i => i.type === "song").length;
      if (publishStatus === "published") {
        if (!currentForm.service_time) {
          throw new Error("예배 시간을 입력해주세요");
        }
        if (!currentForm.worship_leader?.trim()) {
          throw new Error("예배 인도자를 입력해주세요");
        }
        if (songCount === 0) {
          throw new Error(t("setBuilder.errors.noSongsPublish"));
        }
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
        // IMPORTANT: Never include created_by in update payload
        // The DB trigger prevents changes, but we shouldn't even try
        const updateData: any = { ...dataToSave };
        // DO NOT modify created_by - it's immutable and protected by DB trigger

        const { error } = await supabase
          .from("service_sets")
          .update(updateData)
          .eq("id", setId);

        if (error) throw error;
      }

      // Use UPSERT approach instead of DELETE + INSERT to preserve dbIds
      if (setId) {
        const dbIdUpdates = await upsertSongsAndComponents(
          setId, 
          currentItems, 
          localChangeIdsRef,
          externalAddedIdsRef
        );
        
        // Update items with new dbIds
        if (dbIdUpdates.length > 0) {
          handleDbIdsUpdated(dbIdUpdates);
        }

        // === DB Cleanup: Sync DB with current UI state ===
        // 1. Collect IDs that should remain in DB
        const keepSongDbIds = currentItems
          .filter(item => item.type === "song" && item.dbId)
          .map(item => item.dbId as string);
        
        // Include newly inserted song dbIds
        dbIdUpdates
          .filter(u => u.localId.startsWith("song-"))
          .forEach(u => keepSongDbIds.push(u.dbId));
        
        const keepComponentDbIds = currentItems
          .filter(item => item.type === "component" && item.dbId)
          .map(item => item.dbId as string);
        
        // Include newly inserted component dbIds
        dbIdUpdates
          .filter(u => u.localId.startsWith("component-"))
          .forEach(u => keepComponentDbIds.push(u.dbId));

        // 2. Delete orphaned rows (items removed from UI but still in DB)
        if (keepSongDbIds.length > 0) {
          const { error: deleteSongsError } = await supabase
            .from("set_songs")
            .delete()
            .eq("service_set_id", setId)
            .not("id", "in", `(${keepSongDbIds.join(",")})`);
          
          if (deleteSongsError) {
            console.error("[SetBuilder] Failed to cleanup orphaned songs:", deleteSongsError);
          }
        } else {
          // If no songs to keep, delete all songs for this set
          const { error: deleteAllSongsError } = await supabase
            .from("set_songs")
            .delete()
            .eq("service_set_id", setId);
          
          if (deleteAllSongsError) {
            console.error("[SetBuilder] Failed to delete all songs:", deleteAllSongsError);
          }
        }

        if (keepComponentDbIds.length > 0) {
          const { error: deleteComponentsError } = await supabase
            .from("set_components")
            .delete()
            .eq("service_set_id", setId)
            .not("id", "in", `(${keepComponentDbIds.join(",")})`);
          
          if (deleteComponentsError) {
            console.error("[SetBuilder] Failed to cleanup orphaned components:", deleteComponentsError);
          }
        } else {
          // If no components to keep, delete all components for this set
          const { error: deleteAllComponentsError } = await supabase
            .from("set_components")
            .delete()
            .eq("service_set_id", setId);
          
          if (deleteAllComponentsError) {
            console.error("[SetBuilder] Failed to delete all components:", deleteAllComponentsError);
          }
        }

        // 3. Re-confirm positions to eliminate duplicates/gaps
        const allSongDbIds = [...keepSongDbIds];
        const allComponentDbIds = [...keepComponentDbIds];
        
        // Update positions based on current UI order
        for (let i = 0; i < currentItems.length; i++) {
          const item = currentItems[i];
          const position = i + 1;
          const dbId = item.dbId || dbIdUpdates.find(u => u.localId === item.id)?.dbId;
          
          if (!dbId) continue;
          
          if (item.type === "song" && allSongDbIds.includes(dbId)) {
            await supabase.from("set_songs").update({ position }).eq("id", dbId);
          } else if (item.type === "component" && allComponentDbIds.includes(dbId)) {
            await supabase.from("set_components").update({ position }).eq("id", dbId);
          }
        }
      }

      return setId;
    },
    onMutate: () => {
      setIsSaving(true);
    },
    onSuccess: (setId, publishStatus) => {
      const currentForm = formDataRef.current;
      const isNewSet = !id;

      toast.success(t("setBuilder.successSave"));
      
      // Credit K-Seed rewards (fire-and-forget)
      if (user?.id) {
        import("@/lib/rewardsHelper").then(({ creditSetCreatedReward, creditSetPublishedReward }) => {
          // Credit set_created reward for new sets
          if (isNewSet && setId) {
            creditSetCreatedReward(user.id, setId, currentForm.service_name);
          }
          
          // Credit set_published reward when publishing
          if (publishStatus === "published" && setId) {
            creditSetPublishedReward(user.id, setId, currentForm.service_name);
          }
        });
      }
      
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
        // SetBuilder 관련 캐시
        queryClient.invalidateQueries({ queryKey: ["service-set", setId] });
        queryClient.invalidateQueries({ queryKey: ["set-songs", setId] });
        queryClient.invalidateQueries({ queryKey: ["set-components", setId] });
        queryClient.invalidateQueries({ queryKey: ["unified-community-feed"] });
        queryClient.invalidateQueries({ queryKey: ["worship-sets"] });
        
        // 워십세트 목록 캐시 (WorshipSets.tsx에서 사용)
        queryClient.invalidateQueries({ queryKey: ["worship-sets-history"] });
        
        // BandView 관련 캐시
        queryClient.invalidateQueries({ queryKey: ["band-view", setId] });
        queryClient.invalidateQueries({ queryKey: ["band-view-songs", setId] });
        queryClient.invalidateQueries({ queryKey: ["band-view-components", setId] });
        queryClient.invalidateQueries({ queryKey: ["band-view-song-scores", setId] });
        queryClient.invalidateQueries({ queryKey: ["band-view-youtube-links", setId] });
        
        // 대시보드 위젯 캐시
        queryClient.invalidateQueries({ queryKey: ["dashboard-set-songs"] });
        queryClient.invalidateQueries({ queryKey: ["set-songs-preview"] });
        queryClient.invalidateQueries({ queryKey: ["upcoming-sets"] });
      }, 100);
      
      // Navigate based on action type
      if (publishStatus === "published" && setId && !isNewSet) {
        // After publishing an existing set, release lock and go to read-only view
        releaseLock();
        toast.success(language === "ko" ? "게시 완료! 읽기 모드로 이동합니다." : "Published! Navigating to read-only view.");
        navigate(`/band-view/${setId}`);
      } else if (isNewSet) {
        navigate(`/set-builder/${setId}`);
      }
    },
    onError: (error: any) => {
      toast.error("저장 실패: " + error.message);
      // Restore auto-save if publish failed
      suppressAutoSaveRef.current = false;
    },
    onSettled: () => {
      setIsSaving(false);
    },
  });

  // Helper function to check required fields for adding songs/components
  const getMissingRequiredFields = () => {
    const missing: string[] = [];
    if (!formData.date) {
      missing.push(language === "ko" ? "날짜" : "Date");
    }
    if (!formData.service_time) {
      missing.push(language === "ko" ? "시간" : "Service Time");
    }
    if (!formData.service_name?.trim()) {
      missing.push(language === "ko" ? "예배 이름" : "Service Name");
    }
    if (!formData.community_id) {
      missing.push(language === "ko" ? "예배공동체" : "Worship Community");
    }
    if (!formData.worship_leader?.trim()) {
      missing.push(language === "ko" ? "예배 인도자" : "Worship Leader");
    }
    return missing;
  };

  const hasRequiredFields = () => {
    return formData.date && formData.service_time && formData.service_name?.trim() && formData.community_id && formData.worship_leader?.trim();
  };

  // Helper function to navigate to songs - requires required fields
  const handleNavigateToSongs = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Check if required fields are filled
    const missingFields = getMissingRequiredFields();
    if (missingFields.length > 0) {
      toast.error(
        language === "ko" 
          ? "필수 정보를 입력해주세요" 
          : "Please fill in required information",
        { 
          description: language === "ko" 
            ? `다음 항목을 선택해주세요: ${missingFields.join(", ")}` 
            : `Please select: ${missingFields.join(", ")}`
        }
      );
      return;
    }
    
    // Force save if there are unsaved changes before navigating
    if (autoSaveHasChanges) {
      try {
        await forceSave();
      } catch (err) {
        console.error("Failed to save before navigating:", err);
        // Still proceed with navigation even if save fails
      }
    }
    
    // Use id or newSetId for session storage
    const effectiveSetId = id || newSetId;
    if (effectiveSetId) {
      sessionStorage.setItem('currentEditingSetId', effectiveSetId);
      sessionStorage.setItem('currentEditingSetName', formData.service_name || '워십세트');
      // Mark that user was in edit mode for this set
      if (isEditMode) {
        sessionStorage.setItem(`wasEditing:${effectiveSetId}`, 'true');
      }
    }
    navigate('/songs');
  };

  const handleAddSong = (song: any, selectedKey?: string, selectedScoreUrl?: string) => {
    // Block if not in edit mode
    if (!isEditMode) {
      toast.error(language === "ko" ? "편집 모드가 아닙니다. 편집 버튼을 눌러주세요." : "Not in edit mode. Please click the Edit button.");
      return;
    }

    // Show info message for private songs (but allow adding)
    if (song.is_private) {
      toast.info(
        language === "ko" 
          ? "비공개 곡이 추가되었습니다. 이 곡은 내 커뮤니티 멤버에게만 표시됩니다." 
          : "Private song added. This song is only visible to your community members."
      );
    }

    // Check if required fields are filled
    const missingFields = getMissingRequiredFields();
    if (missingFields.length > 0) {
      toast.error(
        language === "ko" 
          ? "필수 정보를 입력해주세요" 
          : "Please fill in required information",
        { 
          description: language === "ko" 
            ? `곡을 추가하려면 다음 항목을 선택해주세요: ${missingFields.join(", ")}` 
            : `To add songs, please select: ${missingFields.join(", ")}`
        }
      );
      return;
    }

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
    
    // Auto-scroll to the newly added item
    setTimeout(() => {
      itemsEndRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  const handleAddComponent = (type: WorshipComponentType, customLabel?: string) => {
    // Block if not in edit mode
    if (!isEditMode) {
      toast.error(language === "ko" ? "편집 모드가 아닙니다. 편집 버튼을 눌러주세요." : "Not in edit mode. Please click the Edit button.");
      return;
    }

    // Check if required fields are filled
    const missingFields = getMissingRequiredFields();
    if (missingFields.length > 0) {
      toast.error(
        language === "ko" 
          ? "필수 정보를 입력해주세요" 
          : "Please fill in required information",
        { 
          description: language === "ko" 
            ? `순서를 추가하려면 다음 항목을 선택해주세요: ${missingFields.join(", ")}` 
            : `To add components, please select: ${missingFields.join(", ")}`
        }
      );
      return;
    }

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
    
    // Auto-scroll to the newly added component
    setTimeout(() => {
      itemsEndRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
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
    if (isBlocked) {
      toast.error(language === "ko" ? "편집이 차단되었습니다." : "Editing is blocked.");
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, updates: any) => {
    if (isBlocked) {
      toast.error(language === "ko" ? "편집이 차단되었습니다." : "Editing is blocked.");
      return;
    }
    setItems(prev => prev.map((item, i) => {
      if (i !== index) return item;
      return { ...item, data: { ...item.data, ...updates } };
    }));
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    if (isBlocked) return;
    setItems(prev => arrayMove(prev, index, index - 1));
  };

  const handleMoveDown = (index: number) => {
    if (index >= items.length - 1) return;
    if (isBlocked) return;
    setItems(prev => arrayMove(prev, index, index + 1));
  };

  // Handle revert complete - reconstruct items with new dbIds from DB
  const handleRevertComplete = useCallback(async (restoredSongs: any[], restoredComponents: any[]) => {
    // Block revert if another tab is editing
    if (isBlocked) {
      toast.error(language === "ko" ? "편집이 차단되었습니다. 히스토리 복원을 할 수 없습니다." : "Editing is blocked. Cannot restore history.");
      return;
    }
    
    // Suppress auto-save while we rebuild items state
    suppressAutoSaveRef.current = true;
    
    try {
      // Fetch full song data for restored songs
      const songIds = restoredSongs.map(s => s.song_id);
      let songsData: any[] = [];
      
      if (songIds.length > 0) {
        const { data } = await supabase
          .from("songs")
          .select("*, song_scores(id, key, file_url, page_number, position)")
          .in("id", songIds);
        songsData = data || [];
      }
      
      const songMap = new Map(songsData.map(s => [s.id, s]));
      
      // Build items array with proper dbIds
      const restoredItems: SetItem[] = [];
      
      // Add songs
      restoredSongs.forEach(ss => {
        const song = songMap.get(ss.song_id);
        restoredItems.push({
          type: "song" as const,
          id: `song-${ss.id}`,
          dbId: ss.id,
          data: {
            ...ss,
            song,
            songs: song,
          },
        });
      });
      
      // Add components
      restoredComponents.forEach(comp => {
        restoredItems.push({
          type: "component" as const,
          id: `component-${comp.id}`,
          dbId: comp.id,
          data: comp,
        });
      });
      
      // Sort by position
      restoredItems.sort((a, b) => (a.data.position || 0) - (b.data.position || 0));
      
      // Mark all new IDs as local changes to prevent realtime handler from processing them
      restoredSongs.forEach(s => localChangeIdsRef.current.add(s.id));
      restoredComponents.forEach(c => localChangeIdsRef.current.add(c.id));
      
      // Reset initialization flag to allow proper state update
      setHasInitializedItems(false);
      
      // Update items state
      setItems(restoredItems);
      
      // Re-enable initialization after state update
      setTimeout(() => {
        setHasInitializedItems(true);
        suppressAutoSaveRef.current = false;
      }, 100);
      
    } catch (error) {
      console.error('Error rebuilding items after revert:', error);
      suppressAutoSaveRef.current = false;
      // Fallback: refetch queries
      queryClient.invalidateQueries({ queryKey: ["set-songs", id] });
      queryClient.invalidateQueries({ queryKey: ["set-components", id] });
    }
  }, [id, queryClient, isBlocked, language]);

  const handleLogout = async () => {
    await signOut();
    toast.success(t("dashboard.logout"));
    navigate("/login");
  };

  const handleDragEnd = (event: any) => {
    if (isBlocked) return; // Block drag operations
    
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

  // Reusable Action Buttons Component - 저장, 삭제, 게시하기, 링크공유 순서 (우측 정렬)
  const renderActionButtons = (className?: string) => (
    <div className={`flex items-center justify-end gap-2 ${className || 'mb-4'}`}>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              variant="outline" 
              size="sm"
              className="h-8 gap-1 px-2 sm:px-3"
              onClick={() => saveSetMutation.mutate(undefined)}
              disabled={saveSetMutation.isPending || isBlocked}
            >
              <Save className="w-4 h-4 shrink-0" />
              <span className="text-xs sm:text-sm">{saveSetMutation.isPending ? t("common.saving") : t("common.save")}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <p>{t("tooltips.setBuilder.save")}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {id && (
        <Button 
          variant="destructive" 
          size="sm" 
          className="h-8 gap-1 px-2 sm:px-3" 
          onClick={() => setShowDeleteConfirm(true)}
          disabled={isSetOwnerLoading || !canDelete || deleteSetMutation.isPending || isBlocked}
        >
          <Trash2 className="w-4 h-4 shrink-0" />
          <span className="text-xs sm:text-sm">{language === "ko" ? "삭제" : "Delete"}</span>
        </Button>
      )}
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size="sm" 
              className="h-8 gap-1 px-2 sm:px-3"
              onClick={handlePublishToggle}
              disabled={saveSetMutation.isPending || isBlocked}
            >
            {status === "draft" ? (
              <>
                <Upload className="w-4 h-4 shrink-0" />
                <span className="text-xs sm:text-sm">{t("setBuilder.publish")}</span>
              </>
            ) : (
              <>
                <XCircle className="w-4 h-4 shrink-0" />
                <span className="text-xs sm:text-sm">{t("setBuilder.unpublish")}</span>
              </>
              )}
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

      {id && (
        <>
          <Button 
            variant="outline" 
            size="sm" 
            className="h-8 gap-1 px-2 sm:px-3" 
            onClick={() => window.open(`/band-view/${id}?preview=true`, '_blank')}
          >
            <Eye className="w-4 h-4 shrink-0" />
            <span className="text-xs sm:text-sm">{language === "ko" ? "미리보기" : "Preview"}</span>
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1 px-2 sm:px-3" onClick={handleCopyLink}>
            <Share2 className="w-4 h-4 shrink-0" />
            <span className="text-xs sm:text-sm">{t("setBuilder.shareLink")}</span>
          </Button>
        </>
      )}
    </div>
  );

  if (isExistingSetLoading) {
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

  // Dynamic page title for browser tab
  const pageTitle = id && existingSet
    ? (language === "ko" 
        ? `${formData.service_name || existingSet.service_name || "워십세트"} 편집`
        : `Edit ${formData.service_name || existingSet.service_name || "Worship Set"}`)
    : (language === "ko" ? "새 워십세트" : "New Worship Set");

  return (
    <>
    <SEOHead 
      title={pageTitle}
      titleKo={id ? `${formData.service_name || "워십세트"} 편집` : "새 워십세트"}
      description={language === "ko" ? "워십세트 편집" : "Edit worship set"}
      descriptionKo="워십세트 편집"
      noIndex={true}
    />
    <AppLayout>
      <div className="container mx-auto px-4 py-6">
        {/* Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/worship-sets")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            뒤로
          </Button>
          
          <div className="flex items-center gap-3">
            {/* Collaborators Header */}
            <CollaboratorsHeader
              serviceSetId={id || newSetId || null}
              canManage={hasCollaboratorManagePermission}
            />

            {/* Separator when there are collaborators */}
            <div className="hidden sm:block h-5 w-px bg-border" />

            {/* Auto-save status indicator */}
            {status === "draft" && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-help">
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
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    {language === "ko" ? "변경사항이 자동으로 저장됩니다" : "Changes are auto-saved"}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  {status === "draft" ? (
                    <Badge variant="outline" className="cursor-help">
                      <Lock className="w-3 h-3 mr-1" />
                      임시저장
                    </Badge>
                  ) : (
                    <Badge className="cursor-help">
                      <Check className="w-3 h-3 mr-1" />
                      게시됨
                    </Badge>
                  )}
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {status === "draft" 
                    ? (language === "ko" ? "임시저장: 본인만 볼 수 있습니다" : "Draft: only you can see this")
                    : (language === "ko" ? "게시됨: 커뮤니티 멤버가 볼 수 있습니다" : "Published: community members can view")}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        {/* Action Buttons Component */}
        {renderActionButtons()}

        {/* Smart Edit Mode Banner */}
        {showWelcomeMessage && isEditMode && (
          <Alert className="mb-4 bg-primary/10 border-primary/20">
            <Edit2 className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                {language === "ko" 
                  ? "✨ 편집 모드입니다. 변경사항은 자동 저장됩니다. 다른 탭에서 이 세트를 열면 현재 세션이 자동으로 저장되고 종료됩니다."
                  : "✨ You're in edit mode. Changes auto-save. Opening this set in another tab will save and close this session."}
              </span>
              <Button variant="ghost" size="sm" onClick={dismissWelcomeMessage}>
                {language === "ko" ? "확인" : "Got it"}
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Inactivity Warning */}
        {inactivityWarning && sessionTimeRemaining && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {language === "ko" 
                ? `비활성 상태입니다. ${sessionTimeRemaining}초 후 세션이 종료됩니다. 계속하려면 아무 곳이나 클릭하세요.`
                : `Inactive. Session ends in ${sessionTimeRemaining}s. Click anywhere to continue.`}
            </AlertDescription>
          </Alert>
        )}

        {/* Takeover Request Received - I'm the editor */}
        {isTakeoverRequested && takeoverRequester && isEditMode && (
          <Alert className="mb-4 bg-orange-500/10 border-orange-500/30">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex-1">
                <span className="font-medium">
                  {language === "ko" 
                    ? `⚠️ ${takeoverRequester.name}님이 편집을 요청했습니다`
                    : `⚠️ ${takeoverRequester.name} wants to edit`}
                </span>
                {takeoverResponseCountdown && (
                  <div className="mt-1">
                    <span className="text-sm text-muted-foreground">
                      {language === "ko" 
                        ? `${takeoverResponseCountdown}초 후 자동으로 넘겨집니다...`
                        : `Auto-handover in ${takeoverResponseCountdown}s...`}
                    </span>
                    <div className="w-full bg-muted h-1.5 rounded-full mt-1 overflow-hidden">
                      <div 
                        className="bg-orange-500 h-full transition-all duration-1000 ease-linear"
                        style={{ width: `${(takeoverResponseCountdown / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => respondToTakeover(false)}
                >
                  {language === "ko" ? "계속 편집" : "Keep Editing"}
                </Button>
                <Button 
                  variant="default" 
                  size="sm" 
                  onClick={() => respondToTakeover(true)}
                >
                  {language === "ko" ? "넘겨주기" : "Hand Over"}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Read-only mode banner for non-owners (friendly version) */}
        {isReadOnlyMode && !isEditMode && !isBlocked && (
          <Alert className="mb-4 border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30">
            <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex-1 space-y-1">
                <div className="font-medium text-blue-800 dark:text-blue-200">
                  {language === "ko" ? "👀 읽기 모드" : "👀 Read-Only Mode"}
                </div>
                <div className="text-sm text-muted-foreground">
                  {language === "ko" 
                    ? "수정하려면 편집 버튼을 눌러주세요"
                    : "Click Edit to make changes"}
                </div>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate(`/band-view/${id}`)}
                >
                  {language === "ko" ? "Band View" : "Band View"}
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleRequestEdit}
                  disabled={isAcquiring}
                >
                  <Edit2 className="w-4 h-4 mr-2" />
                  {isAcquiring 
                    ? (language === "ko" ? "처리 중..." : "Processing...")
                    : (language === "ko" ? "편집하기" : "Edit")}
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Read-only mode when someone else is editing (blocked) - friendlier version */}
        {isBlocked && lockHolder && (
          <Alert className="mb-4 border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/30">
            <BookOpen className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <AlertDescription className="flex flex-col gap-2">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div className="flex-1 space-y-1">
                  <div className="font-medium text-blue-800 dark:text-blue-200">
                    {language === "ko" 
                      ? `👀 읽기 모드로 열람 중`
                      : `👀 Viewing in Read-Only Mode`}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {language === "ko" 
                      ? `현재 ${lockHolder.name}님이 이 세트를 편집하고 있어요.`
                      : `${lockHolder.name} is currently editing this set.`}
                  </div>
                  {isRequestingTakeover && takeoverCountdown !== null && (
                    <div className="mt-2">
                      <span className="text-sm font-medium">
                        {takeoverCountdown > 0 
                          ? (language === "ko" ? `편집 요청 중... ${takeoverCountdown}초 후 강제 가져오기` : `Requesting... force takeover in ${takeoverCountdown}s`)
                          : (language === "ko" ? "권한 가져오는 중..." : "Taking over...")}
                      </span>
                      <div className="w-full bg-muted h-1.5 rounded-full mt-1 overflow-hidden">
                      <div 
                        className="bg-primary h-full transition-all duration-1000 ease-linear"
                        style={{ width: `${(takeoverCountdown / 5) * 100}%` }}
                      />
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate(`/band-view/${id}`)}
                  >
                    {language === "ko" ? "Band View" : "Band View"}
                  </Button>
                  {isRequestingTakeover ? (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={cancelTakeoverRequest}
                    >
                      {language === "ko" ? "요청 취소" : "Cancel"}
                    </Button>
                  ) : (
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={handleRequestEdit}
                      disabled={isAcquiring}
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      {isAcquiring 
                        ? (language === "ko" ? "처리 중..." : "Processing...") 
                        : (language === "ko" ? "편집 요청" : "Request Edit")}
                    </Button>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Edit Request Confirmation Dialog */}
        <AlertDialog open={showEditRequestDialog} onOpenChange={setShowEditRequestDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {language === "ko" ? "편집 요청" : "Request Edit"}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {lockHolder 
                  ? (language === "ko" 
                      ? `현재 ${lockHolder.name}님이 이 세트를 편집하고 있습니다. 편집을 요청하시겠습니까? 상대방이 응답하지 않으면 10초 후 자동으로 편집 권한을 가져옵니다.`
                      : `${lockHolder.name} is currently editing this set. Would you like to request edit access? If they don't respond, you'll automatically take over in 10 seconds.`)
                  : (language === "ko"
                      ? "편집 권한을 요청하시겠습니까?"
                      : "Would you like to request edit access?")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {language === "ko" ? "취소" : "Cancel"}
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleConfirmEditRequest}>
                {language === "ko" ? "편집 요청" : "Request Edit"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Column - Worship Info */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="shadow-md">
              <CardHeader className="pb-3">
                <div className="space-y-2">
                  <CardTitle>예배 정보</CardTitle>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-7 gap-1 px-2 text-xs"
                      onClick={() => navigate("/templates")}
                    >
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      <span>템플릿 불러오기</span>
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-7 gap-1 px-2 text-xs"
                      onClick={() => setShowSaveTemplate(true)}
                    >
                      <Copy className="w-3.5 h-3.5 shrink-0" />
                      <span>템플릿으로 만들기</span>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5 min-w-0">
                    <Label htmlFor="date" className="text-sm text-destructive">날짜 *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                      className="text-sm pr-10"
                      disabled={isBlocked}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium text-muted-foreground">
                      {language === 'ko' ? '시간' : 'Time'} *
                    </Label>
                    <Input
                      type="time"
                      value={formData.service_time}
                      onChange={(e) => setFormData({ ...formData, service_time: e.target.value })}
                      className="text-sm pr-10"
                      required
                      disabled={isBlocked}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service_name" className="text-destructive">예배 이름 *</Label>
                  <Input
                    id="service_name"
                    value={formData.service_name}
                    onChange={(e) => setFormData({ ...formData, service_name: e.target.value })}
                    placeholder="예: 주일 2부 예배"
                    required
                    disabled={isBlocked}
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
                    <SelectTrigger id="community_id" disabled={isBlocked}>
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
                  {/* Warning when required fields not filled - auto-save disabled */}
                  {userCommunities && userCommunities.length > 0 && (!formData.date || !formData.service_time || !formData.service_name?.trim() || !formData.community_id || !formData.worship_leader?.trim()) && (
                    <Alert className="mt-2 border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30">
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                      <AlertDescription className="text-sm text-amber-800 dark:text-amber-200">
                        {language === "ko" 
                          ? "날짜, 시간, 예배 이름, 예배공동체, 예배 인도자를 모두 입력하면 자동 저장되고 곡/순서를 추가할 수 있습니다." 
                          : "Fill in date, time, service name, community, and worship leader to enable auto-save and add songs/components."}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="target_audience">{t("setBuilder.targetAudience")}</Label>
                  <Select value={formData.target_audience} onValueChange={(value) => setFormData({ ...formData, target_audience: value })}>
                    <SelectTrigger disabled={isBlocked}>
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
                  <Label htmlFor="worship_leader" className="text-destructive">예배 인도자 *</Label>
                  <Input
                    id="worship_leader"
                    value={formData.worship_leader}
                    onChange={(e) => setFormData({ ...formData, worship_leader: e.target.value })}
                    required
                    disabled={isBlocked}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="band_name">팀/밴드 이름</Label>
                  <Input
                    id="band_name"
                    value={formData.band_name}
                    onChange={(e) => setFormData({ ...formData, band_name: e.target.value })}
                    disabled={isBlocked}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scripture_reference">{t("setBuilder.scriptureReference")}</Label>
                  <Input
                    id="scripture_reference"
                    value={formData.scripture_reference}
                    onChange={(e) => setFormData({ ...formData, scripture_reference: e.target.value })}
                    placeholder="예: 시편 23편, 요한복음 3:16"
                    disabled={isBlocked}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="theme">{t("setBuilder.themeSermonTitle")}</Label>
                  <Input
                    id="theme"
                    value={formData.theme}
                    onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
                    disabled={isBlocked}
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
                    disabled={isBlocked}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">메모</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows={3}
                    disabled={isBlocked}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Save & Delete buttons */}
            <div className="flex gap-2">
              <Button
                onClick={() => saveSetMutation.mutate(undefined)}
                disabled={saveSetMutation.isPending || isBlocked}
                className="flex-1 gap-1.5"
              >
                <Save className="w-4 h-4" />
                {saveSetMutation.isPending ? t("common.saving") : t("common.save")}
              </Button>
              {id && (
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteConfirm(true)}
                  disabled={isSetOwnerLoading || !canDelete || deleteSetMutation.isPending || isBlocked}
                  className="gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  {language === "ko" ? "삭제" : "Delete"}
                </Button>
              )}
            </div>

            {/* Worship Components Palette - Desktop only */}
            <div className="hidden lg:block">
              <WorshipComponentPalette onAddComponent={handleAddComponent} disabled={isBlocked} />
            </div>

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
              <Tabs defaultValue="order" className="w-full">
                <CardHeader className="pb-0">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    {/* Row 1: Tabs - left aligned */}
                    <TabsList className="grid w-auto grid-cols-2">
                      <TabsTrigger value="order" className="gap-2">
                        <Music className="h-4 w-4" />
                        {language === "ko" ? "예배 순서" : "Worship Order"}
                      </TabsTrigger>
                      <TabsTrigger value="history" className="gap-2">
                        <History className="h-4 w-4" />
                        {language === "ko" ? "히스토리" : "History"}
                      </TabsTrigger>
                    </TabsList>
                    {/* Row 2: Buttons - right aligned */}
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        type="button"
                        onClick={handleNavigateToSongs}
                        size="sm"
                        disabled={isBlocked}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        곡 추가
                      </Button>
                      {/* AI Set Builder button - visible to all, upgrade prompt for non-eligible */}
                      <Button
                        type="button"
                        onClick={() => {
                          if (hasFeature('ai_set_builder')) {
                            const missingFields = getMissingRequiredFields();
                            if (missingFields.length > 0) {
                              toast.error(
                                language === "ko" 
                                  ? "필수 정보를 입력해주세요" 
                                  : "Please fill in required information",
                                { 
                                  description: language === "ko" 
                                    ? `다음 항목을 선택해주세요: ${missingFields.join(", ")}` 
                                    : `Please select: ${missingFields.join(", ")}`
                                }
                              );
                              return;
                            }
                            setShowAIPanel(true);
                          } else {
                            navigate('/membership');
                          }
                        }}
                        size="sm"
                        variant="outline"
                        disabled={isBlocked}
                        className={!hasFeature('ai_set_builder') ? "relative" : ""}
                      >
                        {!hasFeature('ai_set_builder') && <Lock className="w-3 h-3 mr-1" />}
                        <Sparkles className="w-4 h-4 mr-1" />
                        AI 세트
                        {!hasFeature('ai_set_builder') && (
                          <Badge variant="secondary" className="ml-1 text-[10px] px-1 py-0 h-4">PRO</Badge>
                        )}
                      </Button>
                      {/* Mobile only - add component button */}
                      <Button 
                        onClick={() => handleAddComponent("welcome")} 
                        size="sm" 
                        variant="outline"
                        className="lg:hidden"
                        disabled={isBlocked}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        순서 추가
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <TabsContent value="order" className="mt-0">
                  <CardContent className="pt-4">
                {items.length === 0 ? (
                  <div className="text-center py-12">
                    <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">
                      {language === "ko" 
                        ? "아직 순서가 추가되지 않았습니다" 
                        : "No items added yet"}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <Button
                        type="button"
                        onClick={handleNavigateToSongs}
                        disabled={isBlocked}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        {language === "ko" ? "첫 번째 곡 추가하기" : "Add First Song"}
                      </Button>
                      <Button variant="outline" onClick={() => handleAddComponent("welcome")} disabled={isBlocked}>
                        <Plus className="w-4 h-4 mr-2" />
                        {language === "ko" ? "순서 추가하기" : "Add Component"}
                      </Button>
        </div>
                      {/* Locked feature banner for non-eligible users */}
                      {!hasFeature('ai_set_builder') && (
                        <div className="mt-4">
                          <LockedFeatureBanner
                            feature="ai_set_builder"
                            message={language === "ko" ? "AI 세트 만들기" : "AI Set Builder"}
                            compact
                          />
                        </div>
                      )}
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
                                dbId={item.dbId}
                                status={status}
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
                          {/* Scroll target for auto-scroll after adding items */}
                          <div ref={itemsEndRef} />
                        </div>
                      </SortableContext>
                    </DndContext>

                    {/* Mobile add buttons */}
                    <div className="flex gap-2 mt-4 lg:hidden">
                      <Button
                        type="button"
                        onClick={handleNavigateToSongs}
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        disabled={isBlocked}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        곡 추가
                      </Button>
                      <Button 
                        onClick={() => handleAddComponent("welcome")} 
                        size="sm" 
                        variant="outline" 
                        className="flex-1"
                        disabled={isBlocked}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        순서 추가
                      </Button>
                    </div>

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
                      {items.length > 0 && (
                        <ol className="mt-2 space-y-0.5 text-sm text-muted-foreground list-decimal list-inside">
                          {items.map((item, idx) => {
                            if (item.type === "song") {
                              const title = item.data.song?.title || item.data.title || "?";
                              const playKey = item.data.key || item.data.song?.default_key;
                              const keyChangeTo = item.data.key_change_to;
                              const keyDisplay = keyChangeTo && playKey
                                ? `${playKey} → ${keyChangeTo}`
                                : playKey || "";
                              return (
                                <li key={idx}>
                                  {title}{keyDisplay ? ` (${keyDisplay})` : ""}
                                </li>
                              );
                            }
                            const label = item.data.label || item.data.component_type || "순서";
                            return <li key={idx} className="text-muted-foreground/70">{label}</li>;
                          })}
                        </ol>
                      )}
                      {songCount > 0 && (
                        <p className="text-sm text-muted-foreground mt-2">
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
                </TabsContent>
                
                <TabsContent value="history" className="mt-0">
                  <CardContent className="pt-4">
                    <SetHistoryTab setId={id} onRevertComplete={handleRevertComplete} />
                  </CardContent>
                </TabsContent>
              </Tabs>
            </Card>

            {/* Bottom Action Buttons */}
            {renderActionButtons("mt-6 pt-6 border-t mb-8")}

          </div>
        </div>
      </div>

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

      <AISetBuilderPanel
        open={showAIPanel}
        onOpenChange={setShowAIPanel}
        communityId={formData.community_id || undefined}
        initialTheme={[formData.theme, formData.scripture_reference].filter(Boolean).join(", ")}
        initialDuration={formData.worship_duration ? parseInt(formData.worship_duration) : undefined}
        onAddSongs={async (songs) => {
          if (!isEditMode) {
            const acquired = await acquireLock();
            if (!acquired) {
              toast.error(language === "ko" ? "편집 모드를 시작할 수 없습니다." : "Could not enter edit mode.");
              return;
            }
          }
          songs.forEach(({ song, key }) => {
            handleAddSong(song, key);
          });
        }}
      />
    </AppLayout>
    </>
  );
};

export default SetBuilder;

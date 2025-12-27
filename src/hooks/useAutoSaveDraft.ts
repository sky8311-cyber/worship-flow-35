import { useEffect, useRef, useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface FormData {
  date: string;
  service_time: string;
  service_name: string;
  community_id: string;
  target_audience: string;
  worship_leader: string;
  band_name: string;
  scripture_reference: string;
  theme: string;
  worship_duration: string;
  notes: string;
}

interface SetItem {
  type: "song" | "component";
  data: any;
  id: string;
  dbId?: string; // Database ID for tracking existing records
}

// Callback type for updating dbIds after INSERT
export interface DbIdUpdate {
  localId: string; // The local item.id (e.g., "song-uuid" or "component-uuid")
  dbId: string;    // The database ID after INSERT
}

interface UseAutoSaveDraftOptions {
  id: string | undefined;
  formData: FormData;
  items: SetItem[];
  status: "draft" | "published";
  enabled?: boolean;
  isDataLoaded?: boolean;
  localChangeIdsRef?: React.MutableRefObject<Set<string>>; // For realtime sync
  onDbIdsUpdated?: (updates: DbIdUpdate[]) => void; // Callback when new dbIds are assigned
}

const LAST_EDITED_DRAFT_KEY = "lastEditedDraftId";
const AUTO_SAVE_DELAY = 2000;

export const useAutoSaveDraft = ({
  id,
  formData,
  items,
  status,
  enabled = true,
  isDataLoaded = true,
  localChangeIdsRef,
  onDbIdsUpdated,
}: UseAutoSaveDraftOptions) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  
  const formDataRef = useRef(formData);
  const itemsRef = useRef(items);
  const initialLoadRef = useRef(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // UPSERT-based auto-save mutation
  const autoSaveMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) {
        console.log('AutoSave: Skipping - no user id');
        return null;
      }

      const currentForm = formDataRef.current;
      const currentItems = itemsRef.current;

      if (status !== "draft") return null;
      if (!currentForm.community_id) return null;

      // Safety check: If editing existing set with empty items, check DB first
      if (id && currentItems.length === 0) {
        // Check if DB actually has songs/components before skipping
        const [{ data: dbSongs }, { data: dbComponents }] = await Promise.all([
          supabase.from("set_songs").select("id").eq("service_set_id", id).limit(1),
          supabase.from("set_components").select("id").eq("service_set_id", id).limit(1),
        ]);
        
        const dbHasItems = (dbSongs && dbSongs.length > 0) || (dbComponents && dbComponents.length > 0);
        
        if (dbHasItems) {
          console.log('AutoSave: Skipping - DB has items but local is empty, preventing data loss');
          return null;
        }
        console.log('AutoSave: Skipping - editing existing set with empty items');
        return null;
      }

      let setId = id;

      const dataToSave = {
        date: currentForm.date,
        service_name: currentForm.service_name || "새 워십세트",
        community_id: currentForm.community_id,
        service_time: currentForm.service_time || null,
        target_audience: currentForm.target_audience || null,
        worship_leader: currentForm.worship_leader || null,
        band_name: currentForm.band_name || null,
        scripture_reference: currentForm.scripture_reference || null,
        theme: currentForm.theme || null,
        worship_duration: currentForm.worship_duration ? parseInt(currentForm.worship_duration, 10) : null,
        notes: currentForm.notes || null,
        status: "draft" as const,
      };

      if (!setId) {
        // Create new draft
        const { data, error } = await supabase
          .from("service_sets")
          .insert([{ ...dataToSave, created_by: user?.id }])
          .select()
          .single();

        if (error) throw error;
        setId = data.id;
      } else {
        // Update existing draft
        const { error } = await supabase
          .from("service_sets")
          .update(dataToSave)
          .eq("id", setId);

        if (error) throw error;
      }

      // UPSERT songs and components instead of DELETE + INSERT
      if (setId) {
        const dbIdUpdates = await upsertSongsAndComponents(setId, currentItems, localChangeIdsRef);
        // Call the callback with newly assigned dbIds
        if (dbIdUpdates.length > 0 && onDbIdsUpdated) {
          onDbIdsUpdated(dbIdUpdates);
        }
      }

      return setId;
    },
    onMutate: () => {
      setIsSaving(true);
    },
    onSuccess: (setId) => {
      if (setId) {
        setHasUnsavedChanges(false);
        setLastSavedAt(new Date());
        localStorage.setItem(LAST_EDITED_DRAFT_KEY, setId);
        queryClient.invalidateQueries({ queryKey: ["user-draft-count"] });
      }
    },
    onSettled: () => {
      setIsSaving(false);
    },
  });

  const triggerAutoSave = useCallback(() => {
    if (!enabled || status !== "draft") return;
    
    if (!isDataLoaded) {
      console.log('AutoSave: Skipping trigger - data not loaded yet');
      return;
    }
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      if (formDataRef.current.community_id) {
        autoSaveMutation.mutate();
      }
    }, AUTO_SAVE_DELAY);
  }, [enabled, status, isDataLoaded, autoSaveMutation]);

  useEffect(() => {
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }

    if (status !== "draft" || !enabled) return;

    setHasUnsavedChanges(true);
    triggerAutoSave();
  }, [formData, items, status, enabled, triggerAutoSave]);

  useEffect(() => {
    if (id && status === "draft") {
      localStorage.setItem(LAST_EDITED_DRAFT_KEY, id);
    }
  }, [id, status]);

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (status === "published" && id) {
      const lastEditedId = localStorage.getItem(LAST_EDITED_DRAFT_KEY);
      if (lastEditedId === id) {
        localStorage.removeItem(LAST_EDITED_DRAFT_KEY);
      }
    }
  }, [status, id]);

  const forceSave = useCallback(async () => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    if (hasUnsavedChanges && formDataRef.current.community_id && status === "draft") {
      await autoSaveMutation.mutateAsync();
    }
  }, [hasUnsavedChanges, status, autoSaveMutation]);

  return {
    hasUnsavedChanges,
    isSaving,
    lastSavedAt,
    forceSave,
    newSetId: autoSaveMutation.data,
  };
};

// UPSERT helper function - Updates existing, inserts new, deletes removed
// Returns array of DbIdUpdate for newly inserted items
async function upsertSongsAndComponents(
  setId: string,
  items: SetItem[],
  localChangeIdsRef?: React.MutableRefObject<Set<string>>
): Promise<DbIdUpdate[]> {
  const dbIdUpdates: DbIdUpdate[] = [];

  // 1. Fetch current songs and components from DB
  const [{ data: currentSongs }, { data: currentComponents }] = await Promise.all([
    supabase.from("set_songs").select("id").eq("service_set_id", setId),
    supabase.from("set_components").select("id").eq("service_set_id", setId),
  ]);

  const currentSongIds = new Set((currentSongs || []).map(s => s.id));
  const currentComponentIds = new Set((currentComponents || []).map(c => c.id));

  // 2. Categorize items - track local IDs for new items
  const songsToUpdate: any[] = [];
  const songsToInsert: { localId: string; data: any }[] = [];
  const componentsToUpdate: any[] = [];
  const componentsToInsert: { localId: string; data: any }[] = [];
  const localSongDbIds = new Set<string>();
  const localComponentDbIds = new Set<string>();

  items.forEach((item, index) => {
    const position = index + 1;

    if (item.type === "song") {
      const songData = {
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
      };

      if (item.dbId) {
        // Existing song - update
        songsToUpdate.push({ id: item.dbId, ...songData });
        localSongDbIds.add(item.dbId);
        localChangeIdsRef?.current.add(item.dbId);
      } else {
        // New song - insert (track localId for callback)
        songsToInsert.push({ localId: item.id, data: songData });
      }
    } else {
      const componentData = {
        service_set_id: setId,
        position,
        component_type: item.data.component_type,
        label: item.data.label,
        notes: item.data.notes || null,
        duration_minutes: item.data.duration_minutes || null,
        assigned_to: item.data.assigned_to || null,
        content: item.data.content || null,
      };

      if (item.dbId) {
        // Existing component - update
        componentsToUpdate.push({ id: item.dbId, ...componentData });
        localComponentDbIds.add(item.dbId);
        localChangeIdsRef?.current.add(item.dbId);
      } else {
        // New component - insert (track localId for callback)
        componentsToInsert.push({ localId: item.id, data: componentData });
      }
    }
  });

  // 3. Delete songs/components that are no longer in the local list
  const songIdsToDelete = [...currentSongIds].filter(id => !localSongDbIds.has(id));
  const componentIdsToDelete = [...currentComponentIds].filter(id => !localComponentDbIds.has(id));

  // Mark deleted items for realtime skip
  songIdsToDelete.forEach(id => localChangeIdsRef?.current.add(id));
  componentIdsToDelete.forEach(id => localChangeIdsRef?.current.add(id));

  // 4. Execute deletions
  if (songIdsToDelete.length > 0) {
    await supabase.from("set_songs").delete().in("id", songIdsToDelete);
  }
  if (componentIdsToDelete.length > 0) {
    await supabase.from("set_components").delete().in("id", componentIdsToDelete);
  }

  // 5. Update existing songs
  for (const song of songsToUpdate) {
    const { id, ...updateData } = song;
    await supabase.from("set_songs").update(updateData).eq("id", id);
  }
  
  // 6. Insert new songs and collect dbIds
  if (songsToInsert.length > 0) {
    const insertData = songsToInsert.map(s => s.data);
    const { data } = await supabase.from("set_songs").insert(insertData).select("id");
    if (data) {
      data.forEach((row, idx) => {
        localChangeIdsRef?.current.add(row.id);
        // Map localId to new dbId
        dbIdUpdates.push({
          localId: songsToInsert[idx].localId,
          dbId: row.id,
        });
      });
    }
  }

  // 7. Update existing components
  for (const comp of componentsToUpdate) {
    const { id, ...updateData } = comp;
    await supabase.from("set_components").update(updateData).eq("id", id);
  }
  
  // 8. Insert new components and collect dbIds
  if (componentsToInsert.length > 0) {
    const insertData = componentsToInsert.map(c => c.data);
    const { data } = await supabase.from("set_components").insert(insertData).select("id");
    if (data) {
      data.forEach((row, idx) => {
        localChangeIdsRef?.current.add(row.id);
        // Map localId to new dbId
        dbIdUpdates.push({
          localId: componentsToInsert[idx].localId,
          dbId: row.id,
        });
      });
    }
  }

  return dbIdUpdates;
}

export const getLastEditedDraftId = () => {
  return localStorage.getItem(LAST_EDITED_DRAFT_KEY);
};

export const clearLastEditedDraft = () => {
  localStorage.removeItem(LAST_EDITED_DRAFT_KEY);
};

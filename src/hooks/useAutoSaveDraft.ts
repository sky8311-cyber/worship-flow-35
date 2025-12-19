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
}

interface UseAutoSaveDraftOptions {
  id: string | undefined;
  formData: FormData;
  items: SetItem[];
  status: "draft" | "published";
  enabled?: boolean;
}

const LAST_EDITED_DRAFT_KEY = "lastEditedDraftId";
const AUTO_SAVE_DELAY = 2000; // 2 seconds

export const useAutoSaveDraft = ({
  id,
  formData,
  items,
  status,
  enabled = true,
}: UseAutoSaveDraftOptions) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  
  // Refs to track changes
  const formDataRef = useRef(formData);
  const itemsRef = useRef(items);
  const initialLoadRef = useRef(true);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Keep refs in sync
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Auto-save mutation
  const autoSaveMutation = useMutation({
    mutationFn: async () => {
      // Validate user is logged in with valid UUID
      if (!user?.id) {
        console.log('AutoSave: Skipping - no user id');
        return null;
      }

      const currentForm = formDataRef.current;
      const currentItems = itemsRef.current;

      // Only save drafts, not published sets
      if (status !== "draft") return null;
      
      // Must have community_id to save
      if (!currentForm.community_id) return null;

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

      // Save songs and components
      if (setId) {
        await supabase.from("set_songs").delete().eq("service_set_id", setId);
        await supabase.from("set_components").delete().eq("service_set_id", setId);

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

        if (songsData.length > 0) {
          await supabase.from("set_songs").insert(songsData);
        }
        if (componentsData.length > 0) {
          await supabase.from("set_components").insert(componentsData);
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
        
        // Store last edited draft ID
        localStorage.setItem(LAST_EDITED_DRAFT_KEY, setId);
        
        // Invalidate draft count query
        queryClient.invalidateQueries({ queryKey: ["user-draft-count"] });
      }
    },
    onSettled: () => {
      setIsSaving(false);
    },
  });

  // Debounced auto-save trigger
  const triggerAutoSave = useCallback(() => {
    if (!enabled || status !== "draft") return;
    
    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set new timeout
    saveTimeoutRef.current = setTimeout(() => {
      if (formDataRef.current.community_id) {
        autoSaveMutation.mutate();
      }
    }, AUTO_SAVE_DELAY);
  }, [enabled, status, autoSaveMutation]);

  // Track changes to formData and items
  useEffect(() => {
    // Skip initial load
    if (initialLoadRef.current) {
      initialLoadRef.current = false;
      return;
    }

    // Only track changes for draft sets
    if (status !== "draft" || !enabled) return;

    setHasUnsavedChanges(true);
    triggerAutoSave();
  }, [formData, items, status, enabled, triggerAutoSave]);

  // Store last edited draft ID when editing existing set
  useEffect(() => {
    if (id && status === "draft") {
      localStorage.setItem(LAST_EDITED_DRAFT_KEY, id);
    }
  }, [id, status]);

  // Cleanup on unmount - save any pending changes
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Clear last edited draft when set is published
  useEffect(() => {
    if (status === "published" && id) {
      const lastEditedId = localStorage.getItem(LAST_EDITED_DRAFT_KEY);
      if (lastEditedId === id) {
        localStorage.removeItem(LAST_EDITED_DRAFT_KEY);
      }
    }
  }, [status, id]);

  // Force save function for manual triggers (like page leave)
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

// Helper to get last edited draft ID
export const getLastEditedDraftId = () => {
  return localStorage.getItem(LAST_EDITED_DRAFT_KEY);
};

// Helper to clear last edited draft
export const clearLastEditedDraft = () => {
  localStorage.removeItem(LAST_EDITED_DRAFT_KEY);
};

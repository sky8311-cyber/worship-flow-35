import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

type RealtimePayload = RealtimePostgresChangesPayload<{
  [key: string]: any;
}>;

interface UseSetRealtimeSyncOptions {
  onSongChange?: (payload: RealtimePayload) => void;
  onComponentChange?: (payload: RealtimePayload) => void;
  onSetChange?: (payload: RealtimePayload) => void;
}

export const useSetRealtimeSync = (
  setId: string | undefined,
  options: UseSetRealtimeSyncOptions
) => {
  const { onSongChange, onComponentChange, onSetChange } = options;
  
  // Use refs to avoid re-subscribing when callbacks change
  const onSongChangeRef = useRef(onSongChange);
  const onComponentChangeRef = useRef(onComponentChange);
  const onSetChangeRef = useRef(onSetChange);
  
  useEffect(() => {
    onSongChangeRef.current = onSongChange;
    onComponentChangeRef.current = onComponentChange;
    onSetChangeRef.current = onSetChange;
  }, [onSongChange, onComponentChange, onSetChange]);

  useEffect(() => {
    if (!setId) return;

    console.log("[Realtime] Subscribing to set:", setId);

    const channel = supabase
      .channel(`set-realtime-${setId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "set_songs",
          filter: `service_set_id=eq.${setId}`,
        },
        (payload: RealtimePayload) => {
          console.log("[Realtime] set_songs change:", payload.eventType);
          onSongChangeRef.current?.(payload);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "set_components",
          filter: `service_set_id=eq.${setId}`,
        },
        (payload: RealtimePayload) => {
          console.log("[Realtime] set_components change:", payload.eventType);
          onComponentChangeRef.current?.(payload);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "service_sets",
          filter: `id=eq.${setId}`,
        },
        (payload: RealtimePayload) => {
          console.log("[Realtime] service_sets change:", payload.eventType);
          onSetChangeRef.current?.(payload);
        }
      )
      .subscribe((status) => {
        console.log("[Realtime] Subscription status:", status);
      });

    return () => {
      console.log("[Realtime] Unsubscribing from set:", setId);
      supabase.removeChannel(channel);
    };
  }, [setId]);
};

// Helper hook for creating stable realtime handlers with full song data fetching
export const useRealtimeHandlers = (
  setItems: React.Dispatch<React.SetStateAction<any[]>>,
  localChangeIdsRef: React.MutableRefObject<Set<string>>,
  externalAddedIdsRef?: React.MutableRefObject<Set<string>>
) => {
  const handleSongRealtimeChange = useCallback(
    async (payload: RealtimePayload) => {
      const eventType = payload.eventType;
      const newData = payload.new as any;
      const oldData = payload.old as any;

      // Skip if this is a change we just made locally
      const changeId = newData?.id || oldData?.id;
      if (changeId && localChangeIdsRef.current.has(changeId)) {
        console.log("[Realtime] Skipping local change:", changeId);
        // Keep for a short TTL so INSERT/UPDATE bursts are reliably ignored
        setTimeout(() => {
          localChangeIdsRef.current.delete(changeId);
        }, 5000);
        return;
      }

      if (eventType === "INSERT") {
        // CRITICAL: Multi-tab loop prevention
        // Check by dbId AND song_id to prevent duplicates from different tabs
        let existsByDbId = false;
        let existsBySongId = false;
        let matchingLocalItem: { id: string } | null = null;
        let existingItemForSongId: { id: string; dbId?: string } | null = null;

        setItems((current) => {
          for (const item of current) {
            if (item.type !== "song") continue;

            // Already has this dbId - skip entirely
            if (item.dbId === newData.id) {
              existsByDbId = true;
              break;
            }

            // Check if song_id already exists (regardless of dbId)
            const itemSongId = item.data.song_id || item.data.song?.id;
            if (itemSongId && itemSongId === newData.song_id) {
              if (!item.dbId) {
                // Local item without dbId - need to patch
                matchingLocalItem = { id: item.id };
              } else {
                // Already has different dbId but same song_id - just update dbId
                existingItemForSongId = { id: item.id, dbId: item.dbId };
                existsBySongId = true;
              }
              break;
            }
          }
          return current;
        });

        if (existsByDbId) {
          console.log("[Realtime] Song already exists by dbId, skipping:", newData.id);
          return;
        }

        // If song_id already exists with a different dbId, just update the dbId
        // This prevents duplicate songs when multi-tab sync occurs
        if (existsBySongId && existingItemForSongId) {
          console.log("[Realtime] Song already exists by song_id, updating dbId only:", existingItemForSongId.id, "->", newData.id);
          localChangeIdsRef.current.add(newData.id);
          setTimeout(() => localChangeIdsRef.current.delete(newData.id), 5000);

          setItems((current) =>
            current.map((item) =>
              item.id === existingItemForSongId!.id
                ? { ...item, dbId: newData.id, data: { ...item.data, position: newData.position } }
                : item
            )
          );
          return;
        }

        // If we found a matching local item without dbId, just patch the dbId
        if (matchingLocalItem) {
          console.log("[Realtime] Patching dbId to existing local song:", matchingLocalItem.id, "->", newData.id);
          localChangeIdsRef.current.add(newData.id);
          setTimeout(() => localChangeIdsRef.current.delete(newData.id), 5000);

          setItems((current) =>
            current.map((item) =>
              item.id === matchingLocalItem!.id
                ? { ...item, dbId: newData.id }
                : item
            )
          );
          return;
        }

        console.log("[Realtime] Fetching full song data for:", newData.id);
        
        // Fetch complete song data including song details and scores
        const { data: setSongData, error } = await supabase
          .from("set_songs")
          .select(`
            *,
            songs:song_id (
              *,
              song_scores (id, key, file_url, page_number, position)
            )
          `)
          .eq("id", newData.id)
          .single();

        if (error || !setSongData) {
          console.error("[Realtime] Failed to fetch song data:", error);
          return;
        }

        // FINAL CHECK: Verify song_id doesn't exist before adding
        let shouldAdd = true;
        setItems((current) => {
          for (const item of current) {
            if (item.type !== "song") continue;
            const itemSongId = item.data.song_id || item.data.song?.id;
            if (itemSongId === newData.song_id || item.dbId === newData.id) {
              console.log("[Realtime] Song already exists after fetch, skipping add:", newData.id);
              shouldAdd = false;
              break;
            }
          }
          return current;
        });

        if (!shouldAdd) {
          return;
        }

        console.log("[Realtime] Adding song from remote with full data:", newData.id);
        
        // Mark this as externally added to protect from auto-save deletion
        if (externalAddedIdsRef) {
          externalAddedIdsRef.current.add(newData.id);
          setTimeout(() => externalAddedIdsRef.current.delete(newData.id), 5000);
        }
        localChangeIdsRef.current.add(newData.id);
        setTimeout(() => localChangeIdsRef.current.delete(newData.id), 5000);
        
        const newItem = {
          type: "song" as const,
          id: `song-${newData.id}`,
          dbId: newData.id,
          data: {
            ...setSongData,
            song: setSongData.songs,
          },
        };

        setItems((current) => {
          // Double check it wasn't added while we were fetching
          const alreadyExists = current.some((item) => {
            if (item.type !== "song") return false;
            if (item.dbId === newData.id) return true;
            const itemSongId = item.data.song_id || item.data.song?.id;
            if (itemSongId === newData.song_id) return true;
            return false;
          });
          if (alreadyExists) {
            console.log("[Realtime] Song already exists in final check, skipping:", newData.id);
            return current;
          }
          return [...current, newItem].sort(
            (a, b) => (a.data.position || 0) - (b.data.position || 0)
          );
        });
      } else if (eventType === "UPDATE") {
        setItems((current) =>
          current.map((item) => {
            if (item.type === "song" && item.dbId === newData.id) {
              return {
                ...item,
                data: { ...item.data, ...newData },
              };
            }
            return item;
          })
        );
      } else if (eventType === "DELETE") {
        setItems((current) =>
          current.filter(
            (item) => !(item.type === "song" && item.dbId === oldData.id)
          )
        );
      }
    },
    [setItems, localChangeIdsRef, externalAddedIdsRef]
  );

  const handleComponentRealtimeChange = useCallback(
    async (payload: RealtimePayload) => {
      const eventType = payload.eventType;
      const newData = payload.new as any;
      const oldData = payload.old as any;

      // Skip if this is a change we just made locally
      const changeId = newData?.id || oldData?.id;
      if (changeId && localChangeIdsRef.current.has(changeId)) {
        console.log("[Realtime] Skipping local component change:", changeId);
        // Keep for a short TTL so INSERT/UPDATE bursts are reliably ignored
        setTimeout(() => {
          localChangeIdsRef.current.delete(changeId);
        }, 5000);
        return;
      }

      if (eventType === "INSERT") {
        // CRITICAL: Multi-tab loop prevention
        // Check by dbId AND component_type+label to prevent duplicates
        let existsByDbId = false;
        let existsByTypeLabel = false;
        let matchingLocalItem: { id: string } | null = null;
        let existingItemForTypeLabel: { id: string; dbId?: string } | null = null;

        setItems((current) => {
          for (const item of current) {
            if (item.type !== "component") continue;

            // Already has this dbId - skip entirely
            if (item.dbId === newData.id) {
              existsByDbId = true;
              break;
            }

            // Check if component_type + label already exists
            if (
              item.data.component_type === newData.component_type &&
              item.data.label === newData.label
            ) {
              if (!item.dbId) {
                // Local item without dbId - need to patch
                matchingLocalItem = { id: item.id };
              } else {
                // Already has different dbId but same type+label - just update dbId
                existingItemForTypeLabel = { id: item.id, dbId: item.dbId };
                existsByTypeLabel = true;
              }
              break;
            }
          }
          return current;
        });

        if (existsByDbId) {
          console.log("[Realtime] Component already exists by dbId, skipping:", newData.id);
          return;
        }

        // If component_type+label already exists with a different dbId, just update
        if (existsByTypeLabel && existingItemForTypeLabel) {
          console.log("[Realtime] Component already exists by type+label, updating dbId only:", existingItemForTypeLabel.id, "->", newData.id);
          localChangeIdsRef.current.add(newData.id);
          setTimeout(() => localChangeIdsRef.current.delete(newData.id), 5000);

          setItems((current) =>
            current.map((item) =>
              item.id === existingItemForTypeLabel!.id
                ? { ...item, dbId: newData.id, data: { ...item.data, position: newData.position } }
                : item
            )
          );
          return;
        }

        // If we found a matching local item without dbId, just patch the dbId
        if (matchingLocalItem) {
          console.log("[Realtime] Patching dbId to existing local component:", matchingLocalItem.id, "->", newData.id);
          localChangeIdsRef.current.add(newData.id);
          setTimeout(() => localChangeIdsRef.current.delete(newData.id), 5000);

          setItems((current) =>
            current.map((item) =>
              item.id === matchingLocalItem!.id
                ? { ...item, dbId: newData.id }
                : item
            )
          );
          return;
        }

        console.log("[Realtime] Adding component from remote:", newData.id);
        
        // Mark as externally added
        if (externalAddedIdsRef) {
          externalAddedIdsRef.current.add(newData.id);
          setTimeout(() => externalAddedIdsRef.current.delete(newData.id), 5000);
        }
        localChangeIdsRef.current.add(newData.id);
        setTimeout(() => localChangeIdsRef.current.delete(newData.id), 5000);
        
        const newItem = {
          type: "component" as const,
          id: `component-${newData.id}`,
          dbId: newData.id,
          data: newData,
        };

        setItems((current) => {
          // Final check: prevent duplicates by dbId or type+label
          const alreadyExists = current.some((item) => {
            if (item.type !== "component") return false;
            if (item.dbId === newData.id) return true;
            if (
              item.data.component_type === newData.component_type &&
              item.data.label === newData.label
            ) return true;
            return false;
          });
          if (alreadyExists) {
            console.log("[Realtime] Component already exists in final check, skipping:", newData.id);
            return current;
          }
          return [...current, newItem].sort(
            (a, b) => (a.data.position || 0) - (b.data.position || 0)
          );
        });
      } else if (eventType === "UPDATE") {
        setItems((current) =>
          current.map((item) => {
            if (item.type === "component" && item.dbId === newData.id) {
              return {
                ...item,
                data: { ...item.data, ...newData },
              };
            }
            return item;
          })
        );
      } else if (eventType === "DELETE") {
        setItems((current) =>
          current.filter(
            (item) => !(item.type === "component" && item.dbId === oldData.id)
          )
        );
      }
    },
    [setItems, localChangeIdsRef, externalAddedIdsRef]
  );

  return {
    handleSongRealtimeChange,
    handleComponentRealtimeChange,
  };
};

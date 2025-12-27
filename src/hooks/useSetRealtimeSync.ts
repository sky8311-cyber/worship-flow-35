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

// Helper hook for creating stable realtime handlers
export const useRealtimeHandlers = (
  setItems: React.Dispatch<React.SetStateAction<any[]>>,
  localChangeIdsRef: React.MutableRefObject<Set<string>>
) => {
  const handleSongRealtimeChange = useCallback(
    (payload: RealtimePayload) => {
      const eventType = payload.eventType;
      const newData = payload.new as any;
      const oldData = payload.old as any;

      // Skip if this is a change we just made locally
      const changeId = newData?.id || oldData?.id;
      if (changeId && localChangeIdsRef.current.has(changeId)) {
        console.log("[Realtime] Skipping local change:", changeId);
        localChangeIdsRef.current.delete(changeId);
        return;
      }

      setItems((current) => {
        if (eventType === "INSERT") {
          // Check if already exists (local add)
          const exists = current.some(
            (item) => item.type === "song" && item.dbId === newData.id
          );
          if (exists) return current;

          console.log("[Realtime] Adding song from remote:", newData.id);
          
          // We need to fetch the song details since realtime only gives us set_songs data
          // For now, add a placeholder that will be updated
          const newItem = {
            type: "song" as const,
            id: `song-${newData.id}`,
            dbId: newData.id,
            data: {
              ...newData,
              song: null, // Will need to be fetched
              _needsFetch: true,
            },
          };

          return [...current, newItem].sort(
            (a, b) => (a.data.position || 0) - (b.data.position || 0)
          );
        }

        if (eventType === "UPDATE") {
          return current.map((item) => {
            if (item.type === "song" && item.dbId === newData.id) {
              return {
                ...item,
                data: { ...item.data, ...newData },
              };
            }
            return item;
          });
        }

        if (eventType === "DELETE") {
          return current.filter(
            (item) => !(item.type === "song" && item.dbId === oldData.id)
          );
        }

        return current;
      });
    },
    [setItems, localChangeIdsRef]
  );

  const handleComponentRealtimeChange = useCallback(
    (payload: RealtimePayload) => {
      const eventType = payload.eventType;
      const newData = payload.new as any;
      const oldData = payload.old as any;

      // Skip if this is a change we just made locally
      const changeId = newData?.id || oldData?.id;
      if (changeId && localChangeIdsRef.current.has(changeId)) {
        console.log("[Realtime] Skipping local component change:", changeId);
        localChangeIdsRef.current.delete(changeId);
        return;
      }

      setItems((current) => {
        if (eventType === "INSERT") {
          const exists = current.some(
            (item) => item.type === "component" && item.dbId === newData.id
          );
          if (exists) return current;

          console.log("[Realtime] Adding component from remote:", newData.id);
          
          const newItem = {
            type: "component" as const,
            id: `component-${newData.id}`,
            dbId: newData.id,
            data: newData,
          };

          return [...current, newItem].sort(
            (a, b) => (a.data.position || 0) - (b.data.position || 0)
          );
        }

        if (eventType === "UPDATE") {
          return current.map((item) => {
            if (item.type === "component" && item.dbId === newData.id) {
              return {
                ...item,
                data: { ...item.data, ...newData },
              };
            }
            return item;
          });
        }

        if (eventType === "DELETE") {
          return current.filter(
            (item) => !(item.type === "component" && item.dbId === oldData.id)
          );
        }

        return current;
      });
    },
    [setItems, localChangeIdsRef]
  );

  return {
    handleSongRealtimeChange,
    handleComponentRealtimeChange,
  };
};

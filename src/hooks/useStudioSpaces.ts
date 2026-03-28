import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface StudioSpace {
  id: string;
  room_id: string;
  name: string;
  icon: string;
  color: string;
  sort_order: number;
  visibility: "private" | "friends" | "public";
  guestbook_enabled: boolean;
  guestbook_permission: "all" | "friends";
  created_at: string | null;
  updated_at: string | null;
}

export function useStudioSpaces(roomId: string | undefined) {
  return useQuery({
    queryKey: ["studio-spaces", roomId],
    queryFn: async () => {
      if (!roomId) return [];
      const { data, error } = await supabase
        .from("studio_spaces")
        .select("*")
        .eq("room_id", roomId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as StudioSpace[];
    },
    enabled: !!roomId,
  });
}

export function useCreateSpace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      room_id: string;
      name?: string;
      icon?: string;
      color?: string;
      sort_order?: number;
    }) => {
      const { data, error } = await supabase
        .from("studio_spaces")
        .insert(params)
        .select()
        .single();
      if (error) throw error;
      return data as StudioSpace;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["studio-spaces", data.room_id] });
    },
  });
}

export function useUpdateSpace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      name?: string;
      icon?: string;
      color?: string;
      visibility?: "private" | "friends" | "public";
      guestbook_enabled?: boolean;
      guestbook_permission?: "all" | "friends";
    }) => {
      const { data, error } = await supabase
        .from("studio_spaces")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data as StudioSpace;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["studio-spaces", data.room_id] });
    },
  });
}

export function useDeleteSpace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, roomId }: { id: string; roomId: string }) => {
      const { error } = await supabase.from("studio_spaces").delete().eq("id", id);
      if (error) throw error;
      return roomId;
    },
    onSuccess: (roomId) => {
      queryClient.invalidateQueries({ queryKey: ["studio-spaces", roomId] });
    },
  });
}

export function useReorderSpaces() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roomId,
      orderedIds,
    }: {
      roomId: string;
      orderedIds: string[];
    }) => {
      await Promise.all(
        orderedIds.map((id, index) =>
          supabase.from("studio_spaces").update({ sort_order: index }).eq("id", id)
        )
      );
      return roomId;
    },
    onSuccess: (roomId) => {
      queryClient.invalidateQueries({ queryKey: ["studio-spaces", roomId] });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GuestbookEntry {
  id: string;
  room_id: string;
  author_user_id: string;
  body: string;
  created_at: string | null;
  author?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export function useGuestbook(roomId: string | undefined) {
  return useQuery({
    queryKey: ["room-guestbook", roomId],
    queryFn: async () => {
      if (!roomId) return [];
      const { data, error } = await supabase
        .from("room_guestbook")
        .select("*, profiles:author_user_id(id, full_name, avatar_url)")
        .eq("room_id", roomId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((entry: any) => ({
        id: entry.id,
        room_id: entry.room_id,
        author_user_id: entry.author_user_id,
        body: entry.body,
        created_at: entry.created_at,
        author: entry.profiles,
      })) as GuestbookEntry[];
    },
    enabled: !!roomId,
  });
}

export function useCreateGuestbookEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomId, body }: { roomId: string; body: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("room_guestbook")
        .insert({ room_id: roomId, author_user_id: user.id, body })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["room-guestbook", data.room_id] });
    },
  });
}

export function useDeleteGuestbookEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, roomId }: { id: string; roomId: string }) => {
      const { error } = await supabase.from("room_guestbook").delete().eq("id", id);
      if (error) throw error;
      return roomId;
    },
    onSuccess: (roomId) => {
      queryClient.invalidateQueries({ queryKey: ["room-guestbook", roomId] });
    },
  });
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GuestbookEntry {
  id: string;
  space_id: string;
  author_user_id: string;
  body: string;
  created_at: string | null;
  author?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export function useGuestbook(spaceId: string | undefined) {
  return useQuery({
    queryKey: ["space-guestbook", spaceId],
    queryFn: async () => {
      if (!spaceId) return [];
      const { data, error } = await supabase
        .from("space_guestbook")
        .select("*, profiles:author_user_id(id, full_name, avatar_url)")
        .eq("space_id", spaceId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((entry: any) => ({
        id: entry.id,
        space_id: entry.space_id,
        author_user_id: entry.author_user_id,
        body: entry.body,
        created_at: entry.created_at,
        author: entry.profiles,
      })) as GuestbookEntry[];
    },
    enabled: !!spaceId,
  });
}

export function useCreateGuestbookEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ spaceId, body }: { spaceId: string; body: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("space_guestbook")
        .insert({ space_id: spaceId, author_user_id: user.id, body })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["space-guestbook", data.space_id] });
    },
  });
}

export function useDeleteGuestbookEntry() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, spaceId }: { id: string; spaceId: string }) => {
      const { error } = await supabase.from("space_guestbook").delete().eq("id", id);
      if (error) throw error;
      return spaceId;
    },
    onSuccess: (spaceId) => {
      queryClient.invalidateQueries({ queryKey: ["space-guestbook", spaceId] });
    },
  });
}

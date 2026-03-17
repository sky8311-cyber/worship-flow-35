import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface PostComment {
  id: string;
  post_id: string;
  author_user_id: string;
  body: string;
  created_at: string;
  author?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  };
}

export function usePostComments(postId?: string) {
  return useQuery({
    queryKey: ["post-comments", postId],
    queryFn: async () => {
      if (!postId) return [];
      const { data, error } = await supabase
        .from("room_post_comments")
        .select(`
          *,
          author:profiles!author_user_id(id, full_name, avatar_url)
        `)
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as PostComment[];
    },
    enabled: !!postId,
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ postId, body }: { postId: string; body: string }) => {
      if (!user) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("room_post_comments")
        .insert({ post_id: postId, author_user_id: user.id, body })
        .select(`*, author:profiles!author_user_id(id, full_name, avatar_url)`)
        .single();
      if (error) throw error;
      return data as PostComment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["post-comments", variables.postId] });
    },
    onError: () => {
      toast.error("Failed to post comment");
    },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ commentId, postId }: { commentId: string; postId: string }) => {
      const { error } = await supabase
        .from("room_post_comments")
        .delete()
        .eq("id", commentId);
      if (error) throw error;
      return postId;
    },
    onSuccess: (postId) => {
      queryClient.invalidateQueries({ queryKey: ["post-comments", postId] });
    },
    onError: () => {
      toast.error("Failed to delete comment");
    },
  });
}

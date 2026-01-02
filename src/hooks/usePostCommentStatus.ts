import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface CommentStatus {
  totalCount: number;
  unreadCount: number;
  lastReadAt: string | null;
}

export function usePostCommentStatus(postId: string, postType: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch comment count and read status
  const { data: status, isLoading } = useQuery({
    queryKey: ["post-comment-status", postId, postType, user?.id],
    queryFn: async (): Promise<CommentStatus> => {
      // Get total comment count
      const { count: totalCount, error: countError } = await supabase
        .from("post_comments")
        .select("*", { count: "exact", head: true })
        .eq("post_id", postId)
        .eq("post_type", postType);

      if (countError) throw countError;

      // Get user's last read time
      let lastReadAt: string | null = null;
      let unreadCount = 0;

      if (user) {
        const { data: readData } = await supabase
          .from("post_comment_reads")
          .select("last_read_at")
          .eq("user_id", user.id)
          .eq("post_id", postId)
          .eq("post_type", postType)
          .maybeSingle();

        lastReadAt = readData?.last_read_at || null;

        // Count unread comments (comments after last read time)
        if (lastReadAt) {
          const { count: unread } = await supabase
            .from("post_comments")
            .select("*", { count: "exact", head: true })
            .eq("post_id", postId)
            .eq("post_type", postType)
            .gt("created_at", lastReadAt);

          unreadCount = unread || 0;
        } else {
          // Never read - all comments are unread
          unreadCount = totalCount || 0;
        }
      }

      return {
        totalCount: totalCount || 0,
        unreadCount,
        lastReadAt,
      };
    },
    enabled: !!postId && !!postType,
    staleTime: 30000, // Cache for 30 seconds
  });

  // Mark comments as read
  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;

      const { error } = await supabase
        .from("post_comment_reads")
        .upsert(
          {
            user_id: user.id,
            post_id: postId,
            post_type: postType,
            last_read_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,post_id,post_type",
          }
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["post-comment-status", postId, postType, user?.id],
      });
    },
  });

  return {
    totalCount: status?.totalCount || 0,
    unreadCount: status?.unreadCount || 0,
    lastReadAt: status?.lastReadAt || null,
    isLoading,
    markAsRead: markAsReadMutation.mutate,
  };
}

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedSocialData } from "@/contexts/FeedSocialDataContext";

interface CommentStatus {
  totalCount: number;
  unreadCount: number;
  lastReadAt: string | null;
}

export function usePostCommentStatus(postId: string, postType: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  // Try to use batch context first
  const feedSocialData = useFeedSocialData();
  const batchCommentStatus = feedSocialData?.getCommentStatus(postId);

  // Fallback query for when not in batch context
  const { data: fallbackStatus, isLoading: fallbackLoading } = useQuery({
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
    enabled: !!postId && !!postType && !feedSocialData,
    staleTime: 30 * 1000,
  });

  // Mark comments as read mutation (fallback)
  const markAsReadMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;

      if (feedSocialData) {
        feedSocialData.markAsRead(postId, postType);
        return;
      }

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
      if (!feedSocialData) {
        queryClient.invalidateQueries({
          queryKey: ["post-comment-status", postId, postType, user?.id],
        });
      }
    },
  });

  // Use batch data if available, otherwise fallback
  const status = feedSocialData
    ? batchCommentStatus
    : fallbackStatus;

  const handleMarkAsRead = () => {
    if (feedSocialData) {
      feedSocialData.markAsRead(postId, postType);
    } else {
      markAsReadMutation.mutate();
    }
  };

  return {
    totalCount: status?.totalCount || 0,
    unreadCount: status?.unreadCount || 0,
    lastReadAt: status?.lastReadAt || null,
    isLoading: feedSocialData ? feedSocialData.isCommentStatusLoading : fallbackLoading,
    markAsRead: handleMarkAsRead,
  };
}

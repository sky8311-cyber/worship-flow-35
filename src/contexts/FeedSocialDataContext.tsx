import { createContext, useContext, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { creditPostLikedReward } from "@/lib/rewardsHelper";

interface LikeData {
  postId: string;
  isLiked: boolean;
  likeCount: number;
}

interface CommentStatusData {
  postId: string;
  totalCount: number;
  unreadCount: number;
  lastReadAt: string | null;
}

interface FeedSocialDataContextValue {
  // Like data
  getLikeData: (postId: string) => LikeData | undefined;
  toggleLike: (postId: string, postType: string) => void;
  isLikeLoading: boolean;
  
  // Comment status data
  getCommentStatus: (postId: string) => CommentStatusData | undefined;
  markAsRead: (postId: string, postType: string) => void;
  isCommentStatusLoading: boolean;
}

const FeedSocialDataContext = createContext<FeedSocialDataContextValue | null>(null);

interface FeedSocialDataProviderProps {
  children: ReactNode;
  postIds: string[];
  postTypes: Map<string, string>; // postId -> postType mapping
}

export function FeedSocialDataProvider({ 
  children, 
  postIds,
  postTypes 
}: FeedSocialDataProviderProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Batch fetch like data for all posts
  const { data: likeData, isLoading: isLikeLoading } = useQuery({
    queryKey: ["batch-likes", postIds.join(","), user?.id],
    queryFn: async () => {
      if (!postIds.length) return new Map<string, LikeData>();

      // Fetch like counts for all posts in one query
      const { data: likeCounts, error: countError } = await supabase
        .from("post_likes")
        .select("post_id")
        .in("post_id", postIds);

      if (countError) throw countError;

      // Count likes per post
      const countMap = new Map<string, number>();
      likeCounts?.forEach((like) => {
        const current = countMap.get(like.post_id) || 0;
        countMap.set(like.post_id, current + 1);
      });

      // Fetch user's likes if logged in
      let userLikeSet = new Set<string>();
      if (user) {
        const { data: userLikes, error: userError } = await supabase
          .from("post_likes")
          .select("post_id")
          .in("post_id", postIds)
          .eq("user_id", user.id);

        if (userError) throw userError;
        userLikeSet = new Set(userLikes?.map((l) => l.post_id));
      }

      // Build result map
      const result = new Map<string, LikeData>();
      postIds.forEach((postId) => {
        result.set(postId, {
          postId,
          isLiked: userLikeSet.has(postId),
          likeCount: countMap.get(postId) || 0,
        });
      });

      return result;
    },
    enabled: postIds.length > 0,
    staleTime: 30 * 1000,
  });

  // Batch fetch comment status for all posts
  const { data: commentStatusData, isLoading: isCommentStatusLoading } = useQuery({
    queryKey: ["batch-comment-status", postIds.join(","), user?.id],
    queryFn: async () => {
      if (!postIds.length) return new Map<string, CommentStatusData>();

      // Fetch comment counts for all posts
      const { data: comments, error: commentsError } = await supabase
        .from("post_comments")
        .select("post_id, created_at")
        .in("post_id", postIds);

      if (commentsError) throw commentsError;

      // Count comments per post and track latest
      const commentCountMap = new Map<string, number>();
      comments?.forEach((comment) => {
        const current = commentCountMap.get(comment.post_id) || 0;
        commentCountMap.set(comment.post_id, current + 1);
      });

      // Fetch user's read statuses if logged in
      let readMap = new Map<string, string>(); // postId -> lastReadAt
      if (user) {
        const { data: readData, error: readError } = await supabase
          .from("post_comment_reads")
          .select("post_id, last_read_at")
          .in("post_id", postIds)
          .eq("user_id", user.id);

        if (readError) throw readError;
        readData?.forEach((r) => {
          readMap.set(r.post_id, r.last_read_at);
        });
      }

      // Calculate unread counts
      const result = new Map<string, CommentStatusData>();
      postIds.forEach((postId) => {
        const totalCount = commentCountMap.get(postId) || 0;
        const lastReadAt = readMap.get(postId) || null;
        
        let unreadCount = 0;
        if (user && totalCount > 0) {
          if (!lastReadAt) {
            unreadCount = totalCount;
          } else {
            // Count comments after lastReadAt
            unreadCount = comments?.filter(
              (c) => c.post_id === postId && new Date(c.created_at) > new Date(lastReadAt)
            ).length || 0;
          }
        }

        result.set(postId, {
          postId,
          totalCount,
          unreadCount,
          lastReadAt,
        });
      });

      return result;
    },
    enabled: postIds.length > 0,
    staleTime: 30 * 1000,
  });

  // Toggle like mutation
  const likeMutation = useMutation({
    mutationFn: async ({ postId, postType }: { postId: string; postType: string }) => {
      if (!user) return;

      const currentData = likeData?.get(postId);
      const isCurrentlyLiked = currentData?.isLiked || false;

      if (isCurrentlyLiked) {
        const { error } = await supabase
          .from("post_likes")
          .delete()
          .eq("post_id", postId)
          .eq("post_type", postType)
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("post_likes").insert({
          post_id: postId,
          post_type: postType,
          user_id: user.id,
        });
        if (error) throw error;
        
        // Credit K-Seed reward (fire-and-forget)
        creditPostLikedReward(user.id, postId);
      }
    },
    onMutate: async ({ postId }) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ["batch-likes"] });
      
      const previousData = likeData;
      const current = likeData?.get(postId);
      
      if (current && likeData) {
        const newData = new Map(likeData);
        newData.set(postId, {
          ...current,
          isLiked: !current.isLiked,
          likeCount: current.isLiked ? current.likeCount - 1 : current.likeCount + 1,
        });
        queryClient.setQueryData(["batch-likes", postIds.join(","), user?.id], newData);
      }
      
      return { previousData };
    },
    onError: (err, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(
          ["batch-likes", postIds.join(","), user?.id], 
          context.previousData
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["batch-likes"] });
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async ({ postId, postType }: { postId: string; postType: string }) => {
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
          { onConflict: "user_id,post_id,post_type" }
        );

      if (error) throw error;
    },
    onMutate: async ({ postId }) => {
      // Optimistic update
      const current = commentStatusData?.get(postId);
      if (current && commentStatusData) {
        const newData = new Map(commentStatusData);
        newData.set(postId, {
          ...current,
          unreadCount: 0,
          lastReadAt: new Date().toISOString(),
        });
        queryClient.setQueryData(
          ["batch-comment-status", postIds.join(","), user?.id], 
          newData
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["batch-comment-status"] });
    },
  });

  const getLikeData = (postId: string): LikeData | undefined => {
    return likeData?.get(postId);
  };

  const getCommentStatus = (postId: string): CommentStatusData | undefined => {
    return commentStatusData?.get(postId);
  };

  const toggleLike = (postId: string, postType: string) => {
    likeMutation.mutate({ postId, postType });
  };

  const markAsRead = (postId: string, postType: string) => {
    markAsReadMutation.mutate({ postId, postType });
  };

  return (
    <FeedSocialDataContext.Provider
      value={{
        getLikeData,
        toggleLike,
        isLikeLoading,
        getCommentStatus,
        markAsRead,
        isCommentStatusLoading,
      }}
    >
      {children}
    </FeedSocialDataContext.Provider>
  );
}

export function useFeedSocialData() {
  const context = useContext(FeedSocialDataContext);
  return context;
}

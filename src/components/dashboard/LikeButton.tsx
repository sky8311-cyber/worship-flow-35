import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useFeedSocialData } from "@/contexts/FeedSocialDataContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { LikersDialog } from "./LikersDialog";
import { creditPostLikedReward } from "@/lib/rewardsHelper";

interface LikeButtonProps {
  postId: string;
  postType: "community_post" | "worship_set" | "calendar_event" | "feedback_post";
}

export function LikeButton({ postId, postType }: LikeButtonProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showLikersDialog, setShowLikersDialog] = useState(false);
  
  // Try to use batch context first
  const feedSocialData = useFeedSocialData();
  const batchLikeData = feedSocialData?.getLikeData(postId);

  // Fallback queries for when not in batch context
  const { data: fallbackLikeData } = useQuery({
    queryKey: ["post-like", postId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("post_likes")
        .select("id")
        .eq("post_id", postId)
        .eq("post_type", postType)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user && !feedSocialData,
    staleTime: 30 * 1000,
  });

  const { data: fallbackLikeCount } = useQuery({
    queryKey: ["post-like-count", postId],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("post_likes")
        .select("*", { count: "exact", head: true })
        .eq("post_id", postId)
        .eq("post_type", postType);
      if (error) throw error;
      return count || 0;
    },
    enabled: !feedSocialData,
    staleTime: 30 * 1000,
  });

  // Use batch data if available, otherwise fallback
  const isLiked = feedSocialData 
    ? batchLikeData?.isLiked || false
    : !!fallbackLikeData;
  
  const likeCount = feedSocialData
    ? batchLikeData?.likeCount || 0
    : fallbackLikeCount || 0;

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;

      if (feedSocialData) {
        // Use batch context
        feedSocialData.toggleLike(postId, postType);
        return;
      }

      // Fallback: individual mutation
      if (isLiked) {
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
        
        creditPostLikedReward(user.id, postId);
      }
    },
    onSuccess: () => {
      if (!feedSocialData) {
        queryClient.invalidateQueries({ queryKey: ["post-like", postId] });
        queryClient.invalidateQueries({ queryKey: ["post-like-count", postId] });
      }
    },
  });

  const handleClick = () => {
    if (feedSocialData) {
      feedSocialData.toggleLike(postId, postType);
    } else {
      likeMutation.mutate();
    }
  };

  return (
    <>
      <div className="flex items-center gap-1.5">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleClick}
          disabled={!user || likeMutation.isPending}
          className={`h-8 w-8 p-0 ${isLiked ? "text-red-500" : ""}`}
        >
          <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
        </Button>
        {likeCount > 0 && (
          <button
            onClick={() => setShowLikersDialog(true)}
            className="text-base font-semibold hover:underline"
          >
            {likeCount}
          </button>
        )}
      </div>
      
      <LikersDialog
        postId={postId}
        postType={postType}
        open={showLikersDialog}
        onOpenChange={setShowLikersDialog}
      />
    </>
  );
}

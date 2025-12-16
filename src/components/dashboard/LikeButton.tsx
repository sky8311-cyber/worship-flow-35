import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { LikersDialog } from "./LikersDialog";

interface LikeButtonProps {
  postId: string;
  postType: "community_post" | "worship_set" | "calendar_event" | "feedback_post";
}

export function LikeButton({ postId, postType }: LikeButtonProps) {
  const { user } = useAuth();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [showLikersDialog, setShowLikersDialog] = useState(false);

  const { data: likeData } = useQuery({
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
    enabled: !!user,
  });

  const { data: likeCount } = useQuery({
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
  });

  const likeMutation = useMutation({
    mutationFn: async () => {
      if (!user) return;

      if (likeData) {
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
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post-like", postId] });
      queryClient.invalidateQueries({ queryKey: ["post-like-count", postId] });
    },
  });

  const isLiked = !!likeData;

  return (
    <>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => likeMutation.mutate()}
          disabled={!user || likeMutation.isPending}
          className={isLiked ? "text-red-500" : ""}
        >
          <Heart className={`w-4 h-4 mr-1 ${isLiked ? "fill-current" : ""}`} />
          {t("socialFeed.like")}
        </Button>
        {likeCount !== undefined && likeCount > 0 && (
          <button
            onClick={() => setShowLikersDialog(true)}
            className="text-sm text-muted-foreground hover:underline"
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

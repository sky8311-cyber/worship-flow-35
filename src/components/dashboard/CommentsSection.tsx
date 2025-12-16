import { useState } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { AvatarWithLevel } from "@/components/seeds/AvatarWithLevel";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { Loader2 } from "lucide-react";

interface CommentsSectionProps {
  postId: string;
  postType: "community_post" | "worship_set" | "calendar_event" | "feedback_post";
}

export function CommentsSection({ postId, postType }: CommentsSectionProps) {
  const { user, profile } = useAuth();
  const { t, language } = useTranslation();
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState("");

  const { data: comments, isLoading } = useQuery({
    queryKey: ["post-comments", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("post_comments")
        .select(`
          *,
          profiles!author_id(id, full_name, avatar_url)
        `)
        .eq("post_id", postId)
        .eq("post_type", postType)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const commentMutation = useMutation({
    mutationFn: async (content: string) => {
      const { error } = await supabase.from("post_comments").insert({
        post_id: postId,
        post_type: postType,
        author_id: user!.id,
        content: content.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["post-comments", postId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await supabase
        .from("post_comments")
        .delete()
        .eq("id", commentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post-comments", postId] });
    },
  });

  const handleSubmit = () => {
    if (!newComment.trim()) return;
    commentMutation.mutate(newComment);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="space-y-4 pt-4">
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {comments?.map((comment: any) => (
            <div key={comment.id} className="flex gap-3">
              {comment.profiles?.id ? (
                <AvatarWithLevel
                  userId={comment.profiles.id}
                  avatarUrl={comment.profiles.avatar_url}
                  fallback={comment.profiles?.full_name?.charAt(0) || "U"}
                  size="sm"
                  className="w-8 h-8"
                />
              ) : (
                <Avatar className="w-8 h-8">
                  <AvatarImage src={comment.profiles?.avatar_url || ""} />
                  <AvatarFallback>
                    {comment.profiles?.full_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              )}
              <div className="flex-1">
                <div className="bg-muted rounded-lg px-4 py-2">
                  <p className="font-medium text-sm">
                    {comment.profiles?.full_name || "Anonymous"}
                  </p>
                  <p className="text-sm">{comment.content}</p>
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), {
                      addSuffix: true,
                      locale: language === "ko" ? ko : undefined,
                    })}
                  </span>
                  {comment.author_id === user?.id && (
                    <button
                      onClick={() => deleteMutation.mutate(comment.id)}
                      className="text-xs text-muted-foreground hover:underline"
                    >
                      {t("socialFeed.delete")}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </>
      )}

      {user && (
        <div className="flex gap-3">
          {user.id && profile ? (
            <AvatarWithLevel
              userId={user.id}
              avatarUrl={profile.avatar_url}
              fallback={profile?.full_name?.charAt(0) || "U"}
              size="sm"
              className="w-8 h-8"
            />
          ) : (
            <Avatar className="w-8 h-8">
              <AvatarImage src={profile?.avatar_url || ""} />
              <AvatarFallback>{profile?.full_name?.charAt(0) || "U"}</AvatarFallback>
            </Avatar>
          )}
          <div className="flex-1 flex gap-2">
            <Input
              placeholder={t("socialFeed.writeComment")}
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={commentMutation.isPending}
            />
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={!newComment.trim() || commentMutation.isPending}
            >
              {t("socialFeed.post")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

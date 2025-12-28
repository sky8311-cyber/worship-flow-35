import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { Pin, MoreHorizontal, Trash2, Edit2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface WelcomePost {
  id: string;
  title: string | null;
  content: string;
  is_pinned: boolean;
  created_at: string;
  author: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface WelcomePostCardProps {
  post: WelcomePost;
}

export function WelcomePostCard({ post }: WelcomePostCardProps) {
  const { language } = useTranslation();
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const dateLocale = language === "ko" ? ko : enUS;

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("welcome_posts")
        .delete()
        .eq("id", post.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(language === "ko" ? "게시물이 삭제되었습니다" : "Post deleted");
      queryClient.invalidateQueries({ queryKey: ["welcome-posts"] });
    },
    onError: () => {
      toast.error(language === "ko" ? "삭제에 실패했습니다" : "Failed to delete");
    },
  });

  const togglePinMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("welcome_posts")
        .update({ is_pinned: !post.is_pinned })
        .eq("id", post.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(
        post.is_pinned
          ? language === "ko" ? "고정 해제됨" : "Unpinned"
          : language === "ko" ? "상단 고정됨" : "Pinned"
      );
      queryClient.invalidateQueries({ queryKey: ["welcome-posts"] });
    },
    onError: () => {
      toast.error(language === "ko" ? "변경에 실패했습니다" : "Failed to update");
    },
  });

  const handleDelete = () => {
    if (confirm(language === "ko" ? "정말 삭제하시겠습니까?" : "Are you sure you want to delete this?")) {
      deleteMutation.mutate();
    }
  };

  return (
    <Card className={post.is_pinned ? "border-primary/30 bg-primary/5" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={post.author?.avatar_url || undefined} />
              <AvatarFallback>
                {post.author?.full_name?.charAt(0) || "A"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {post.author?.full_name || (language === "ko" ? "관리자" : "Admin")}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {language === "ko" ? "운영팀" : "Team"}
                </Badge>
                {post.is_pinned && (
                  <Pin className="w-3 h-3 text-primary" />
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(post.created_at), {
                  addSuffix: true,
                  locale: dateLocale,
                })}
              </span>
            </div>
          </div>

          {isAdmin && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => togglePinMutation.mutate()}>
                  <Pin className="w-4 h-4 mr-2" />
                  {post.is_pinned
                    ? language === "ko" ? "고정 해제" : "Unpin"
                    : language === "ko" ? "상단 고정" : "Pin to top"}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDelete}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {language === "ko" ? "삭제" : "Delete"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {post.title && (
          <h3 className="font-semibold text-lg mb-2">{post.title}</h3>
        )}
        <p className="text-foreground whitespace-pre-wrap">{post.content}</p>
      </CardContent>
    </Card>
  );
}

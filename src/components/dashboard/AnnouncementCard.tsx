import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pin, Megaphone, MoreVertical, Trash2, PinOff } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
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

interface AnnouncementCardProps {
  post: WelcomePost;
}

export function AnnouncementCard({ post }: AnnouncementCardProps) {
  const { isAdmin } = useAuth();
  const { language } = useTranslation();
  const queryClient = useQueryClient();

  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: language === "ko" ? ko : enUS,
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("welcome_posts")
        .delete()
        .eq("id", post.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["welcome-posts"] });
      toast.success(language === "ko" ? "공지가 삭제되었습니다" : "Announcement deleted");
    },
    onError: () => {
      toast.error(language === "ko" ? "삭제 실패" : "Failed to delete");
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
      queryClient.invalidateQueries({ queryKey: ["welcome-posts"] });
      toast.success(
        post.is_pinned
          ? language === "ko" ? "고정 해제됨" : "Unpinned"
          : language === "ko" ? "고정됨" : "Pinned"
      );
    },
    onError: () => {
      toast.error(language === "ko" ? "업데이트 실패" : "Failed to update");
    },
  });

  return (
    <div className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg border border-primary/10">
      <Megaphone className="w-5 h-5 text-primary shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {post.is_pinned && (
            <Pin className="w-3 h-3 text-primary shrink-0" />
          )}
          <span className="font-medium text-sm">
            {post.title || (language === "ko" ? "공지" : "Announcement")}
          </span>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>
        <p className="text-sm text-muted-foreground mt-1 line-clamp-2 whitespace-pre-wrap">
          {post.content}
        </p>
        {post.author && (
          <div className="flex items-center gap-1.5 mt-2">
            <Avatar className="w-4 h-4">
              <AvatarImage src={post.author.avatar_url || undefined} />
              <AvatarFallback className="text-[8px]">
                {post.author.full_name?.[0] || "A"}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs text-muted-foreground">
              {post.author.full_name || (language === "ko" ? "관리자" : "Admin")}
            </span>
          </div>
        )}
      </div>
      {isAdmin && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => togglePinMutation.mutate()}>
              {post.is_pinned ? (
                <>
                  <PinOff className="w-4 h-4 mr-2" />
                  {language === "ko" ? "고정 해제" : "Unpin"}
                </>
              ) : (
                <>
                  <Pin className="w-4 h-4 mr-2" />
                  {language === "ko" ? "고정" : "Pin"}
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => deleteMutation.mutate()}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {language === "ko" ? "삭제" : "Delete"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

import { useState, useRef, useCallback } from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { AvatarWithLevel } from "@/components/seeds/AvatarWithLevel";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Heart, MoreVertical, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { ImageGrid } from "./ImageGrid";
import { LikersDialog } from "./LikersDialog";
import { CommentsSection } from "./CommentsSection";
import { useIsMobile } from "@/hooks/use-mobile";

interface Author {
  id: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

interface Community {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface ChatBubbleProps {
  id: string;
  author: Author;
  community: Community;
  content: string;
  images?: string[];
  createdAt: string;
  isOwn: boolean;
  onProfileClick: (author: Author) => void;
}

export function ChatBubble({
  id,
  author,
  community,
  content,
  images,
  createdAt,
  isOwn,
  onProfileClick,
}: ChatBubbleProps) {
  const { t, language } = useTranslation();
  const { user, isAdmin, isWorshipLeader } = useAuth();
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editContent, setEditContent] = useState(content);
  const [showLikersDialog, setShowLikersDialog] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const isMobile = useIsMobile();
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      setShowActions(true);
    }, 500);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleTouchCancel = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const authorName = author?.full_name || t("common.deletedUser");
  const authorInitial = authorName.charAt(0) || "?";

  // Like queries
  const { data: likeData } = useQuery({
    queryKey: ["post-like", id, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("post_likes")
        .select("id")
        .eq("post_id", id)
        .eq("post_type", "community_post")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: likeCount } = useQuery({
    queryKey: ["post-like-count", id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("post_likes")
        .select("*", { count: "exact", head: true })
        .eq("post_id", id)
        .eq("post_type", "community_post");
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
          .eq("post_id", id)
          .eq("post_type", "community_post")
          .eq("user_id", user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("post_likes").insert({
          post_id: id,
          post_type: "community_post",
          user_id: user.id,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["post-like", id] });
      queryClient.invalidateQueries({ queryKey: ["post-like-count", id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("community_posts")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("common.deleteSuccess"));
      queryClient.invalidateQueries({ queryKey: ["unified-community-feed"] });
      queryClient.invalidateQueries({ queryKey: ["community-newsfeed"] });
    },
    onError: () => {
      toast.error(t("common.error"));
    },
  });

  const editMutation = useMutation({
    mutationFn: async (newContent: string) => {
      const { error } = await supabase
        .from("community_posts")
        .update({ content: newContent, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("common.saveSuccess"));
      queryClient.invalidateQueries({ queryKey: ["unified-community-feed"] });
      queryClient.invalidateQueries({ queryKey: ["community-newsfeed"] });
      setEditDialogOpen(false);
    },
    onError: () => {
      toast.error(t("common.error"));
    },
  });

  const handleDelete = () => {
    const confirmMessage = isOwn
      ? t("common.confirmDelete")
      : t("socialFeed.confirmDeleteOtherPost", { author: authorName });
    if (window.confirm(confirmMessage)) {
      deleteMutation.mutate();
    }
  };

  const handleSaveEdit = () => {
    if (!editContent.trim()) {
      toast.error(t("common.required"));
      return;
    }
    editMutation.mutate(editContent);
  };

  const isLiked = !!likeData;
  const canManage = isOwn || isAdmin || isWorshipLeader;

  // Action buttons component
  const ActionButtons = ({ align = "left" }: { align?: "left" | "right" }) => (
    <div 
      className={`flex items-center gap-0.5 ${
        isMobile 
          ? (showActions ? "opacity-100" : "opacity-0 pointer-events-none") 
          : "opacity-0 group-hover:opacity-100"
      } transition-opacity`}
    >
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => likeMutation.mutate()}
      >
        <Heart className={`w-5 h-5 ${isLiked ? "fill-red-500 text-red-500" : ""}`} />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={() => setShowComments(!showComments)}
      >
        <MessageCircle className="w-4 h-4" />
      </Button>
      {canManage && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
              <MoreVertical className="w-3.5 h-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align={align === "left" ? "start" : "end"}>
            {isOwn && (
              <DropdownMenuItem onClick={() => { setEditContent(content); setEditDialogOpen(true); }}>
                {t("socialFeed.edit")}
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
              {t("socialFeed.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );

  // Own message (right aligned)
  if (isOwn) {
    return (
      <>
        <div 
          className="flex justify-end gap-2 mb-2 group"
          onTouchStart={isMobile ? handleTouchStart : undefined}
          onTouchEnd={isMobile ? handleTouchEnd : undefined}
          onTouchCancel={isMobile ? handleTouchCancel : undefined}
          onClick={isMobile && showActions ? () => setShowActions(false) : undefined}
        >
          {/* Action buttons - left of bubble */}
          <div className="flex items-center self-center">
            <ActionButtons align="right" />
          </div>

          <div className="flex flex-col items-end max-w-[95%] sm:max-w-[70%]">
            {/* Bubble */}
            <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2.5">
              <p className="whitespace-pre-wrap text-sm">{content}</p>
              {images && images.length > 0 && (
                <div className="mt-2">
                  <ImageGrid images={images} />
                </div>
              )}
            </div>
            
            {/* Metadata row */}
            <div className="flex items-center gap-2 mt-1 px-1">
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(createdAt), {
                  addSuffix: true,
                  locale: language === "ko" ? ko : undefined,
                })}
              </span>
              
              {/* Like indicator */}
              {likeCount !== undefined && likeCount > 0 && (
                <button
                  onClick={() => setShowLikersDialog(true)}
                  className="flex items-center gap-1 text-red-500 hover:underline"
                >
                  <Heart className="w-4 h-4 fill-current" />
                  <span className="text-sm font-semibold">{likeCount}</span>
                </button>
              )}
            </div>

            {/* Comments inline */}
            {showComments && (
              <div className="w-full mt-2 bg-muted/50 rounded-lg p-2">
                <CommentsSection postId={id} postType="community_post" />
              </div>
            )}
          </div>
          
          {/* Avatar */}
          {author?.id ? (
            <div
              className="cursor-pointer hover:opacity-80 transition-opacity shrink-0"
              onClick={() => onProfileClick(author)}
            >
              <AvatarWithLevel
                userId={author.id}
                avatarUrl={author.avatar_url}
                fallback={authorInitial}
                size="sm"
                className="w-9 h-9"
              />
            </div>
          ) : (
            <Avatar className="w-9 h-9 shrink-0">
              <AvatarImage src={author?.avatar_url || ""} />
              <AvatarFallback>{authorInitial}</AvatarFallback>
            </Avatar>
          )}
        </div>

        {/* Dialogs */}
        <LikersDialog
          postId={id}
          postType="community_post"
          open={showLikersDialog}
          onOpenChange={setShowLikersDialog}
        />
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t("socialFeed.editPost")}</DialogTitle>
            </DialogHeader>
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder={t("socialFeed.postPlaceholder")}
              className="min-h-[120px]"
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handleSaveEdit} disabled={editMutation.isPending}>
                {t("common.save")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Other's message (left aligned)
  return (
    <>
      <div 
        className="flex gap-2 mb-2 group"
        onTouchStart={isMobile ? handleTouchStart : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
        onTouchCancel={isMobile ? handleTouchCancel : undefined}
        onClick={isMobile && showActions ? () => setShowActions(false) : undefined}
      >
        {/* Avatar */}
        {author?.id ? (
          <div
            className="cursor-pointer hover:opacity-80 transition-opacity shrink-0"
            onClick={() => onProfileClick(author)}
          >
            <AvatarWithLevel
              userId={author.id}
              avatarUrl={author.avatar_url}
              fallback={authorInitial}
              size="sm"
              className="w-7 h-7 sm:w-9 sm:h-9"
            />
          </div>
        ) : (
          <Avatar className="w-7 h-7 sm:w-9 sm:h-9 shrink-0">
            <AvatarImage src={author?.avatar_url || ""} />
            <AvatarFallback>{authorInitial}</AvatarFallback>
          </Avatar>
        )}

        <div className="flex flex-col max-w-[95%] sm:max-w-[70%]">
          {/* Name */}
          <span className="text-xs font-medium text-muted-foreground mb-0.5 px-1">
            {authorName}
          </span>

          {/* Bubble */}
          <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-2.5">
            <p className="whitespace-pre-wrap text-sm">{content}</p>
            {images && images.length > 0 && (
              <div className="mt-2">
                <ImageGrid images={images} />
              </div>
            )}
          </div>

          {/* Metadata row */}
          <div className="flex items-center gap-2 mt-1 px-1">
            <span className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(createdAt), {
                addSuffix: true,
                locale: language === "ko" ? ko : undefined,
              })}
            </span>
            <span className="text-xs text-muted-foreground/70">
              {community.name}
            </span>
            
            {/* Like indicator */}
            {likeCount !== undefined && likeCount > 0 && (
              <button
                onClick={() => setShowLikersDialog(true)}
                className="flex items-center gap-1 text-red-500 hover:underline"
              >
                <Heart className="w-4 h-4 fill-current" />
                <span className="text-sm font-semibold">{likeCount}</span>
              </button>
            )}
          </div>

          {/* Comments inline */}
          {showComments && (
            <div className="w-full mt-2 bg-muted/50 rounded-lg p-2">
              <CommentsSection postId={id} postType="community_post" />
            </div>
          )}
        </div>

        {/* Action buttons - right of bubble content */}
        <div className="flex items-center self-center">
          <ActionButtons align="left" />
        </div>
      </div>

      {/* Dialogs */}
      <LikersDialog
        postId={id}
        postType="community_post"
        open={showLikersDialog}
        onOpenChange={setShowLikersDialog}
      />
    </>
  );
}

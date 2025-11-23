import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MoreHorizontal, Calendar, Music } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko } from "date-fns/locale";
import { useTranslation } from "@/hooks/useTranslation";
import { LikeButton } from "./LikeButton";
import { CommentsSection } from "./CommentsSection";
import { ImageGrid } from "./ImageGrid";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface Author {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface Community {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface FeedItem {
  id: string;
  type: "community_post" | "worship_set" | "calendar_event";
  author: Author;
  community: Community;
  content?: string;
  images?: string[];
  created_at: string;
  set?: any;
  event?: any;
}

interface SocialFeedPostProps {
  item: FeedItem;
  onProfileClick: (author: Author) => void;
}

export function SocialFeedPost({ item, onProfileClick }: SocialFeedPostProps) {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editContent, setEditContent] = useState(item.content || "");
  const queryClient = useQueryClient();

  // Worship set notifications should be simple one-line text, not full cards
  if (item.type === "worship_set") {
    const dateText = new Date(item.set.date).toLocaleDateString(
      language === "ko" ? "ko-KR" : "en-US"
    );

    return (
      <div className="flex items-center gap-3 py-3 px-4 text-sm text-muted-foreground border-b">
        <Music className="w-4 h-4 shrink-0" />
        <p className="flex-1">
          <span className="font-semibold text-foreground">{item.community.name}</span>
          {language === "ko" 
            ? ` 워십세트가 "${item.set.service_name}" (${dateText})로 업데이트되었습니다. `
            : ` updated a new Worship Set "${item.set.service_name}" (${dateText}). `
          }
          <button 
            onClick={() => window.location.assign(`/band-view/${item.set.id}`)}
            className="text-primary hover:underline font-medium"
          >
            {language === "ko" ? "더보기" : "Read More"}
          </button>
        </p>
      </div>
    );
  }

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (item.type === "community_post") {
        const { error } = await supabase
          .from("community_posts")
          .delete()
          .eq("id", item.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(t("common.deleteSuccess"));
      queryClient.invalidateQueries({ queryKey: ["unified-community-feed"] });
    },
    onError: () => {
      toast.error(t("common.error"));
    },
  });

  const editMutation = useMutation({
    mutationFn: async (newContent: string) => {
      if (item.type === "community_post") {
        const { error } = await supabase
          .from("community_posts")
          .update({ content: newContent, updated_at: new Date().toISOString() })
          .eq("id", item.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(t("common.saveSuccess"));
      queryClient.invalidateQueries({ queryKey: ["unified-community-feed"] });
      setEditDialogOpen(false);
    },
    onError: () => {
      toast.error(t("common.error"));
    },
  });

  const handleDelete = () => {
    if (window.confirm(t("common.confirmDelete"))) {
      deleteMutation.mutate();
    }
  };

  const handleEdit = () => {
    setEditContent(item.content || "");
    setEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (!editContent.trim()) {
      toast.error(t("common.required"));
      return;
    }
    editMutation.mutate(editContent);
  };

  const renderContent = () => {
    if (item.type === "community_post") {
      return (
        <>
          <p className="whitespace-pre-wrap mb-3">{item.content}</p>
          {item.images && item.images.length > 0 && (
            <ImageGrid images={item.images} />
          )}
        </>
      );
    }

    if (item.type === "calendar_event") {
      return (
        <div className="flex items-center gap-3 p-4 bg-accent/50 rounded-lg">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10">
            <Calendar className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-medium">{item.event.title}</p>
            <p className="text-sm text-muted-foreground">
              {new Date(item.event.event_date).toLocaleDateString(language === "ko" ? "ko-KR" : "en-US")}
            </p>
          </div>
        </div>
      );
    }
  };

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex items-start gap-3">
            <Avatar 
              className="cursor-pointer hover:opacity-80 transition-opacity w-10 h-10"
              onClick={() => onProfileClick(item.author)}
            >
              <AvatarImage src={item.author.avatar_url || ""} />
              <AvatarFallback>
                {item.author.full_name?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>
            
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{item.author.full_name || "Anonymous"}</p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {formatDistanceToNow(new Date(item.created_at), {
                    addSuffix: true,
                    locale: language === "ko" ? ko : undefined,
                  })}
                </span>
                <span>•</span>
                <span>{item.community.name}</span>
              </div>
            </div>

            {user?.id === item.author.id && item.type === "community_post" && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleEdit}>
                    {t("socialFeed.edit")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                    {t("socialFeed.delete")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        <CardContent>{renderContent()}</CardContent>

        <CardFooter className="flex-col items-stretch">
          <div className="flex items-center gap-4 pb-3 border-b">
            <LikeButton postId={item.id} postType={item.type} />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowComments(!showComments)}
            >
              {t("socialFeed.comment")}
            </Button>
          </div>

          {showComments && (
            <CommentsSection postId={item.id} postType={item.type} />
          )}
        </CardFooter>
      </Card>

      {/* Edit Dialog */}
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

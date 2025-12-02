import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { AvatarWithLevel } from "@/components/seeds/AvatarWithLevel";
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
  id: string | null;
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
  const { user, isAdmin, isWorshipLeader } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editContent, setEditContent] = useState(item.content || "");
  const queryClient = useQueryClient();

  // Parse date string as local date to avoid timezone issues
  const parseLocalDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Worship set and calendar event notifications should be simple one-line text, not full cards
  if (item.type === "worship_set") {
    const dateText = parseLocalDate(item.set.date).toLocaleDateString(
      language === "ko" ? "ko-KR" : "en-US"
    );

    return (
      <div className="py-6 px-4 border-b">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 shrink-0">
            <Music className="w-6 h-6 text-primary" />
          </div>
          <div className="max-w-full">
            <p className="text-sm">
              <span className="text-foreground">{item.community.name}</span>
              {language === "ko" 
                ? ` "` 
                : ` "`
              }
              <span className="font-bold text-foreground">{item.set.service_name}</span>
              {` (`}
              <span className="font-bold text-foreground">{dateText}</span>
              {language === "ko" 
                ? `)` 
                : `)` 
              }
              {language === "ko" 
                ? ` 워십세트가 업데이트되었습니다.`
                : ` Worship Set was updated.`
              }
            </p>
            <div className="flex items-center gap-2 mt-2">
              <button 
                onClick={() => window.location.assign(`/band-view/${item.set.id}`)}
                className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary text-primary-foreground text-xs font-medium hover:opacity-80 transition-opacity"
              >
                {language === "ko" ? "더보기" : "Read More"}
              </button>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(item.created_at), {
                  addSuffix: true,
                  locale: language === "ko" ? ko : undefined,
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Calendar event notifications
  if (item.type === "calendar_event") {
    const dateText = parseLocalDate(item.event.event_date).toLocaleDateString(
      language === "ko" ? "ko-KR" : "en-US"
    );
    const timeText = item.event.start_time 
      ? ` ${item.event.start_time}` 
      : "";

    // Get event type label
    const eventTypeLabels: Record<string, { ko: string; en: string }> = {
      rehearsal: { ko: "연습", en: "Rehearsal" },
      meeting: { ko: "모임", en: "Meeting" },
      worship_service: { ko: "예배", en: "Worship Service" },
      other: { ko: "기타", en: "Other" },
    };
    const eventTypeLabel = eventTypeLabels[item.event.event_type] || eventTypeLabels.other;

    return (
      <div className="py-6 px-4 border-b">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-accent/10 shrink-0">
            <Calendar className="w-6 h-6 text-accent" />
          </div>
          <div className="max-w-full">
            <p className="text-sm">
              <span className="text-foreground">{item.community.name}</span>
              {language === "ko" 
                ? ` `
                : ` `
              }
              <span className="font-bold text-foreground">{item.event.title}</span>
              {` (`}
              <span className="font-bold text-foreground">{dateText}{timeText}</span>
              {`) `}
              {language === "ko" 
                ? `${eventTypeLabel.ko} 일정이 추가되었습니다.`
                : `${eventTypeLabel.en} event was added.`
              }
            </p>
            {item.event.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {item.event.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-xs">
                {language === "ko" ? eventTypeLabel.ko : eventTypeLabel.en}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(item.created_at), {
                  addSuffix: true,
                  locale: language === "ko" ? ko : undefined,
                })}
              </span>
            </div>
          </div>
        </div>
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
    const isOwnPost = user?.id === item.author?.id;
    const authorName = item.author?.full_name || t("common.deletedUser");
    const confirmMessage = isOwnPost 
      ? t("common.confirmDelete")
      : t("socialFeed.confirmDeleteOtherPost", { author: authorName });
    
    if (window.confirm(confirmMessage)) {
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
    
    // Calendar events are handled as early return above, not in renderContent
    return null;
  };

  const authorName = item.author?.full_name || t("common.deletedUser");
  const authorInitial = authorName.charAt(0) || "?";

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-col space-y-2">
          {/* First row: Avatar, Name, 3-dots */}
          <div className="flex items-center gap-3">
            {item.author?.id ? (
              <div
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => onProfileClick(item.author)}
              >
                <AvatarWithLevel
                  userId={item.author.id}
                  avatarUrl={item.author.avatar_url}
                  fallback={authorInitial}
                  size="md"
                  className="w-10 h-10"
                />
              </div>
            ) : (
              <Avatar className="w-10 h-10">
                <AvatarImage src={item.author?.avatar_url || ""} />
                <AvatarFallback>{authorInitial}</AvatarFallback>
              </Avatar>
            )}
            
            <p className="font-medium text-sm flex-1">{authorName}</p>

            {(user?.id === item.author?.id || isAdmin || isWorshipLeader) && item.type === "community_post" && item.author?.id && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {user?.id === item.author?.id && (
                      <DropdownMenuItem onClick={handleEdit}>
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
          
          {/* Second row: Timestamp and Community (separate lines, aligned left) */}
          <div className="space-y-0.5">
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(item.created_at), {
                addSuffix: true,
                locale: language === "ko" ? ko : undefined,
              })}
            </p>
            <p className="text-xs text-muted-foreground font-medium">
              {item.community.name}
            </p>
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

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useDeletePost, useToggleReaction, useTogglePinPost, type RoomPost } from "@/hooks/useRoomPosts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  MoreVertical, 
  Pin, 
  Trash2, 
  Heart, 
  Hand, 
  Church 
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { LanguageContext } from "@/contexts/LanguageContext";
import { useContext } from "react";
import type { Database } from "@/integrations/supabase/types";

type RoomReactionType = Database["public"]["Enums"]["room_reaction_type"];

interface RoomPostCardProps {
  post: RoomPost;
  roomId: string;
  isOwnRoom?: boolean;
}

const postTypeIcons: Record<string, string> = {
  prayer: "🙏",
  concern: "💭",
  note: "📝",
  testimony: "✨",
  general: "💬",
};

const postTypeColors: Record<string, string> = {
  prayer: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  concern: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  note: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  testimony: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  general: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
};

const reactionConfig: Record<RoomReactionType, { icon: typeof Heart; label: string; activeColor: string }> = {
  amen: { icon: Church, label: "Amen", activeColor: "text-purple-600" },
  praying: { icon: Hand, label: "Praying", activeColor: "text-blue-600" },
  like: { icon: Heart, label: "Like", activeColor: "text-red-600" },
};

export function RoomPostCard({ post, roomId, isOwnRoom = false }: RoomPostCardProps) {
  const { t } = useTranslation();
  const languageContext = useContext(LanguageContext);
  const language = languageContext?.language || "en";
  const { user } = useAuth();
  const deletePost = useDeletePost();
  const toggleReaction = useToggleReaction();
  const togglePin = useTogglePinPost();
  
  const isAuthor = user?.id === post.author_user_id;
  const canManage = isAuthor || isOwnRoom;
  
  const handleDelete = () => {
    if (confirm(t("common.confirmDelete"))) {
      deletePost.mutate({ postId: post.id, roomId });
    }
  };
  
  const handleTogglePin = () => {
    togglePin.mutate({ postId: post.id, roomId, isPinned: post.is_pinned });
  };
  
  const handleReaction = (reactionType: RoomReactionType, hasReacted: boolean) => {
    toggleReaction.mutate({ postId: post.id, roomId, reactionType, hasReacted });
  };
  
  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: language === "ko" ? ko : enUS,
  });
  
  return (
    <Card className={post.is_pinned ? "border-primary/50 bg-primary/5" : ""}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.author?.avatar_url || undefined} />
              <AvatarFallback>
                {post.author?.full_name?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                  {post.author?.full_name || t("common.deletedUser")}
                </span>
                <Badge variant="outline" className={postTypeColors[post.post_type]}>
                  {postTypeIcons[post.post_type]} {t(`rooms.postTypes.${post.post_type}`)}
                </Badge>
                {post.is_pinned && (
                  <Badge variant="secondary" className="text-xs">
                    <Pin className="h-3 w-3 mr-1" />
                    {t("rooms.pinned")}
                  </Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
            </div>
          </div>
          
          {canManage && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isOwnRoom && (
                  <DropdownMenuItem onClick={handleTogglePin}>
                    <Pin className="h-4 w-4 mr-2" />
                    {post.is_pinned ? t("rooms.unpin") : t("rooms.pin")}
                  </DropdownMenuItem>
                )}
                {isAuthor && (
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t("common.delete")}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      
      <CardContent>
        <p className="whitespace-pre-wrap">{post.content}</p>
      </CardContent>
      
      <CardFooter className="pt-0">
        <div className="flex items-center gap-2">
          {(Object.entries(reactionConfig) as [RoomReactionType, typeof reactionConfig.amen][]).map(([type, config]) => {
            const reaction = post.reactions?.find(r => r.reaction_type === type);
            const count = reaction?.count || 0;
            const hasReacted = reaction?.user_reacted || false;
            const Icon = config.icon;
            
            return (
              <Button
                key={type}
                variant="ghost"
                size="sm"
                className={`h-8 gap-1 ${hasReacted ? config.activeColor : ""}`}
                onClick={() => handleReaction(type, hasReacted)}
              >
                <Icon className={`h-4 w-4 ${hasReacted ? "fill-current" : ""}`} />
                {count > 0 && <span className="text-xs">{count}</span>}
              </Button>
            );
          })}
        </div>
      </CardFooter>
    </Card>
  );
}

import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useToggleReaction, type RoomPost } from "@/hooks/useRoomPosts";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, Hand, Church, Crown, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import type { Database } from "@/integrations/supabase/types";

type RoomReactionType = Database["public"]["Enums"]["room_reaction_type"];

interface StudioFeedCardProps {
  post: RoomPost & { 
    author?: { 
      id: string; 
      full_name: string | null; 
      avatar_url: string | null;
      is_ambassador?: boolean | null;
    };
    room?: { id: string; owner_user_id: string };
  };
  onStudioClick?: () => void;
}

const postTypeIcons: Record<string, string> = {
  prayer: "🙏",
  concern: "💭",
  note: "📝",
  testimony: "✨",
  general: "💬",
};

const postTypeColors: Record<string, string> = {
  prayer: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  concern: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
  note: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  testimony: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  general: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
};

const reactionConfig: Record<RoomReactionType, { icon: typeof Heart; label: string; activeColor: string }> = {
  amen: { icon: Church, label: "Amen", activeColor: "text-purple-600" },
  praying: { icon: Hand, label: "Praying", activeColor: "text-blue-600" },
  like: { icon: Heart, label: "Like", activeColor: "text-red-600" },
};

export function StudioFeedCard({ post, onStudioClick }: StudioFeedCardProps) {
  const { language } = useTranslation();
  const { user } = useAuth();
  const toggleReaction = useToggleReaction();
  
  const handleReaction = (reactionType: RoomReactionType, hasReacted: boolean) => {
    toggleReaction.mutate({ 
      postId: post.id, 
      roomId: post.room_id, 
      reactionType, 
      hasReacted 
    });
  };
  
  const timeAgo = formatDistanceToNow(new Date(post.created_at), {
    addSuffix: true,
    locale: language === "ko" ? ko : enUS,
  });
  
  const isAmbassador = post.author?.is_ambassador;
  
  return (
    <Card className="overflow-hidden">
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
                <span className="font-medium text-sm">
                  {post.author?.full_name || (language === "ko" ? "알 수 없음" : "Unknown")}
                </span>
                {isAmbassador && (
                  <Crown className="h-3.5 w-3.5 text-amber-500" />
                )}
              </div>
              <span className="text-xs text-muted-foreground">{timeAgo}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={postTypeColors[post.post_type] || postTypeColors.general}>
              {postTypeIcons[post.post_type] || "💬"} 
              <span className="ml-1 hidden sm:inline">
                {language === "ko" 
                  ? { prayer: "기도", concern: "고민", note: "노트", testimony: "간증", general: "일반" }[post.post_type]
                  : post.post_type}
              </span>
            </Badge>
            
            {onStudioClick && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onStudioClick}
                className="text-xs text-muted-foreground h-7"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                {language === "ko" ? "스튜디오" : "Studio"}
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="py-3">
        <p className="whitespace-pre-wrap text-sm">{post.content}</p>
      </CardContent>
      
      <CardFooter className="pt-0 border-t border-border/50">
        <div className="flex items-center gap-1 pt-2">
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
                className={`h-8 gap-1.5 ${hasReacted ? config.activeColor : ""}`}
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

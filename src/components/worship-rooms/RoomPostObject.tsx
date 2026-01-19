import { RoomPost } from "@/hooks/useRoomPosts";
import { SlotPosition, getScaleByZone } from "./RoomSceneLayout";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Pin, Heart, HandHeart, MessageCircleHeart } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoomPostObjectProps {
  post: RoomPost;
  position: SlotPosition;
  onClick: () => void;
}

// Post type icons
const postTypeIcons: Record<string, string> = {
  prayer: '🙏',
  concern: '💭',
  note: '📝',
  testimony: '✨',
  general: '💬',
};

// Post styles by type
function getPostStyle(postType: string): string {
  switch (postType) {
    case 'prayer':
      return 'bg-purple-100 dark:bg-purple-900/40 border-purple-200 dark:border-purple-800';
    case 'concern':
      return 'bg-amber-50 dark:bg-amber-900/40 border-amber-200 dark:border-amber-800';
    case 'note':
      return 'bg-blue-50 dark:bg-blue-900/40 border-blue-200 dark:border-blue-800';
    case 'testimony':
      return 'bg-white dark:bg-slate-800 border-amber-400 dark:border-amber-600 border-2';
    default:
      return 'bg-stone-50 dark:bg-stone-800 border-stone-200 dark:border-stone-700';
  }
}

// Helper to get reaction count from reactions array
function getReactionCount(reactions: RoomPost['reactions'], type: string): number {
  return reactions?.find(r => r.reaction_type === type)?.count || 0;
}

export function RoomPostObject({ post, position, onClick }: RoomPostObjectProps) {
  const scale = getScaleByZone(position.zone);
  const amenCount = getReactionCount(post.reactions, 'amen');
  const prayingCount = getReactionCount(post.reactions, 'praying');
  const likeCount = getReactionCount(post.reactions, 'like');
  const hasReactions = amenCount + prayingCount + likeCount > 0;
  
  return (
    <div 
      className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer 
                 transition-all duration-200 hover:scale-110 hover:z-50 group"
      style={{ 
        left: position.x, 
        top: position.y,
        zIndex: position.zIndex,
        transform: `translate(-50%, -50%) scale(${scale}) rotate(${position.rotation}deg)`,
      }}
      onClick={onClick}
    >
      {/* Post card */}
      <div 
        className={cn(
          "relative p-3 rounded-lg border shadow-md min-w-[100px] max-w-[140px]",
          "transition-shadow group-hover:shadow-xl",
          getPostStyle(post.post_type)
        )}
      >
        {/* Pin indicator */}
        {post.is_pinned && (
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-red-500">
            <Pin className="h-5 w-5 fill-current" />
          </div>
        )}
        
        {/* Post type icon */}
        <span className="absolute -top-2 -right-2 text-base bg-white dark:bg-slate-700 rounded-full p-0.5 shadow-sm">
          {postTypeIcons[post.post_type] || '💬'}
        </span>
        
        {/* Content preview */}
        <p className="text-xs font-medium line-clamp-3 text-foreground/90 leading-relaxed">
          {post.content}
        </p>
        
        {/* Reactions indicator */}
        {hasReactions && (
          <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground">
            {amenCount > 0 && (
              <span className="flex items-center gap-0.5">
                <MessageCircleHeart className="h-3 w-3" />
                {amenCount}
              </span>
            )}
            {prayingCount > 0 && (
              <span className="flex items-center gap-0.5">
                <HandHeart className="h-3 w-3" />
                {prayingCount}
              </span>
            )}
            {likeCount > 0 && (
              <span className="flex items-center gap-0.5">
                <Heart className="h-3 w-3" />
                {likeCount}
              </span>
            )}
          </div>
        )}
        
        {/* Author avatar */}
        <Avatar className="absolute -bottom-2 -left-2 h-6 w-6 border-2 border-white dark:border-slate-800 shadow-sm">
          <AvatarImage src={post.author?.avatar_url || undefined} />
          <AvatarFallback className="text-[10px]">
            {post.author?.full_name?.charAt(0) || '?'}
          </AvatarFallback>
        </Avatar>
      </div>
      
      {/* Floor shadow */}
      <div 
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-[80%] h-2 
                   bg-black/10 rounded-full blur-sm"
        style={{ 
          transform: `translateX(-50%) scaleY(${position.zone === 'floor' ? 0.6 : 0.4})` 
        }}
      />
    </div>
  );
}

import { RoomPost } from "@/hooks/useRoomPosts";
import { SlotPosition, getScaleByZone } from "./RoomSceneLayout";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Pin, Heart, HandHelping } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoomTalkBubbleProps {
  post: RoomPost;
  position: SlotPosition;
  onClick: () => void;
}

// Post type to bubble style mapping
const bubbleStyles: Record<string, { bg: string; border: string; tail: string }> = {
  prayer: { 
    bg: "bg-violet-100 dark:bg-violet-900/50", 
    border: "border-violet-300 dark:border-violet-700",
    tail: "border-violet-300 dark:border-violet-700 bg-violet-100 dark:bg-violet-900/50"
  },
  concern: { 
    bg: "bg-amber-100 dark:bg-amber-900/50", 
    border: "border-amber-300 dark:border-amber-700",
    tail: "border-amber-300 dark:border-amber-700 bg-amber-100 dark:bg-amber-900/50"
  },
  note: { 
    bg: "bg-blue-100 dark:bg-blue-900/50", 
    border: "border-blue-300 dark:border-blue-700",
    tail: "border-blue-300 dark:border-blue-700 bg-blue-100 dark:bg-blue-900/50"
  },
  testimony: { 
    bg: "bg-emerald-100 dark:bg-emerald-900/50", 
    border: "border-emerald-300 dark:border-emerald-700",
    tail: "border-emerald-300 dark:border-emerald-700 bg-emerald-100 dark:bg-emerald-900/50"
  },
  general: { 
    bg: "bg-slate-100 dark:bg-slate-800/50", 
    border: "border-slate-300 dark:border-slate-700",
    tail: "border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50"
  },
};

const postTypeEmoji: Record<string, string> = {
  prayer: "🙏",
  concern: "💭",
  note: "📝",
  testimony: "✨",
  general: "💬",
};

function getReactionCount(reactions: RoomPost['reactions'], type: string): number {
  if (!reactions || !Array.isArray(reactions)) return 0;
  const found = reactions.find(r => r.reaction_type === type);
  return found?.count || 0;
}

export function RoomTalkBubble({ post, position, onClick }: RoomTalkBubbleProps) {
  const style = bubbleStyles[post.post_type] || bubbleStyles.general;
  const scale = getScaleByZone(position.zone);
  const amenCount = getReactionCount(post.reactions, 'amen');
  const prayingCount = getReactionCount(post.reactions, 'praying');

  const authorInitials = post.author?.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  return (
    <div
      className="absolute cursor-pointer transition-all duration-200 hover:scale-110 hover:z-50 group"
      style={{
        left: position.x,
        top: position.y,
        transform: `translate(-50%, -50%) scale(${scale}) rotate(${position.rotation}deg)`,
        zIndex: position.zIndex,
      }}
      onClick={onClick}
    >
      {/* Talk bubble */}
      <div
        className={cn(
          "relative px-3 py-2 rounded-2xl border-2 shadow-lg max-w-[140px]",
          "transition-shadow group-hover:shadow-xl",
          style.bg,
          style.border
        )}
      >
        {/* Pinned indicator */}
        {post.is_pinned && (
          <Pin className="absolute -top-2 -right-2 h-4 w-4 text-primary fill-primary" />
        )}
        
        {/* Post type emoji badge */}
        <span className="absolute -top-2 -left-2 text-lg drop-shadow-sm">
          {postTypeEmoji[post.post_type] || "💬"}
        </span>
        
        {/* Content */}
        <p className="text-xs font-medium line-clamp-3 text-foreground/90 leading-snug pt-1">
          {post.content}
        </p>
        
        {/* Reactions */}
        {(amenCount > 0 || prayingCount > 0) && (
          <div className="flex items-center gap-2 mt-1.5 pt-1.5 border-t border-current/10">
            {amenCount > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <Heart className="h-2.5 w-2.5" /> {amenCount}
              </span>
            )}
            {prayingCount > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground">
                <HandHelping className="h-2.5 w-2.5" /> {prayingCount}
              </span>
            )}
          </div>
        )}
        
        {/* Bubble tail pointing down */}
        <div
          className={cn(
            "absolute -bottom-2 left-1/2 -translate-x-1/2",
            "w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px]",
            "border-l-transparent border-r-transparent",
            style.tail.includes("violet") && "border-t-violet-300 dark:border-t-violet-700",
            style.tail.includes("amber") && "border-t-amber-300 dark:border-t-amber-700",
            style.tail.includes("blue") && "border-t-blue-300 dark:border-t-blue-700",
            style.tail.includes("emerald") && "border-t-emerald-300 dark:border-t-emerald-700",
            style.tail.includes("slate") && "border-t-slate-300 dark:border-t-slate-700",
          )}
        />
      </div>
      
      {/* Author avatar below bubble */}
      <div className="flex justify-center mt-3">
        <Avatar className="h-6 w-6 border-2 border-background shadow-md">
          <AvatarImage src={post.author?.avatar_url || undefined} />
          <AvatarFallback className="text-[8px]">{authorInitials}</AvatarFallback>
        </Avatar>
      </div>
      
      {/* Floor shadow */}
      <div 
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-2 rounded-full bg-black/10 blur-sm"
        style={{ transform: `translateX(-50%) scale(${scale})` }}
      />
    </div>
  );
}

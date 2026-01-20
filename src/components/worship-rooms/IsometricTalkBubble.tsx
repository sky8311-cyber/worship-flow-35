import { RoomPost } from "@/hooks/useRoomPosts";
import { BUBBLE_ANCHOR, Z_LAYERS } from "./FloorSlots";
import { cn } from "@/lib/utils";

interface IsometricTalkBubbleProps {
  post: RoomPost;
  onClick?: () => void;
}

// Map post types to bubble styles
const BUBBLE_STYLES = {
  note: {
    bg: "bg-white",
    border: "border-slate-200",
    tailColor: "#FFFFFF",
  },
  prayer: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    tailColor: "#FAF5FF",
  },
  praise: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    tailColor: "#FFFBEB",
  },
  concern: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    tailColor: "#EFF6FF",
  },
};

const POST_TYPE_EMOJI: Record<string, string> = {
  note: "📝",
  prayer: "🙏",
  praise: "✨",
  concern: "💭",
};

/**
 * Talk bubble anchored above the avatar.
 * Shows the latest post as a speech bubble emanating from the character.
 */
export function IsometricTalkBubble({ post, onClick }: IsometricTalkBubbleProps) {
  const postType = post.post_type || "note";
  const style = BUBBLE_STYLES[postType as keyof typeof BUBBLE_STYLES] || BUBBLE_STYLES.note;
  const emoji = POST_TYPE_EMOJI[postType] || "📝";

  // Truncate content for display
  const displayContent = post.content.length > 60 
    ? post.content.substring(0, 60) + "..." 
    : post.content;

  return (
    <div
      className="absolute cursor-pointer animate-in fade-in-0 zoom-in-95 duration-300"
      style={{
        left: BUBBLE_ANCHOR.x,
        top: BUBBLE_ANCHOR.y,
        transform: 'translate(-50%, -100%)',
        zIndex: Z_LAYERS.TALK_BUBBLE,
      }}
      onClick={onClick}
    >
      {/* Speech bubble */}
      <div 
        className={cn(
          "relative px-4 py-3 rounded-2xl border-2 shadow-lg max-w-52",
          "hover:scale-105 transition-transform",
          style.bg,
          style.border
        )}
      >
        {/* Post type indicator */}
        <span className="absolute -top-2 -right-2 text-lg drop-shadow-sm">
          {emoji}
        </span>

        {/* Pinned indicator */}
        {post.is_pinned && (
          <span className="absolute -top-2 -left-2 text-sm">📌</span>
        )}

        {/* Content */}
        <p className="text-sm text-foreground leading-relaxed">
          {displayContent}
        </p>

        {/* Tail pointing to avatar */}
        <svg
          className="absolute left-1/2 -translate-x-1/2 -bottom-4"
          width="20"
          height="16"
          viewBox="0 0 20 16"
        >
          <path
            d="M0 0 L10 16 L20 0"
            fill={style.tailColor}
            stroke={style.border.replace('border-', '').replace('-200', '')}
            strokeWidth="2"
          />
        </svg>
      </div>
    </div>
  );
}

/**
 * Think bubble variant (cloud-like) for prayer/concern posts.
 */
export function IsometricThinkBubble({ post, onClick }: IsometricTalkBubbleProps) {
  const postType = post.post_type || "note";
  const style = BUBBLE_STYLES[postType as keyof typeof BUBBLE_STYLES] || BUBBLE_STYLES.note;
  const emoji = POST_TYPE_EMOJI[postType] || "💭";

  const displayContent = post.content.length > 50 
    ? post.content.substring(0, 50) + "..." 
    : post.content;

  return (
    <div
      className="absolute cursor-pointer animate-in fade-in-0 duration-500"
      style={{
        left: BUBBLE_ANCHOR.x,
        top: BUBBLE_ANCHOR.y - 10,
        transform: 'translate(-50%, -100%)',
        zIndex: Z_LAYERS.TALK_BUBBLE,
      }}
      onClick={onClick}
    >
      {/* Cloud bubble */}
      <div 
        className={cn(
          "relative px-4 py-3 rounded-3xl border-2 shadow-lg max-w-48",
          "hover:scale-105 transition-transform",
          style.bg,
          style.border
        )}
        style={{
          borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
        }}
      >
        <span className="absolute -top-2 -right-2 text-lg drop-shadow-sm">
          {emoji}
        </span>

        <p className="text-sm text-foreground/90 leading-relaxed text-center italic">
          {displayContent}
        </p>
      </div>

      {/* Think bubble circles leading to avatar */}
      <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 flex flex-col items-center gap-1">
        <div className={cn("w-3 h-3 rounded-full border", style.bg, style.border)} />
        <div className={cn("w-2 h-2 rounded-full border", style.bg, style.border)} />
        <div className={cn("w-1.5 h-1.5 rounded-full border", style.bg, style.border)} />
      </div>
    </div>
  );
}

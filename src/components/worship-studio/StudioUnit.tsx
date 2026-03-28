import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface StudioUnitProps {
  avatarUrl?: string;
  studioName: string;
  ownerName: string;
  roomId: string;
  hasUnseenStory: boolean;
  variant: "penthouse" | "friend" | "ambassador";
  onStoryClick: () => void;
  onVisit: () => void;
}

export function StudioUnit({
  avatarUrl,
  studioName,
  ownerName,
  hasUnseenStory,
  variant,
  onStoryClick,
  onVisit,
}: StudioUnitProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 py-2 px-3 transition-colors",
        variant === "penthouse" && "bg-amber-50/70 dark:bg-amber-950/20 border-l-2 border-[#b8902a]",
        variant === "ambassador" && "bg-muted/30",
        variant === "friend" && "hover:bg-muted/40"
      )}
    >
      {/* Story circle */}
      <button onClick={onStoryClick} className="flex-shrink-0">
        <Avatar
          className={cn(
            "h-8 w-8 ring-2 ring-offset-1 ring-offset-background transition-all",
            hasUnseenStory ? "ring-[#b8902a]" : "ring-transparent"
          )}
        >
          <AvatarImage src={avatarUrl} />
          <AvatarFallback className="text-[10px]">
            {variant === "ambassador" && "✦"}
            {variant !== "ambassador" && (ownerName?.charAt(0) || "?")}
          </AvatarFallback>
        </Avatar>
      </button>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate text-foreground">
          {variant === "ambassador" && <span className="text-[#b8902a] mr-0.5">✦</span>}
          {studioName}
        </p>
        <p className="text-[10px] text-muted-foreground truncate">{ownerName}</p>
      </div>

      {/* Visit button */}
      <button
        onClick={(e) => { e.stopPropagation(); onVisit(); }}
        className="text-[10px] h-6 px-2 rounded text-[#b8902a] hover:bg-[#b8902a]/10 transition-colors flex-shrink-0 font-medium"
      >
        방문
      </button>
    </div>
  );
}

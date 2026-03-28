import { useMemo } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export interface StudioUnitProps {
  avatarUrl?: string;
  studioName: string;
  ownerName: string;
  roomId: string;
  hasUnseenStory: boolean;
  variant: "penthouse" | "friend" | "ambassador";
  collapsed?: boolean;
  compact?: boolean;
  placeholderInitials?: string;
  forceWindowsOn?: boolean;
  onStoryClick: () => void;
  onVisit: () => void;
}


const visitConfig = {
  penthouse: {
    classes: "bg-amber-100 hover:bg-amber-200 border-amber-300 text-amber-800",
    icon: "🔔",
    label: "방문",
  },
  friend: {
    classes: "bg-sky-50 hover:bg-sky-100 border-sky-200 text-sky-700",
    icon: "🚪",
    label: "방문",
  },
  ambassador: {
    classes: "bg-violet-50 hover:bg-violet-100 border-violet-200 text-violet-700",
    icon: "✦",
    label: "방문",
  },
};

export function StudioUnit({
  avatarUrl,
  studioName,
  ownerName,
  hasUnseenStory,
  variant,
  collapsed = false,
  compact = false,
  placeholderInitials,
  forceWindowsOn,
  onStoryClick,
  onVisit,
}: StudioUnitProps) {
  const visit = visitConfig[variant];

  if (collapsed) {
    return (
      <div className="flex justify-center py-2">
        <button onClick={onStoryClick} className="flex-shrink-0">
          <Avatar
            className={cn(
              "h-8 w-8 ring-2 ring-offset-1 ring-offset-background transition-all",
              hasUnseenStory ? "ring-[#b8902a]" : "ring-transparent"
            )}
          >
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className={cn("text-[10px]", placeholderInitials && variant === "ambassador" && "bg-indigo-100 text-indigo-400", placeholderInitials && variant === "friend" && "bg-slate-200 text-slate-500")}>
              {placeholderInitials || (variant === "ambassador" ? "✦" : (ownerName?.charAt(0) || "?"))}
            </AvatarFallback>
          </Avatar>
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center gap-1.5 transition-colors",
        compact ? "py-1 px-1.5" : "py-1.5 px-2",
        variant === "penthouse" && "bg-gradient-to-b from-sky-50/60 to-amber-50/70 border-t-2 border-[#b8902a]",
        variant === "ambassador" && "bg-muted/30",
        variant === "friend" && "hover:bg-muted/40"
      )}
    >
      <button onClick={onStoryClick} className="flex-shrink-0">
        <Avatar
          className={cn(
            "ring-2 ring-offset-1 ring-offset-background transition-all",
            compact ? "h-7 w-7" : "h-7 w-7",
            hasUnseenStory ? "ring-[#b8902a]" : "ring-transparent"
          )}
        >
          <AvatarImage src={avatarUrl} />
          <AvatarFallback className={cn("text-[10px]", placeholderInitials && variant === "ambassador" && "bg-indigo-100 text-indigo-400", placeholderInitials && variant === "friend" && "bg-slate-200 text-slate-500")}>
            {placeholderInitials || (variant === "ambassador" ? "✦" : (ownerName?.charAt(0) || "?"))}
          </AvatarFallback>
        </Avatar>
      </button>

      <div className="flex-1 min-w-0">
        <p className={cn("font-medium truncate text-foreground", compact ? "text-[11px]" : "text-xs")}>
          {variant === "ambassador" && <span className="text-violet-500 mr-0.5">✦</span>}
          {studioName}
        </p>
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onVisit(); }}
        className={cn(
          "h-6 px-2 shrink-0 rounded-full border text-[10px] font-medium inline-flex items-center gap-0.5 whitespace-nowrap transition-colors",
          visit.classes
        )}
      >
        <span className="text-[9px]">{visit.icon}</span>
        {visit.label}
      </button>
    </div>
  );
}

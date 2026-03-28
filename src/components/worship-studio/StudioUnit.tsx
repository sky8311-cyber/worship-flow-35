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
  placeholderInitials?: string;
  forceWindowsOn?: boolean;
  onStoryClick: () => void;
  onVisit: () => void;
}

function WindowLights({ variant, forceOn }: { variant: StudioUnitProps["variant"]; forceOn?: boolean }) {
  const colors = useMemo(() => {
    if (variant === "penthouse") return ["bg-amber-300", "bg-amber-200"];
    if (variant === "ambassador") return ["bg-violet-100", "bg-violet-50"];
    if (forceOn !== undefined) {
      return forceOn ? ["bg-amber-200", "bg-amber-100"] : ["bg-slate-200", "bg-slate-100"];
    }
    const lit = Math.random() > 0.4;
    return lit ? ["bg-amber-200", "bg-amber-100"] : ["bg-slate-200", "bg-slate-100"];
  }, [variant, forceOn]);

  return (
    <div className="flex gap-0.5 ml-auto shrink-0 self-start mt-1 select-none pointer-events-none">
      <div className={cn("w-2 h-1.5 rounded-sm", colors[0])} />
      <div className={cn("w-2 h-1.5 rounded-sm", colors[1])} />
    </div>
  );
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
            <AvatarFallback className="text-[10px]">
              {variant === "ambassador" ? "✦" : (ownerName?.charAt(0) || "?")}
            </AvatarFallback>
          </Avatar>
        </button>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "py-2 px-2 transition-colors",
        variant === "penthouse" && "bg-gradient-to-b from-sky-50/60 to-amber-50/70 border-t-2 border-[#b8902a]",
        variant === "ambassador" && "bg-muted/30",
        variant === "friend" && "hover:bg-muted/40"
      )}
    >
      {/* Top row: avatar + info + windows */}
      <div className="flex items-center gap-2">
        <button onClick={onStoryClick} className="flex-shrink-0">
          <Avatar
            className={cn(
              "h-8 w-8 ring-2 ring-offset-1 ring-offset-background transition-all",
              hasUnseenStory ? "ring-[#b8902a]" : "ring-transparent"
            )}
          >
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="text-[10px]">
              {variant === "ambassador" ? "✦" : (ownerName?.charAt(0) || "?")}
            </AvatarFallback>
          </Avatar>
        </button>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate text-foreground">
            {variant === "ambassador" && <span className="text-violet-500 mr-0.5">✦</span>}
            {studioName}
          </p>
          <p className="text-[10px] text-muted-foreground truncate">{ownerName}</p>
        </div>

        <WindowLights variant={variant} />
      </div>

      {/* Visit pill button */}
      <button
        onClick={(e) => { e.stopPropagation(); onVisit(); }}
        className={cn(
          "w-full py-1 mt-1.5 rounded-full border text-xs font-medium flex items-center justify-center gap-1 transition-colors",
          visit.classes
        )}
      >
        <span className="text-[10px]">{visit.icon}</span>
        {visit.label}
      </button>
    </div>
  );
}

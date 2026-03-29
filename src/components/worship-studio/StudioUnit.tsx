import { useState } from "react";
import { cn } from "@/lib/utils";
import { DoorClosed, DoorOpen } from "lucide-react";

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

const windowFrame = "rounded-sm border border-[#8a7a6a] shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]";

const visitBg: Record<string, string> = {
  penthouse: "bg-amber-50 hover:bg-amber-100",
  friend: "bg-sky-50 hover:bg-sky-100",
  ambassador: "bg-violet-50 hover:bg-violet-100",
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
  onStoryClick,
  onVisit,
}: StudioUnitProps) {
  if (collapsed) {
    return (
      <div className="flex justify-center py-1">
        <button onClick={onStoryClick} className="flex-shrink-0">
          <div className={cn("w-8 h-8 overflow-hidden flex items-center justify-center bg-white", windowFrame, hasUnseenStory && "ring-2 ring-[#b8902a] ring-offset-1")}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className={cn("text-[10px] font-medium", variant === "ambassador" ? "text-indigo-400" : "text-slate-500")}>
                {placeholderInitials || ownerName?.charAt(0) || "?"}
              </span>
            )}
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1 px-1 bg-[#d4c5a9]/20", compact ? "py-0.5" : "py-1")}>
      {/* Avatar window */}
      <button onClick={onStoryClick} className="flex-shrink-0">
        <div className={cn("w-8 h-8 overflow-hidden flex items-center justify-center bg-white", windowFrame, hasUnseenStory && "ring-2 ring-[#b8902a] ring-offset-1")}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className={cn("text-[10px] font-medium", variant === "ambassador" ? "text-indigo-400" : "text-slate-500")}>
              {placeholderInitials || (variant === "ambassador" ? "✦" : (ownerName?.charAt(0) || "?"))}
            </span>
          )}
        </div>
      </button>

      {/* Name window */}
      <div className={cn("flex-1 h-8 min-w-0 flex items-center px-1.5 bg-white/80", windowFrame)}>
        <p className="text-[11px] font-medium truncate text-foreground">
          {variant === "ambassador" && <span className="text-violet-500 mr-0.5">✦</span>}
          {studioName}
        </p>
      </div>

      {/* Visit button window — door icon with hover animation */}
      <VisitDoorButton variant={variant} onVisit={onVisit} />
    </div>
  );
}

function VisitDoorButton({ variant, onVisit }: { variant: string; onVisit: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onVisit(); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn("w-10 h-8 shrink-0 flex items-center justify-center transition-colors", windowFrame, visitBg[variant])}
    >
      <div className="transition-transform duration-200" style={{ transform: hovered ? "scale(1.15)" : "scale(1)" }}>
        {hovered ? (
          <DoorOpen className="h-4 w-4 text-foreground" />
        ) : (
          <DoorClosed className="h-4 w-4 text-muted-foreground" />
        )}
      </div>
    </button>
  );
}

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

/* Dark brown atelier window frame */
const windowFrame = "rounded-[2px] border-[1.5px] border-[#3a2f28] shadow-[inset_0_0_6px_rgba(245,190,80,0.15)]";

/* Warm amber glow background for windows */
const windowGlow = "bg-gradient-to-b from-amber-50/80 via-amber-100/40 to-amber-50/60";

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
          <div className={cn("w-8 h-10 overflow-hidden flex items-center justify-center", windowFrame, windowGlow, hasUnseenStory && "ring-2 ring-[#b8902a] ring-offset-1")}>
            {avatarUrl ? (
              <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className={cn("text-[10px] font-medium", variant === "ambassador" ? "text-indigo-400" : "text-[#5a4a3a]")}>
                {placeholderInitials || ownerName?.charAt(0) || "?"}
              </span>
            )}
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className={cn("flex items-center gap-1 px-1", compact ? "py-0.5" : "py-1")}>
      {/* Avatar window — tall atelier proportions */}
      <button onClick={onStoryClick} className="flex-shrink-0">
        <div className={cn("w-8 h-10 overflow-hidden flex items-center justify-center", windowFrame, windowGlow, hasUnseenStory && "ring-2 ring-[#b8902a] ring-offset-1")}>
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className={cn("text-[10px] font-medium", variant === "ambassador" ? "text-indigo-400" : "text-[#5a4a3a]")}>
              {placeholderInitials || (variant === "ambassador" ? "✦" : (ownerName?.charAt(0) || "?"))}
            </span>
          )}
        </div>
      </button>

      {/* Name window */}
      <div className={cn("flex-1 h-10 min-w-0 flex items-center px-1.5", windowFrame, windowGlow)}>
        <p className="text-[11px] font-medium truncate text-foreground">
          {variant === "ambassador" && <span className="text-violet-500 mr-0.5">✦</span>}
          {studioName}
        </p>
      </div>

      {/* Visit button window — door icon */}
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
      className={cn(
        "w-10 h-10 shrink-0 flex items-center justify-center transition-colors",
        windowFrame,
        windowGlow,
        "hover:bg-amber-100/80"
      )}
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

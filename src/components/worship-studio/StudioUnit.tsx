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
const windowFrame = "rounded-[4px] border-[1.5px] border-[#5a7a8a] shadow-[inset_0_0_6px_rgba(180,210,230,0.2)]";

/* Warm amber glow background for windows */
const windowGlow = "bg-gradient-to-b from-[#fff8e8] via-[#fff3d6] to-[#fff8e8]";

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
  /* Compact sizes for 2F/1F; penthouse keeps original size */
  const isPenthouse = variant === "penthouse";
  const h = compact && !isPenthouse ? "h-7" : "h-10";
  const avatarW = compact && !isPenthouse ? "w-7" : "w-8";
  const avatarH = compact && !isPenthouse ? "h-7" : "h-10";
  const visitSize = compact && !isPenthouse ? "w-7 h-7" : "w-10 h-10";
  const iconSize = compact && !isPenthouse ? "h-3 w-3" : "h-4 w-4";
  const fontSize = compact && !isPenthouse ? "text-[9px]" : "text-[11px]";

  if (collapsed) {
    return (
      <div className="flex justify-center py-0.5">
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
    <div className={cn("flex items-center gap-0.5 px-1 py-[2px]")}>
      {/* Avatar window */}
      <button onClick={onStoryClick} className="flex-shrink-0">
        <div className={cn(avatarW, avatarH, "overflow-hidden flex items-center justify-center", windowFrame, windowGlow, hasUnseenStory && "ring-2 ring-[#b8902a] ring-offset-1")}>
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
      <div className={cn("flex-1 min-w-0 flex items-center px-1.5", h, windowFrame, windowGlow)}>
        <p className={cn(fontSize, "font-medium truncate text-foreground")}>
          {variant === "ambassador" && <span className="text-violet-500 mr-0.5">✦</span>}
          {studioName}
        </p>
      </div>

      {/* Visit button window */}
      <VisitDoorButton variant={variant} onVisit={onVisit} compact={compact && !isPenthouse} />
    </div>
  );
}

function VisitDoorButton({ variant, onVisit, compact }: { variant: string; onVisit: () => void; compact?: boolean }) {
  const [hovered, setHovered] = useState(false);
  const size = compact ? "w-7 h-7" : "w-10 h-10";
  const iconSize = compact ? "h-3 w-3" : "h-4 w-4";
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onVisit(); }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        size,
        "shrink-0 flex items-center justify-center transition-colors",
        windowFrame,
        windowGlow,
        "hover:bg-amber-100/80"
      )}
    >
      <div className="transition-transform duration-200" style={{ transform: hovered ? "scale(1.15)" : "scale(1)" }}>
        {hovered ? (
          <DoorOpen className={cn(iconSize, "text-foreground")} />
        ) : (
          <DoorClosed className={cn(iconSize, "text-muted-foreground")} />
        )}
      </div>
    </button>
  );
}

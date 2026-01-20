import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Crown } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoomMiniAvatarProps {
  owner: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    is_ambassador: boolean | null;
  };
}

export function RoomMiniAvatar({ owner }: RoomMiniAvatarProps) {
  const initials = owner.full_name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-1">
      {/* Avatar with glow effect */}
      <div className="relative">
        {/* Shadow on floor */}
        <div 
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-3 rounded-full bg-black/20 blur-sm"
        />
        
        {/* Avatar container with bounce animation */}
        <div className="relative animate-bounce-slow">
          {/* Ambassador crown */}
          {owner.is_ambassador && (
            <Crown className="absolute -top-4 left-1/2 -translate-x-1/2 h-5 w-5 text-yellow-500 fill-yellow-400" />
          )}
          
          <Avatar className={cn(
            "h-14 w-14 border-3 shadow-lg",
            owner.is_ambassador 
              ? "border-yellow-400 ring-2 ring-yellow-400/50" 
              : "border-background"
          )}>
            <AvatarImage src={owner.avatar_url || undefined} alt={owner.full_name || ""} />
            <AvatarFallback className="text-lg font-semibold bg-primary/20">
              {initials}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
      
      {/* Name tag */}
      <div className={cn(
        "px-3 py-1 rounded-full text-xs font-medium shadow-md",
        "bg-background/90 backdrop-blur-sm border",
        owner.is_ambassador && "bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-950/50 dark:to-amber-950/50"
      )}>
        {owner.full_name || "Anonymous"}
      </div>
    </div>
  );
}

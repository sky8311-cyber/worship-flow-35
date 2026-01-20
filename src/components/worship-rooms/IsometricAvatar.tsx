import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AVATAR_POSITION, Z_LAYERS } from "./FloorSlots";

interface IsometricAvatarProps {
  owner: {
    full_name: string | null;
    avatar_url: string | null;
  };
}

/**
 * Mini avatar positioned at fixed location on the room floor.
 * Anchored to feet for proper grounding in the isometric space.
 */
export function IsometricAvatar({ owner }: IsometricAvatarProps) {
  return (
    <div
      className="absolute flex flex-col items-center pointer-events-none"
      style={{
        left: AVATAR_POSITION.x,
        top: AVATAR_POSITION.y,
        transform: 'translate(-50%, -100%)',
        zIndex: Z_LAYERS.AVATAR,
      }}
    >
      {/* Character body placeholder */}
      <div className="relative">
        {/* Avatar circle */}
        <Avatar className="w-14 h-14 border-2 border-white shadow-lg">
          <AvatarImage 
            src={owner.avatar_url || '/placeholder.svg'} 
            alt={owner.full_name || 'Room Owner'} 
          />
          <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
            {owner.full_name?.charAt(0) || '?'}
          </AvatarFallback>
        </Avatar>

        {/* Simple body silhouette */}
        <div 
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-8 h-8 
                     bg-gradient-to-b from-primary/80 to-primary rounded-b-full"
          style={{ clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)' }}
        />
      </div>

      {/* Floor shadow */}
      <div 
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 
                   w-12 h-3 rounded-full bg-black/15 blur-sm"
      />

      {/* Name badge */}
      <div 
        className="mt-4 px-2 py-0.5 bg-background/90 backdrop-blur-sm 
                   rounded-full text-xs font-medium shadow-sm border max-w-24 truncate"
      >
        {owner.full_name || 'Anonymous'}
      </div>
    </div>
  );
}

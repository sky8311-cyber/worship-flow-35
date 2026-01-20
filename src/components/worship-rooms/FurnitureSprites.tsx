interface SpriteProps {
  width: number;
  height: number;
  className?: string;
}

/**
 * Collection of isometric furniture SVG sprites.
 * All sprites are designed in isometric style with consistent proportions.
 */

export function BedSprite({ width, height, className }: SpriteProps) {
  return (
    <svg viewBox="0 0 120 80" width={width} height={height} className={className}>
      {/* Bed frame base */}
      <rect x="5" y="45" width="110" height="30" fill="#8B4513" rx="3" />
      {/* Headboard */}
      <rect x="5" y="20" width="15" height="40" fill="#A0522D" rx="2" />
      {/* Mattress */}
      <rect x="20" y="35" width="90" height="20" fill="#FFFAF0" rx="2" />
      {/* Pillow */}
      <ellipse cx="35" cy="40" rx="12" ry="6" fill="#FFF8DC" />
      {/* Blanket */}
      <rect x="50" y="38" width="55" height="15" fill="#4169E1" rx="2" opacity="0.9" />
      {/* Blanket pattern */}
      <rect x="55" y="41" width="45" height="2" fill="#3151B0" rx="1" />
      <rect x="55" y="46" width="45" height="2" fill="#3151B0" rx="1" />
    </svg>
  );
}

export function DeskSprite({ width, height, className }: SpriteProps) {
  return (
    <svg viewBox="0 0 90 60" width={width} height={height} className={className}>
      {/* Desktop surface */}
      <rect x="5" y="15" width="80" height="8" fill="#D2691E" rx="1" />
      {/* Left leg */}
      <rect x="8" y="23" width="8" height="35" fill="#A0522D" />
      {/* Right leg */}
      <rect x="74" y="23" width="8" height="35" fill="#A0522D" />
      {/* Drawer */}
      <rect x="30" y="23" width="30" height="12" fill="#CD853F" rx="1" />
      <circle cx="45" cy="29" r="2" fill="#8B4513" />
      {/* Items on desk */}
      <rect x="15" y="8" width="12" height="8" fill="#4A4A4A" /> {/* Monitor */}
      <rect x="60" y="10" width="15" height="6" fill="#FFE4B5" /> {/* Papers */}
    </svg>
  );
}

export function ChairSprite({ width, height, className }: SpriteProps) {
  return (
    <svg viewBox="0 0 40 50" width={width} height={height} className={className}>
      {/* Seat */}
      <rect x="5" y="25" width="30" height="6" fill="#8B4513" rx="2" />
      {/* Back */}
      <rect x="8" y="5" width="24" height="22" fill="#A0522D" rx="2" />
      {/* Back cushion */}
      <rect x="10" y="8" width="20" height="16" fill="#CD5C5C" rx="2" />
      {/* Front legs */}
      <rect x="8" y="31" width="4" height="18" fill="#8B4513" />
      <rect x="28" y="31" width="4" height="18" fill="#8B4513" />
    </svg>
  );
}

export function PlantSprite({ width, height, className }: SpriteProps) {
  return (
    <svg viewBox="0 0 30 45" width={width} height={height} className={className}>
      {/* Pot */}
      <path d="M5,30 L8,45 L22,45 L25,30 Z" fill="#D2691E" />
      <ellipse cx="15" cy="30" rx="10" ry="3" fill="#CD853F" />
      {/* Soil */}
      <ellipse cx="15" cy="30" rx="8" ry="2" fill="#4A3728" />
      {/* Plant leaves */}
      <ellipse cx="15" cy="18" rx="8" ry="12" fill="#228B22" />
      <ellipse cx="10" cy="15" rx="5" ry="8" fill="#2E8B2E" />
      <ellipse cx="20" cy="15" rx="5" ry="8" fill="#2E8B2E" />
      <ellipse cx="15" cy="10" rx="4" ry="6" fill="#32CD32" />
    </svg>
  );
}

export function BookshelfSprite({ width, height, className }: SpriteProps) {
  return (
    <svg viewBox="0 0 70 100" width={width} height={height} className={className}>
      {/* Frame */}
      <rect x="5" y="5" width="60" height="90" fill="#8B4513" rx="2" />
      <rect x="8" y="8" width="54" height="84" fill="#DEB887" />
      {/* Shelves */}
      <rect x="8" y="30" width="54" height="4" fill="#A0522D" />
      <rect x="8" y="58" width="54" height="4" fill="#A0522D" />
      {/* Books row 1 */}
      <rect x="12" y="10" width="8" height="18" fill="#DC143C" />
      <rect x="22" y="12" width="6" height="16" fill="#4169E1" />
      <rect x="30" y="10" width="10" height="18" fill="#228B22" />
      <rect x="42" y="11" width="7" height="17" fill="#FFD700" />
      <rect x="51" y="10" width="8" height="18" fill="#8B008B" />
      {/* Books row 2 */}
      <rect x="12" y="36" width="10" height="20" fill="#FF6347" />
      <rect x="24" y="38" width="8" height="18" fill="#20B2AA" />
      <rect x="34" y="36" width="12" height="20" fill="#4682B4" />
      <rect x="48" y="37" width="10" height="19" fill="#DAA520" />
      {/* Books row 3 */}
      <rect x="12" y="64" width="7" height="24" fill="#9370DB" />
      <rect x="21" y="66" width="9" height="22" fill="#CD853F" />
      <rect x="32" y="64" width="8" height="24" fill="#5F9EA0" />
      <rect x="42" y="65" width="6" height="23" fill="#F08080" />
      <rect x="50" y="64" width="9" height="24" fill="#6B8E23" />
    </svg>
  );
}

export function LampSprite({ width, height, className }: SpriteProps) {
  return (
    <svg viewBox="0 0 25 60" width={width} height={height} className={className}>
      {/* Base */}
      <ellipse cx="12.5" cy="56" rx="10" ry="3" fill="#4A4A4A" />
      {/* Pole */}
      <rect x="11" y="25" width="3" height="32" fill="#696969" />
      {/* Shade */}
      <path d="M2,5 L5,25 L20,25 L23,5 Z" fill="#FFE4B5" />
      <ellipse cx="12.5" cy="5" rx="10.5" ry="3" fill="#FFD700" />
      {/* Light glow */}
      <ellipse cx="12.5" cy="15" rx="6" ry="8" fill="#FFFACD" opacity="0.5" />
    </svg>
  );
}

export function RugSprite({ width, height, className }: SpriteProps) {
  return (
    <svg viewBox="0 0 100 40" width={width} height={height} className={className}>
      {/* Main rug */}
      <ellipse cx="50" cy="20" rx="48" ry="18" fill="#8B0000" />
      {/* Inner pattern */}
      <ellipse cx="50" cy="20" rx="38" ry="14" fill="#CD5C5C" />
      <ellipse cx="50" cy="20" rx="28" ry="10" fill="#DC143C" />
      {/* Center design */}
      <ellipse cx="50" cy="20" rx="15" ry="6" fill="#FFD700" />
      <ellipse cx="50" cy="20" rx="8" ry="3" fill="#8B0000" />
      {/* Fringe effect */}
      <line x1="5" y1="20" x2="2" y2="20" stroke="#8B0000" strokeWidth="2" />
      <line x1="95" y1="20" x2="98" y2="20" stroke="#8B0000" strokeWidth="2" />
    </svg>
  );
}

export function FrameSprite({ width, height, className }: SpriteProps) {
  return (
    <svg viewBox="0 0 50 40" width={width} height={height} className={className}>
      {/* Outer frame */}
      <rect x="2" y="2" width="46" height="36" fill="#8B4513" rx="1" />
      {/* Inner frame */}
      <rect x="5" y="5" width="40" height="30" fill="#DEB887" />
      {/* Picture area */}
      <rect x="8" y="8" width="34" height="24" fill="#87CEEB" />
      {/* Simple landscape */}
      <path d="M8,28 L15,18 L22,24 L30,15 L42,28 Z" fill="#228B22" />
      <circle cx="38" cy="14" r="4" fill="#FFD700" />
    </svg>
  );
}

export function BookSprite({ width, height, className }: SpriteProps) {
  return (
    <svg viewBox="0 0 20 15" width={width} height={height} className={className}>
      {/* Book cover */}
      <rect x="2" y="2" width="16" height="11" fill="#8B4513" rx="1" />
      {/* Pages */}
      <rect x="4" y="3" width="12" height="9" fill="#FFFAF0" />
      {/* Spine */}
      <rect x="2" y="2" width="3" height="11" fill="#A0522D" />
      {/* Cross on cover */}
      <line x1="11" y1="5" x2="11" y2="10" stroke="#FFD700" strokeWidth="1.5" />
      <line x1="8" y1="7.5" x2="14" y2="7.5" stroke="#FFD700" strokeWidth="1.5" />
    </svg>
  );
}

export function ClockSprite({ width, height, className }: SpriteProps) {
  return (
    <svg viewBox="0 0 30 30" width={width} height={height} className={className}>
      {/* Clock frame */}
      <circle cx="15" cy="15" r="13" fill="#8B4513" />
      <circle cx="15" cy="15" r="11" fill="#FFFAF0" />
      {/* Hour markers */}
      <circle cx="15" cy="6" r="1" fill="#4A4A4A" />
      <circle cx="15" cy="24" r="1" fill="#4A4A4A" />
      <circle cx="6" cy="15" r="1" fill="#4A4A4A" />
      <circle cx="24" cy="15" r="1" fill="#4A4A4A" />
      {/* Hands */}
      <line x1="15" y1="15" x2="15" y2="8" stroke="#4A4A4A" strokeWidth="2" />
      <line x1="15" y1="15" x2="20" y2="15" stroke="#4A4A4A" strokeWidth="1.5" />
      {/* Center */}
      <circle cx="15" cy="15" r="2" fill="#DC143C" />
    </svg>
  );
}

// Sprite component map
export const FURNITURE_SPRITES: Record<string, React.FC<SpriteProps>> = {
  "🛏️": BedSprite,
  "bed": BedSprite,
  "Cozy Bed": BedSprite,
  "🪑": ChairSprite,
  "chair": ChairSprite,
  "Comfortable Chair": ChairSprite,
  "📚": BookshelfSprite,
  "bookshelf": BookshelfSprite,
  "Bookshelf": BookshelfSprite,
  "🪴": PlantSprite,
  "plant": PlantSprite,
  "Plant Pot": PlantSprite,
  "🛋️": RugSprite,
  "rug": RugSprite,
  "Cozy Rug": RugSprite,
  "🖼️": FrameSprite,
  "frame": FrameSprite,
  "Picture Frame": FrameSprite,
  "📖": BookSprite,
  "book": BookSprite,
  "Holy Book": BookSprite,
  "🕰️": ClockSprite,
  "clock": ClockSprite,
  "Wall Clock": ClockSprite,
  "🪔": LampSprite,
  "lamp": LampSprite,
  "Floor Lamp": LampSprite,
  "📝": DeskSprite,
  "desk": DeskSprite,
  "Study Desk": DeskSprite,
};

export function getFurnitureSprite(imageUrl: string): React.FC<SpriteProps> | null {
  return FURNITURE_SPRITES[imageUrl] || null;
}

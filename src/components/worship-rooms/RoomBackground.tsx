import { ThemeConfig } from "@/hooks/useWorshipRoom";

interface RoomBackgroundProps {
  themeConfig: ThemeConfig | null;
}

// Get wall background based on theme
function getWallBackground(wallpaper?: string, backgroundColor?: string): string {
  if (backgroundColor) {
    return backgroundColor;
  }
  
  switch (wallpaper) {
    case 'nature':
      return 'linear-gradient(180deg, hsl(142 40% 92%) 0%, hsl(142 35% 88%) 100%)';
    case 'worship':
      return 'linear-gradient(180deg, hsl(210 50% 94%) 0%, hsl(210 45% 90%) 100%)';
    case 'minimal':
      return 'hsl(0 0% 98%)';
    case 'gradient':
      return 'linear-gradient(135deg, hsl(280 60% 92%) 0%, hsl(210 60% 92%) 100%)';
    default:
      return 'linear-gradient(180deg, hsl(30 30% 95%) 0%, hsl(30 25% 91%) 100%)';
  }
}

// Get floor texture based on theme
function getFloorTexture(floorStyle?: string): string {
  switch (floorStyle) {
    case 'marble':
      return 'linear-gradient(180deg, hsl(0 0% 88%) 0%, hsl(0 0% 82%) 100%)';
    case 'carpet':
      return 'hsl(30 25% 35%)';
    case 'stone':
      return 'linear-gradient(180deg, hsl(0 0% 75%) 0%, hsl(0 0% 65%) 100%)';
    default: // wood
      return 'linear-gradient(180deg, hsl(25 40% 45%) 0%, hsl(25 35% 35%) 100%)';
  }
}

// Wall pattern overlay
function WallPattern({ wallpaper }: { wallpaper?: string }) {
  if (wallpaper === 'worship') {
    return (
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute top-[15%] left-1/2 -translate-x-1/2 w-16 h-24 border-4 border-current" />
        <div className="absolute top-[15%] left-1/2 -translate-x-1/2 translate-y-4 w-10 h-4 border-4 border-current" />
      </div>
    );
  }
  
  if (wallpaper === 'nature') {
    return (
      <div className="absolute inset-0 opacity-[0.04]">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-8 h-8 rounded-full border-2 border-current"
            style={{
              left: `${15 + (i * 15)}%`,
              top: `${20 + (i % 3) * 15}%`,
            }}
          />
        ))}
      </div>
    );
  }
  
  return null;
}

// Floor wood planks pattern
function FloorPattern({ floorStyle }: { floorStyle?: string }) {
  if (floorStyle === 'wood' || !floorStyle) {
    return (
      <div className="absolute inset-0 opacity-20">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute h-[1px] bg-black/30 w-full"
            style={{ top: `${12 + i * 12}%` }}
          />
        ))}
      </div>
    );
  }
  
  if (floorStyle === 'stone') {
    return (
      <div className="absolute inset-0 opacity-10">
        <div className="grid grid-cols-6 h-full">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="border border-black/20" />
          ))}
        </div>
      </div>
    );
  }
  
  return null;
}

export function RoomBackground({ themeConfig }: RoomBackgroundProps) {
  const wallpaper = themeConfig?.wallpaper;
  const floorStyle = themeConfig?.floorStyle;
  const backgroundColor = themeConfig?.backgroundColor;
  
  return (
    <div className="absolute inset-0 flex flex-col">
      {/* Wall section (65% height) */}
      <div 
        className="flex-1 relative overflow-hidden"
        style={{ 
          background: getWallBackground(wallpaper, backgroundColor),
          minHeight: '65%',
        }}
      >
        <WallPattern wallpaper={wallpaper} />
        
        {/* Wall-floor transition shadow */}
        <div className="absolute bottom-0 left-0 right-0 h-4 bg-gradient-to-t from-black/10 to-transparent" />
      </div>
      
      {/* Floor section (35% height) */}
      <div 
        className="relative overflow-hidden"
        style={{ 
          background: getFloorTexture(floorStyle),
          height: '35%',
        }}
      >
        <FloorPattern floorStyle={floorStyle} />
        
        {/* Perspective gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/15 to-black/30" />
      </div>
    </div>
  );
}

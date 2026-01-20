import { ThemeConfig } from "@/hooks/useWorshipRoom";

interface IsometricRoomSVGProps {
  themeConfig?: ThemeConfig | null;
}

// Theme presets for room designs
const ROOM_THEMES = {
  default: {
    backWall: "#F5F0E8",
    sideWall: "#E8E3DB",
    floor: "#C4A574",
    floorPattern: "#B89860",
  },
  cyworld: {
    backWall: "#E8F4FC",
    sideWall: "#D4E8F5",
    floor: "#FFCCE0",
    floorPattern: "#FFB8D4",
  },
  chapel: {
    backWall: "#FFF8E7",
    sideWall: "#F5EED8",
    floor: "#D4CFC4",
    floorPattern: "#C5C0B5",
  },
  nature: {
    backWall: "#E8F5E9",
    sideWall: "#C8E6C9",
    floor: "#8BC34A",
    floorPattern: "#7CB342",
  },
  modern: {
    backWall: "#FFFFFF",
    sideWall: "#F5F5F5",
    floor: "#9E9E9E",
    floorPattern: "#8E8E8E",
  },
  worship: {
    backWall: "#F3E5F5",
    sideWall: "#E1BEE7",
    floor: "#CE93D8",
    floorPattern: "#BA68C8",
  },
};

type ThemeKey = keyof typeof ROOM_THEMES;

function getThemeKey(wallpaper?: string): ThemeKey {
  if (wallpaper && wallpaper in ROOM_THEMES) {
    return wallpaper as ThemeKey;
  }
  return "default";
}

/**
 * Isometric 2.5D room background using SVG.
 * Consists of three planes: back wall, side wall, and floor.
 * Creates depth illusion through angled planes and layering.
 */
export function IsometricRoomSVG({ themeConfig }: IsometricRoomSVGProps) {
  const themeKey = getThemeKey(themeConfig?.wallpaper);
  const theme = ROOM_THEMES[themeKey];

  return (
    <svg
      viewBox="0 0 800 500"
      className="absolute inset-0 w-full h-full"
      preserveAspectRatio="none"
    >
      <defs>
        {/* Floor grid pattern */}
        <pattern
          id="floorGrid"
          width="60"
          height="30"
          patternUnits="userSpaceOnUse"
          patternTransform="skewX(-15)"
        >
          <rect width="60" height="30" fill={theme.floor} />
          <rect width="30" height="15" fill={theme.floorPattern} />
          <rect x="30" y="15" width="30" height="15" fill={theme.floorPattern} />
        </pattern>

        {/* Wallpaper subtle pattern */}
        <pattern
          id="wallPattern"
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          <rect width="40" height="40" fill={theme.backWall} />
          <circle cx="20" cy="20" r="1" fill={theme.sideWall} opacity="0.3" />
        </pattern>

        {/* Gradient for wall depth */}
        <linearGradient id="wallGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={theme.backWall} />
          <stop offset="100%" stopColor={theme.sideWall} />
        </linearGradient>

        {/* Floor gradient for depth */}
        <linearGradient id="floorGradient" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={theme.floor} stopOpacity="0.9" />
          <stop offset="100%" stopColor={theme.floorPattern} />
        </linearGradient>
      </defs>

      {/* Back Wall - main rectangle */}
      <rect
        x="60"
        y="20"
        width="680"
        height="200"
        fill="url(#wallPattern)"
        stroke={theme.sideWall}
        strokeWidth="2"
      />

      {/* Left Side Wall - trapezoid for perspective */}
      <polygon
        points="0,100 60,20 60,220 0,350"
        fill={theme.sideWall}
        stroke={theme.sideWall}
        strokeWidth="1"
      />

      {/* Right Side Wall - trapezoid for perspective */}
      <polygon
        points="800,100 740,20 740,220 800,350"
        fill={theme.sideWall}
        stroke={theme.sideWall}
        strokeWidth="1"
      />

      {/* Floor - large trapezoid with grid pattern */}
      <polygon
        points="0,350 60,220 740,220 800,350 800,500 0,500"
        fill="url(#floorGrid)"
      />

      {/* Floor edge highlight */}
      <line
        x1="60"
        y1="220"
        x2="740"
        y2="220"
        stroke={theme.floorPattern}
        strokeWidth="3"
      />

      {/* Corner shadows for depth */}
      <polygon
        points="0,350 60,220 60,230 5,355"
        fill="rgba(0,0,0,0.1)"
      />
      <polygon
        points="800,350 740,220 740,230 795,355"
        fill="rgba(0,0,0,0.1)"
      />

      {/* Baseboard on back wall */}
      <rect
        x="60"
        y="210"
        width="680"
        height="10"
        fill={theme.floorPattern}
        opacity="0.7"
      />
    </svg>
  );
}

import { cn } from "@/lib/utils";

interface GothicArchTopProps {
  collapsed?: boolean;
  isMobile?: boolean;
}

/**
 * Gothic arch top for the Atelier building.
 * Uses two-layer SVG approach:
 * 1. Background fill with preserveAspectRatio="none" → always 100% width
 * 2. Decorative overlay (arches, star, text) with proper aspect ratio
 */
export function GothicArchTop({ collapsed = false, isMobile = false }: GothicArchTopProps) {
  if (collapsed && !isMobile) {
    return (
      <div className="w-full relative" style={{ height: 40 }}>
        {/* Background fill - stretches to full width */}
        <svg
          viewBox="0 0 100 80"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M0,80 L0,45 Q0,25 15,18 L42,4 Q50,0 58,4 L85,18 Q100,25 100,45 L100,80 Z"
            fill="#f8f6f0"
            stroke="none"
          />
        </svg>
        {/* Decorative strokes - maintain aspect ratio */}
        <svg
          viewBox="0 0 100 80"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMax meet"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer arch */}
          <path
            d="M10,80 L10,45 Q10,28 22,20 L44,6 Q50,2 56,6 L78,20 Q90,28 90,45 L90,80"
            fill="none"
            stroke="#d8cfc4"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Inner arch */}
          <path
            d="M18,80 L18,48 Q18,34 28,26 L46,12 Q50,9 54,12 L72,26 Q82,34 82,48 L82,80"
            fill="none"
            stroke="#d8cfc4"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          {/* Gold star */}
          <g transform="translate(76,2)">
            <path
              d="M0,6 C3,6 6,3 6,0 C6,3 9,6 12,6 C9,6 6,9 6,12 C6,9 3,6 0,6Z"
              fill="#B8902A"
            />
          </g>
        </svg>
      </div>
    );
  }

  return (
    <div className="w-full relative" style={{ height: isMobile ? 80 : 96 }}>
      {/* Layer 1: Background fill - stretches to exact container width */}
      <svg
        viewBox="0 0 100 60"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0,60 L0,32 Q0,18 8,12 L43,2 Q50,-1 57,2 L92,12 Q100,18 100,32 L100,60 Z"
          fill="#f8f6f0"
          stroke="none"
        />
      </svg>

      {/* Layer 2: Decorative arches + star + text - maintain proportions */}
      <svg
        viewBox="0 0 200 100"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMax meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Pillar bases - left */}
        <line x1="8" y1="100" x2="8" y2="70" stroke="#d8cfc4" strokeWidth="1.8" />
        <line x1="20" y1="100" x2="20" y2="74" stroke="#d8cfc4" strokeWidth="1.2" />

        {/* Pillar bases - right */}
        <line x1="192" y1="100" x2="192" y2="70" stroke="#d8cfc4" strokeWidth="1.8" />
        <line x1="180" y1="100" x2="180" y2="74" stroke="#d8cfc4" strokeWidth="1.2" />

        {/* Outer arch */}
        <path
          d="M8,100 L8,52 Q8,32 28,22 L88,4 Q100,-1 112,4 L172,22 Q192,32 192,52 L192,100"
          fill="none"
          stroke="#d8cfc4"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Inner arch */}
        <path
          d="M20,100 L20,56 Q20,38 36,28 L90,10 Q100,6 110,10 L164,28 Q180,38 180,56 L180,100"
          fill="none"
          stroke="#d8cfc4"
          strokeWidth="1.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Gold 4-pointed star at top-right */}
        <g transform="translate(165,-2)">
          <path
            d="M0,12 C6,12 12,6 12,0 C12,6 18,12 24,12 C18,12 12,18 12,24 C12,18 6,12 0,12Z"
            fill="#B8902A"
          />
        </g>

        {/* Building name */}
        <text
          x="100"
          y="68"
          textAnchor="middle"
          fill="#1F1F1F"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="8"
          letterSpacing="1.5"
          fontWeight="bold"
        >
          WORSHIP ATELIER
        </text>
        <text
          x="100"
          y="80"
          textAnchor="middle"
          fill="#8a7a6a"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="5"
          letterSpacing="1"
        >
          by K-Worship
        </text>
      </svg>
    </div>
  );
}

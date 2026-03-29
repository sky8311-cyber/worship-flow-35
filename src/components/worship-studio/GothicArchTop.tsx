import { cn } from "@/lib/utils";

interface GothicArchTopProps {
  collapsed?: boolean;
  isMobile?: boolean;
}

/**
 * Gothic arch top for the Atelier building, matching the brand logo symbol.
 * Uses SVG with a pointed (lancet) double arch + gold star decoration.
 * The arch interior is filled with building color; exterior is transparent.
 */
export function GothicArchTop({ collapsed = false, isMobile = false }: GothicArchTopProps) {
  if (collapsed && !isMobile) {
    // Collapsed: small simplified arch
    return (
      <div className="w-full flex justify-center">
        <svg
          viewBox="0 -12 60 52"
          className="w-full h-[36px]"
          preserveAspectRatio="xMidYMax meet"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Fill shape - pointed arch */}
          <path
            d="M0,40 L0,22 Q0,12 10,7 L25,1 Q30,-1 35,1 L50,7 Q60,12 60,22 L60,40 Z"
            fill="#f8f6f0"
            stroke="none"
          />
          {/* Outer arch stroke */}
          <path
            d="M0,40 L0,22 Q0,12 10,7 L25,1 Q30,-1 35,1 L50,7 Q60,12 60,22 L60,40"
            fill="none"
            stroke="#d8cfc4"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          {/* Inner arch stroke */}
          <path
            d="M6,40 L6,24 Q6,15 14,10 L26,4 Q30,2 34,4 L46,10 Q54,15 54,24 L54,40"
            fill="none"
            stroke="#d8cfc4"
            strokeWidth="1"
            strokeLinejoin="round"
          />
          {/* Gold star */}
          <g transform="translate(48,-2)">
            <path
              d="M0,5 C2.5,5 5,2.5 5,0 C5,2.5 7.5,5 10,5 C7.5,5 5,7.5 5,10 C5,7.5 2.5,5 0,5Z"
              fill="#B8902A"
            />
          </g>
        </svg>
      </div>
    );
  }

  return (
    <div className="w-full flex justify-center">
      <svg
        viewBox="0 -40 360 160"
        className={cn("w-full", isMobile ? "h-[80px]" : "h-[96px]")}
        preserveAspectRatio="xMidYMax meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Fill shape - building interior color */}
        <path
          d="M0,120 L0,70 Q0,42 30,28 L155,3 Q180,-5 205,3 L330,28 Q360,42 360,70 L360,120 Z"
          fill="#f8f6f0"
          stroke="none"
        />

        {/* Outer arch */}
        <path
          d="M0,120 L0,70 Q0,42 30,28 L155,3 Q180,-5 205,3 L330,28 Q360,42 360,70 L360,120"
          fill="none"
          stroke="#d8cfc4"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Inner arch */}
        <path
          d="M24,120 L24,74 Q24,50 48,38 L158,10 Q180,2 202,10 L312,38 Q336,50 336,74 L336,120"
          fill="none"
          stroke="#d8cfc4"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Gold 4-pointed star at top-right */}
        <g transform="translate(305,-30)">
          <path
            d="M0,14 C7,14 14,7 14,0 C14,7 21,14 28,14 C21,14 14,21 14,28 C14,21 7,14 0,14Z"
            fill="#B8902A"
          />
        </g>

        {/* Optional: building name inside arch */}
        <text
          x="180"
          y="82"
          textAnchor="middle"
          fill="#1F1F1F"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="9"
          letterSpacing="2"
          fontWeight="bold"
        >
          WORSHIP ATELIER
        </text>
        <text
          x="180"
          y="95"
          textAnchor="middle"
          fill="#8a7a6a"
          fontFamily="Georgia, 'Times New Roman', serif"
          fontSize="6"
          letterSpacing="1.5"
        >
          by K-Worship
        </text>
      </svg>
    </div>
  );
}

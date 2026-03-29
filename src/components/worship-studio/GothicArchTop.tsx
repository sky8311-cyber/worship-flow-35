import { cn } from "@/lib/utils";

interface GothicArchTopProps {
  collapsed?: boolean;
  isMobile?: boolean;
}

/**
 * French Gothic Triple Lancet Arcade roof for the Atelier building.
 * Three pointed arches: tall center, shorter sides.
 * Includes quatrefoil windows, crockets, finials, and pillar columns.
 */
export function GothicArchTop({ collapsed = false, isMobile = false }: GothicArchTopProps) {
  if (collapsed && !isMobile) {
    return (
      <div className="w-full relative" style={{ height: 52 }}>
        {/* Background fill */}
        <svg
          viewBox="0 0 300 120"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d={`
              M0,120 L0,70
              Q0,60 10,55 L40,42 Q55,30 55,30 L55,30 Q55,30 70,42 L95,55
              Q105,48 110,42 L140,20 Q150,8 160,20 L190,42 Q195,48 205,55
              L230,42 Q245,30 245,30 L245,30 Q245,30 260,42 L290,55
              Q300,60 300,70 L300,120 Z
            `}
            fill="#f8f6f0"
            stroke="none"
          />
        </svg>
        {/* Decorative overlay */}
        <svg
          viewBox="0 0 300 120"
          className="absolute inset-0 w-full h-full"
          preserveAspectRatio="xMidYMax meet"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Left arch outline */}
          <path
            d="M10,120 L10,68 Q10,50 30,40 L48,30 Q55,24 62,30 L80,40 Q100,50 100,68 L100,120"
            fill="none" stroke="#d8cfc4" strokeWidth="1.2"
          />
          {/* Center arch outline */}
          <path
            d="M105,120 L105,55 Q105,35 125,22 L143,12 Q150,6 157,12 L175,22 Q195,35 195,55 L195,120"
            fill="none" stroke="#d8cfc4" strokeWidth="1.5"
          />
          {/* Right arch outline */}
          <path
            d="M200,120 L200,68 Q200,50 220,40 L238,30 Q245,24 252,30 L270,40 Q290,50 290,68 L290,120"
            fill="none" stroke="#d8cfc4" strokeWidth="1.2"
          />
          {/* Finials */}
          <line x1="55" y1="26" x2="55" y2="18" stroke="#d8cfc4" strokeWidth="1" />
          <circle cx="55" cy="17" r="2" fill="#d8cfc4" />
          <line x1="150" y1="8" x2="150" y2="0" stroke="#d8cfc4" strokeWidth="1.2" />
          <circle cx="150" cy="-1" r="2.5" fill="#B8902A" />
          <line x1="245" y1="26" x2="245" y2="18" stroke="#d8cfc4" strokeWidth="1" />
          <circle cx="245" cy="17" r="2" fill="#d8cfc4" />
        </svg>
      </div>
    );
  }

  return (
    <div className="w-full relative" style={{ height: isMobile ? 120 : 140 }}>
      {/* Layer 1: Background silhouette fill — stretches to full width */}
      <svg
        viewBox="0 0 300 200"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d={`
            M0,200 L0,130
            Q0,110 15,100 L35,88 Q55,68 55,68 Q55,68 75,88 L95,100
            Q100,95 105,88 L125,60 Q140,30 150,18 Q160,30 175,60 L195,88 Q200,95 205,100
            L225,88 Q245,68 245,68 Q245,68 265,88 L285,100
            Q300,110 300,130 L300,200 Z
          `}
          fill="#f8f6f0"
          stroke="none"
        />
      </svg>

      {/* Layer 2: Decorative details — maintains proportions */}
      <svg
        viewBox="0 0 300 200"
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="xMidYMax meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* ===== COLUMNS / PILLARS ===== */}
        {/* Left wall pillar */}
        <line x1="8" y1="200" x2="8" y2="128" stroke="#d8cfc4" strokeWidth="1.8" />
        {/* Left-center divider pillar */}
        <line x1="100" y1="200" x2="100" y2="100" stroke="#d8cfc4" strokeWidth="2" />
        <line x1="97" y1="200" x2="97" y2="105" stroke="#d8cfc4" strokeWidth="0.8" />
        <line x1="103" y1="200" x2="103" y2="105" stroke="#d8cfc4" strokeWidth="0.8" />
        {/* Capital decoration on left-center pillar */}
        <rect x="94" y="98" width="12" height="4" rx="1" fill="none" stroke="#d8cfc4" strokeWidth="0.8" />
        
        {/* Right-center divider pillar */}
        <line x1="200" y1="200" x2="200" y2="100" stroke="#d8cfc4" strokeWidth="2" />
        <line x1="197" y1="200" x2="197" y2="105" stroke="#d8cfc4" strokeWidth="0.8" />
        <line x1="203" y1="200" x2="203" y2="105" stroke="#d8cfc4" strokeWidth="0.8" />
        {/* Capital decoration on right-center pillar */}
        <rect x="194" y="98" width="12" height="4" rx="1" fill="none" stroke="#d8cfc4" strokeWidth="0.8" />

        {/* Right wall pillar */}
        <line x1="292" y1="200" x2="292" y2="128" stroke="#d8cfc4" strokeWidth="1.8" />

        {/* ===== LEFT ARCH (x: 8–100, peak at x=55, y=58) ===== */}
        {/* Outer arch */}
        <path
          d="M8,200 L8,128 Q8,105 22,92 L46,72 Q55,58 55,58 Q55,58 64,72 L88,92 Q100,105 100,128 L100,200"
          fill="none" stroke="#d8cfc4" strokeWidth="1.5" strokeLinejoin="round"
        />
        {/* Inner arch */}
        <path
          d="M18,200 L18,132 Q18,112 30,100 L48,80 Q55,68 55,68 Q55,68 62,80 L80,100 Q92,112 92,132 L92,200"
          fill="none" stroke="#d8cfc4" strokeWidth="0.8" strokeLinejoin="round"
        />
        {/* Quatrefoil window in left arch */}
        <g transform="translate(55,88)">
          <circle cx="0" cy="0" r="8" fill="none" stroke="#d8cfc4" strokeWidth="0.8" />
          {/* Four-leaf clover */}
          <circle cx="0" cy="-4" r="3" fill="none" stroke="#d8cfc4" strokeWidth="0.6" />
          <circle cx="0" cy="4" r="3" fill="none" stroke="#d8cfc4" strokeWidth="0.6" />
          <circle cx="-4" cy="0" r="3" fill="none" stroke="#d8cfc4" strokeWidth="0.6" />
          <circle cx="4" cy="0" r="3" fill="none" stroke="#d8cfc4" strokeWidth="0.6" />
        </g>
        {/* Left arch crockets */}
        <g stroke="#d8cfc4" strokeWidth="0.6" fill="none">
          <path d="M30,95 Q26,92 28,88" />
          <path d="M22,105 Q18,102 20,98" />
          <path d="M80,95 Q84,92 82,88" />
          <path d="M88,105 Q92,102 90,98" />
        </g>
        {/* Left finial */}
        <line x1="55" y1="58" x2="55" y2="44" stroke="#d8cfc4" strokeWidth="1" />
        <path d="M52,46 Q55,38 58,46" fill="#d8cfc4" stroke="none" />

        {/* ===== CENTER ARCH (x: 100–200, peak at x=150, y=18) ===== */}
        {/* Outer arch */}
        <path
          d="M100,200 L100,105 Q100,75 118,58 L140,35 Q150,18 150,18 Q150,18 160,35 L182,58 Q200,75 200,105 L200,200"
          fill="none" stroke="#d8cfc4" strokeWidth="1.8" strokeLinejoin="round"
        />
        {/* Inner arch */}
        <path
          d="M112,200 L112,110 Q112,82 128,66 L142,45 Q150,30 150,30 Q150,30 158,45 L172,66 Q188,82 188,110 L188,200"
          fill="none" stroke="#d8cfc4" strokeWidth="1" strokeLinejoin="round"
        />
        {/* Quatrefoil window in center arch */}
        <g transform="translate(150,68)">
          <circle cx="0" cy="0" r="12" fill="none" stroke="#d8cfc4" strokeWidth="1" />
          {/* Four-leaf clover — larger */}
          <circle cx="0" cy="-5.5" r="4" fill="none" stroke="#d8cfc4" strokeWidth="0.7" />
          <circle cx="0" cy="5.5" r="4" fill="none" stroke="#d8cfc4" strokeWidth="0.7" />
          <circle cx="-5.5" cy="0" r="4" fill="none" stroke="#d8cfc4" strokeWidth="0.7" />
          <circle cx="5.5" cy="0" r="4" fill="none" stroke="#d8cfc4" strokeWidth="0.7" />
        </g>
        {/* Small lancet windows inside center arch */}
        <path
          d="M135,180 L135,150 Q135,140 140,136 Q145,130 145,130 Q145,130 150,136 Q155,140 155,150 L155,180"
          fill="none" stroke="#d8cfc4" strokeWidth="0.6"
        />
        <path
          d="M155,180 L155,150 Q155,140 160,136 Q165,130 165,130 Q165,130 170,136 Q175,140 175,150 L175,180"
          fill="none" stroke="#d8cfc4" strokeWidth="0.6"
        />
        {/* Center arch crockets */}
        <g stroke="#d8cfc4" strokeWidth="0.7" fill="none">
          <path d="M125,70 Q120,66 123,62" />
          <path d="M118,82 Q113,78 116,74" />
          <path d="M112,94 Q107,90 110,86" />
          <path d="M175,70 Q180,66 177,62" />
          <path d="M182,82 Q187,78 184,74" />
          <path d="M188,94 Q193,90 190,86" />
        </g>
        {/* Center finial with gold star */}
        <line x1="150" y1="18" x2="150" y2="2" stroke="#d8cfc4" strokeWidth="1.2" />
        <g transform="translate(144,-4)">
          <path
            d="M0,6 C3,6 6,3 6,0 C6,3 9,6 12,6 C9,6 6,9 6,12 C6,9 3,6 0,6Z"
            fill="#B8902A"
          />
        </g>

        {/* ===== RIGHT ARCH (x: 200–292, peak at x=245, y=58) ===== */}
        {/* Outer arch */}
        <path
          d="M200,200 L200,128 Q200,105 212,92 L236,72 Q245,58 245,58 Q245,58 254,72 L278,92 Q292,105 292,128 L292,200"
          fill="none" stroke="#d8cfc4" strokeWidth="1.5" strokeLinejoin="round"
        />
        {/* Inner arch */}
        <path
          d="M208,200 L208,132 Q208,112 220,100 L238,80 Q245,68 245,68 Q245,68 252,80 L270,100 Q282,112 282,132 L282,200"
          fill="none" stroke="#d8cfc4" strokeWidth="0.8" strokeLinejoin="round"
        />
        {/* Quatrefoil window in right arch */}
        <g transform="translate(245,88)">
          <circle cx="0" cy="0" r="8" fill="none" stroke="#d8cfc4" strokeWidth="0.8" />
          <circle cx="0" cy="-4" r="3" fill="none" stroke="#d8cfc4" strokeWidth="0.6" />
          <circle cx="0" cy="4" r="3" fill="none" stroke="#d8cfc4" strokeWidth="0.6" />
          <circle cx="-4" cy="0" r="3" fill="none" stroke="#d8cfc4" strokeWidth="0.6" />
          <circle cx="4" cy="0" r="3" fill="none" stroke="#d8cfc4" strokeWidth="0.6" />
        </g>
        {/* Right arch crockets */}
        <g stroke="#d8cfc4" strokeWidth="0.6" fill="none">
          <path d="M220,95 Q216,92 218,88" />
          <path d="M212,105 Q208,102 210,98" />
          <path d="M270,95 Q274,92 272,88" />
          <path d="M278,105 Q282,102 280,98" />
        </g>
        {/* Right finial */}
        <line x1="245" y1="58" x2="245" y2="44" stroke="#d8cfc4" strokeWidth="1" />
        <path d="M242,46 Q245,38 248,46" fill="#d8cfc4" stroke="none" />

        {/* ===== HORIZONTAL BASE LINE ===== */}
        <line x1="0" y1="200" x2="300" y2="200" stroke="#d8cfc4" strokeWidth="0.5" />

        {/* ===== BRANDING TEXT ===== */}
        <text
          x="150"
          y="120"
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
          x="150"
          y="132"
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

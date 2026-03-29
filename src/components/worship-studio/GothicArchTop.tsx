interface GothicArchTopProps {
  collapsed?: boolean;
  isMobile?: boolean;
}

export function GothicArchTop({ collapsed = false, isMobile = false }: GothicArchTopProps) {
  const borderColor = "#d8cfc4";
  const bgColor = "#f8f6f0";
  const accentColor = "#8a7a6a";
  const goldColor = "#B8902A";

  if (collapsed && !isMobile) {
    return (
      <div className="w-full" style={{ aspectRatio: "300 / 100" }}>
        <svg
          viewBox="0 0 300 100"
          className="block w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Silhouette fill — covers from arches down to baseline */}
          <path
            d={`
              M0,100 L0,65
              Q0,58 8,54 L38,40 Q52,28 52,28 Q52,28 66,40 L92,54
              Q98,50 104,44 L134,22 Q148,8 150,6 Q152,8 166,22 L196,44 Q202,50 208,54
              L234,40 Q248,28 248,28 Q248,28 262,40 L292,54
              Q300,58 300,65 L300,100 Z
            `}
            fill={bgColor}
            stroke="none"
          />
          {/* Left arch */}
          <path
            d="M4,100 L4,62 Q4,50 20,42 L42,30 Q52,22 52,22 Q52,22 62,30 L84,42 Q100,50 100,62 L100,100"
            fill="none" stroke={borderColor} strokeWidth="1.2"
          />
          {/* Center arch */}
          <path
            d="M104,100 L104,48 Q104,30 122,20 L142,10 Q150,4 150,4 Q150,4 158,10 L178,20 Q196,30 196,48 L196,100"
            fill="none" stroke={borderColor} strokeWidth="1.5"
          />
          {/* Right arch */}
          <path
            d="M200,100 L200,62 Q200,50 216,42 L238,30 Q248,22 248,22 Q248,22 258,30 L280,42 Q296,50 296,62 L296,100"
            fill="none" stroke={borderColor} strokeWidth="1.2"
          />
          {/* Finials */}
          <line x1="52" y1="22" x2="52" y2="14" stroke={borderColor} strokeWidth="1" />
          <circle cx="52" cy="13" r="1.8" fill={borderColor} />
          <line x1="150" y1="4" x2="150" y2="-4" stroke={borderColor} strokeWidth="1.2" />
          <circle cx="150" cy="-5" r="2.2" fill={goldColor} />
          <line x1="248" y1="22" x2="248" y2="14" stroke={borderColor} strokeWidth="1" />
          <circle cx="248" cy="13" r="1.8" fill={borderColor} />
          {/* Baseline — matches building border-x */}
          <line x1="0" y1="100" x2="300" y2="100" stroke={borderColor} strokeWidth="1" />
          {/* Left border */}
          <line x1="0" y1="65" x2="0" y2="100" stroke={borderColor} strokeWidth="1" />
          {/* Right border */}
          <line x1="300" y1="65" x2="300" y2="100" stroke={borderColor} strokeWidth="1" />
        </svg>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ aspectRatio: "300 / 200" }}>
      <svg
        viewBox="0 0 300 200"
        className="block w-full h-full"
        preserveAspectRatio="xMidYMid meet"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* ===== SILHOUETTE FILL ===== */}
        <path
          d={`
            M0,200 L0,130
            Q0,118 10,110 L30,96 Q50,74 52,72 Q54,74 74,96 L90,108
            Q96,102 102,94 L126,64 Q142,34 150,20 Q158,34 174,64 L198,94 Q204,102 210,108
            L226,96 Q246,74 248,72 Q250,74 270,96 L290,110
            Q300,118 300,130 L300,200 Z
          `}
          fill={bgColor}
          stroke="none"
        />

        {/* ===== LEFT/RIGHT BORDER LINES (match building border-x) ===== */}
        <line x1="0" y1="130" x2="0" y2="200" stroke={borderColor} strokeWidth="1" />
        <line x1="300" y1="130" x2="300" y2="200" stroke={borderColor} strokeWidth="1" />

        {/* ===== COLUMNS / PILLARS ===== */}
        {/* Left wall pillar */}
        <line x1="4" y1="200" x2="4" y2="128" stroke={borderColor} strokeWidth="1.5" />
        {/* Left-center pillar */}
        <line x1="98" y1="200" x2="98" y2="106" stroke={borderColor} strokeWidth="2" />
        <line x1="95" y1="200" x2="95" y2="110" stroke={borderColor} strokeWidth="0.7" />
        <line x1="101" y1="200" x2="101" y2="110" stroke={borderColor} strokeWidth="0.7" />
        <rect x="92" y="104" width="12" height="3.5" rx="1" fill="none" stroke={borderColor} strokeWidth="0.7" />
        {/* Right-center pillar */}
        <line x1="202" y1="200" x2="202" y2="106" stroke={borderColor} strokeWidth="2" />
        <line x1="199" y1="200" x2="199" y2="110" stroke={borderColor} strokeWidth="0.7" />
        <line x1="205" y1="200" x2="205" y2="110" stroke={borderColor} strokeWidth="0.7" />
        <rect x="196" y="104" width="12" height="3.5" rx="1" fill="none" stroke={borderColor} strokeWidth="0.7" />
        {/* Right wall pillar */}
        <line x1="296" y1="200" x2="296" y2="128" stroke={borderColor} strokeWidth="1.5" />

        {/* ===== LEFT ARCH ===== */}
        <path
          d="M4,200 L4,128 Q4,108 18,96 L40,78 Q52,64 52,64 Q52,64 64,78 L86,96 Q98,108 98,128 L98,200"
          fill="none" stroke={borderColor} strokeWidth="1.4" strokeLinejoin="round"
        />
        <path
          d="M14,200 L14,132 Q14,114 26,104 L44,86 Q52,74 52,74 Q52,74 60,86 L78,104 Q90,114 90,132 L90,200"
          fill="none" stroke={borderColor} strokeWidth="0.7" strokeLinejoin="round"
        />
        {/* Left quatrefoil */}
        <g transform="translate(52,92)">
          <circle cx="0" cy="0" r="7" fill="none" stroke={borderColor} strokeWidth="0.7" />
          <circle cx="0" cy="-3.5" r="2.5" fill="none" stroke={borderColor} strokeWidth="0.5" />
          <circle cx="0" cy="3.5" r="2.5" fill="none" stroke={borderColor} strokeWidth="0.5" />
          <circle cx="-3.5" cy="0" r="2.5" fill="none" stroke={borderColor} strokeWidth="0.5" />
          <circle cx="3.5" cy="0" r="2.5" fill="none" stroke={borderColor} strokeWidth="0.5" />
        </g>
        {/* Left crockets */}
        <g stroke={borderColor} strokeWidth="0.5" fill="none">
          <path d="M28,98 Q24,95 26,91" />
          <path d="M20,108 Q16,105 18,101" />
          <path d="M76,98 Q80,95 78,91" />
          <path d="M84,108 Q88,105 86,101" />
        </g>
        {/* Left finial */}
        <line x1="52" y1="64" x2="52" y2="50" stroke={borderColor} strokeWidth="0.9" />
        <path d="M49,52 Q52,44 55,52" fill={borderColor} stroke="none" />

        {/* ===== CENTER ARCH ===== */}
        <path
          d="M98,200 L98,108 Q98,78 116,60 L138,38 Q150,20 150,20 Q150,20 162,38 L184,60 Q202,78 202,108 L202,200"
          fill="none" stroke={borderColor} strokeWidth="1.6" strokeLinejoin="round"
        />
        <path
          d="M110,200 L110,112 Q110,86 126,70 L142,48 Q150,32 150,32 Q150,32 158,48 L174,70 Q190,86 190,112 L190,200"
          fill="none" stroke={borderColor} strokeWidth="0.9" strokeLinejoin="round"
        />
        {/* Center quatrefoil */}
        <g transform="translate(150,72)">
          <circle cx="0" cy="0" r="10" fill="none" stroke={borderColor} strokeWidth="0.9" />
          <circle cx="0" cy="-5" r="3.5" fill="none" stroke={borderColor} strokeWidth="0.6" />
          <circle cx="0" cy="5" r="3.5" fill="none" stroke={borderColor} strokeWidth="0.6" />
          <circle cx="-5" cy="0" r="3.5" fill="none" stroke={borderColor} strokeWidth="0.6" />
          <circle cx="5" cy="0" r="3.5" fill="none" stroke={borderColor} strokeWidth="0.6" />
        </g>
        {/* Center lancet sub-arches (lower portion of center arch) */}
        <path
          d="M132,185 L132,155 Q132,145 137,140 Q142,134 145,132 Q148,134 150,140"
          fill="none" stroke={borderColor} strokeWidth="0.5"
        />
        <path
          d="M168,185 L168,155 Q168,145 163,140 Q158,134 155,132 Q152,134 150,140"
          fill="none" stroke={borderColor} strokeWidth="0.5"
        />
        {/* Center crockets */}
        <g stroke={borderColor} strokeWidth="0.6" fill="none">
          <path d="M123,74 Q118,70 121,66" />
          <path d="M116,86 Q111,82 114,78" />
          <path d="M110,98 Q105,94 108,90" />
          <path d="M177,74 Q182,70 179,66" />
          <path d="M184,86 Q189,82 186,78" />
          <path d="M190,98 Q195,94 192,90" />
        </g>
        {/* Center finial + gold star */}
        <line x1="150" y1="20" x2="150" y2="4" stroke={borderColor} strokeWidth="1.1" />
        <g transform="translate(144,-2)">
          <path
            d="M0,6 C3,6 6,3 6,0 C6,3 9,6 12,6 C9,6 6,9 6,12 C6,9 3,6 0,6Z"
            fill={goldColor}
          />
        </g>

        {/* ===== RIGHT ARCH ===== */}
        <path
          d="M202,200 L202,128 Q202,108 216,96 L238,78 Q248,64 248,64 Q248,64 260,78 L282,96 Q296,108 296,128 L296,200"
          fill="none" stroke={borderColor} strokeWidth="1.4" strokeLinejoin="round"
        />
        <path
          d="M210,200 L210,132 Q210,114 222,104 L240,86 Q248,74 248,74 Q248,74 256,86 L274,104 Q286,114 286,132 L286,200"
          fill="none" stroke={borderColor} strokeWidth="0.7" strokeLinejoin="round"
        />
        {/* Right quatrefoil */}
        <g transform="translate(248,92)">
          <circle cx="0" cy="0" r="7" fill="none" stroke={borderColor} strokeWidth="0.7" />
          <circle cx="0" cy="-3.5" r="2.5" fill="none" stroke={borderColor} strokeWidth="0.5" />
          <circle cx="0" cy="3.5" r="2.5" fill="none" stroke={borderColor} strokeWidth="0.5" />
          <circle cx="-3.5" cy="0" r="2.5" fill="none" stroke={borderColor} strokeWidth="0.5" />
          <circle cx="3.5" cy="0" r="2.5" fill="none" stroke={borderColor} strokeWidth="0.5" />
        </g>
        {/* Right crockets */}
        <g stroke={borderColor} strokeWidth="0.5" fill="none">
          <path d="M222,98 Q218,95 220,91" />
          <path d="M214,108 Q210,105 212,101" />
          <path d="M274,98 Q278,95 276,91" />
          <path d="M282,108 Q286,105 284,101" />
        </g>
        {/* Right finial */}
        <line x1="248" y1="64" x2="248" y2="50" stroke={borderColor} strokeWidth="0.9" />
        <path d="M245,52 Q248,44 251,52" fill={borderColor} stroke="none" />

        {/* ===== BASELINE (hidden — flush with building top) ===== */}
        <line x1="0" y1="200" x2="300" y2="200" stroke={borderColor} strokeWidth="1" />

        {/* ===== BRANDING TEXT ===== */}
        <text
          x="150"
          y="124"
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
          y="136"
          textAnchor="middle"
          fill={accentColor}
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

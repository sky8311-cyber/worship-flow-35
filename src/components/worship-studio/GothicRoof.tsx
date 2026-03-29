
interface GothicRoofProps {
  collapsed?: boolean;
  isMobile?: boolean;
}

export function GothicRoof({ collapsed = false, isMobile = false }: GothicRoofProps) {
  if (collapsed) {
    // Finial only — small cross/fleur ornament
    return (
      <div className="flex items-end justify-center h-6">
        <svg viewBox="0 0 12 20" className="h-5 w-3" fill="none">
          {/* Finial cross */}
          <line x1="6" y1="0" x2="6" y2="16" stroke="#8a7a6a" strokeWidth="1.2" />
          <line x1="3" y1="4" x2="9" y2="4" stroke="#8a7a6a" strokeWidth="1.2" />
          
          {/* Small base */}
          <path d="M3,16 L6,13 L9,16 Z" fill="#d4c5a9" stroke="#8a7a6a" strokeWidth="0.6" />
        </svg>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col items-center">
      <svg
        viewBox="0 -10 240 120"
        className={isMobile ? "w-full h-auto" : "w-full h-auto"}
        preserveAspectRatio="xMidYMax meet"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* ── Background fill behind arches (spandrel area) ── */}
        <rect x="0" y="85" width="240" height="25" fill="#d4c5a9" />
        
        {/* ── Three Pointed Arches (Triple Lancet) ── */}
        {/* Left arch */}
        <path
          d="M20,100 L20,60 Q20,30 60,18 Q100,30 100,60 L100,100"
          fill="#e8ddd0"
          stroke="#8a7a6a"
          strokeWidth="1.5"
        />
        {/* Center arch (taller) */}
        <path
          d="M80,100 L80,50 Q80,12 120,2 Q160,12 160,50 L160,100"
          fill="#e8ddd0"
          stroke="#8a7a6a"
          strokeWidth="1.5"
        />
        {/* Right arch */}
        <path
          d="M140,100 L140,60 Q140,30 180,18 Q220,30 220,60 L220,100"
          fill="#e8ddd0"
          stroke="#8a7a6a"
          strokeWidth="1.5"
        />

        {/* ── Spandrel fill (triangles between arches) ── */}
        <path d="M100,100 L100,60 Q100,42 108,34 L112,34 Q104,42 104,60 L104,100 Z" fill="#d4c5a9" opacity="0.5" />
        <path d="M140,100 L140,60 Q140,42 132,34 L128,34 Q136,42 136,60 L136,100 Z" fill="#d4c5a9" opacity="0.5" />

        {/* ── Quatrefoil windows ── */}
        {/* Left quatrefoil */}
        <g transform="translate(60,52)">
          <circle cx="0" cy="-5" r="4" fill="rgba(135,206,235,0.3)" stroke="#8a7a6a" strokeWidth="0.8" />
          <circle cx="0" cy="5" r="4" fill="rgba(135,206,235,0.3)" stroke="#8a7a6a" strokeWidth="0.8" />
          <circle cx="-5" cy="0" r="4" fill="rgba(135,206,235,0.3)" stroke="#8a7a6a" strokeWidth="0.8" />
          <circle cx="5" cy="0" r="4" fill="rgba(135,206,235,0.3)" stroke="#8a7a6a" strokeWidth="0.8" />
          <circle cx="0" cy="0" r="3" fill="rgba(135,206,235,0.5)" />
        </g>
        {/* Center quatrefoil (larger) */}
        <g transform="translate(120,38)">
          <circle cx="0" cy="-6" r="5" fill="rgba(135,206,235,0.3)" stroke="#8a7a6a" strokeWidth="0.8" />
          <circle cx="0" cy="6" r="5" fill="rgba(135,206,235,0.3)" stroke="#8a7a6a" strokeWidth="0.8" />
          <circle cx="-6" cy="0" r="5" fill="rgba(135,206,235,0.3)" stroke="#8a7a6a" strokeWidth="0.8" />
          <circle cx="6" cy="0" r="5" fill="rgba(135,206,235,0.3)" stroke="#8a7a6a" strokeWidth="0.8" />
          <circle cx="0" cy="0" r="3.5" fill="rgba(135,206,235,0.5)" />
        </g>
        {/* Right quatrefoil */}
        <g transform="translate(180,52)">
          <circle cx="0" cy="-5" r="4" fill="rgba(135,206,235,0.3)" stroke="#8a7a6a" strokeWidth="0.8" />
          <circle cx="0" cy="5" r="4" fill="rgba(135,206,235,0.3)" stroke="#8a7a6a" strokeWidth="0.8" />
          <circle cx="-5" cy="0" r="4" fill="rgba(135,206,235,0.3)" stroke="#8a7a6a" strokeWidth="0.8" />
          <circle cx="5" cy="0" r="4" fill="rgba(135,206,235,0.3)" stroke="#8a7a6a" strokeWidth="0.8" />
          <circle cx="0" cy="0" r="3" fill="rgba(135,206,235,0.5)" />
        </g>

        {/* ── Finials (cross/fleur at top of each arch) ── */}
        {/* Left finial */}
        <g transform="translate(60,10)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="#8a7a6a" strokeWidth="1" />
          <line x1="-3" y1="2.5" x2="3" y2="2.5" stroke="#8a7a6a" strokeWidth="1" />
        </g>
        {/* Center finial (with gold star) */}
        <g transform="translate(120,-5)">
          <line x1="0" y1="0" x2="0" y2="7" stroke="#8a7a6a" strokeWidth="1.2" />
          <line x1="-3.5" y1="2.5" x2="3.5" y2="2.5" stroke="#8a7a6a" strokeWidth="1.2" />
        </g>
        {/* Right finial */}
        <g transform="translate(180,10)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="#8a7a6a" strokeWidth="1" />
          <line x1="-3" y1="2.5" x2="3" y2="2.5" stroke="#8a7a6a" strokeWidth="1" />
        </g>

        {/* ── Crocket decorations along arch edges ── */}
        {/* Left arch crockets */}
        <circle cx="35" cy="38" r="1.5" fill="#c8b89a" stroke="#8a7a6a" strokeWidth="0.5" />
        <circle cx="85" cy="38" r="1.5" fill="#c8b89a" stroke="#8a7a6a" strokeWidth="0.5" />
        {/* Center arch crockets */}
        <circle cx="95" cy="26" r="1.5" fill="#c8b89a" stroke="#8a7a6a" strokeWidth="0.5" />
        <circle cx="145" cy="26" r="1.5" fill="#c8b89a" stroke="#8a7a6a" strokeWidth="0.5" />
        {/* Right arch crockets */}
        <circle cx="155" cy="38" r="1.5" fill="#c8b89a" stroke="#8a7a6a" strokeWidth="0.5" />
        <circle cx="205" cy="38" r="1.5" fill="#c8b89a" stroke="#8a7a6a" strokeWidth="0.5" />

        {/* ── Columns between arches ── */}
        <rect x="98" y="60" width="4" height="40" fill="#b8a88a" stroke="#8a7a6a" strokeWidth="0.5" rx="1" />
        <rect x="138" y="60" width="4" height="40" fill="#b8a88a" stroke="#8a7a6a" strokeWidth="0.5" rx="1" />
        {/* Column capitals */}
        <rect x="96" y="58" width="8" height="4" fill="#c8b89a" stroke="#8a7a6a" strokeWidth="0.5" rx="1" />
        <rect x="136" y="58" width="8" height="4" fill="#c8b89a" stroke="#8a7a6a" strokeWidth="0.5" rx="1" />

        {/* ── Outer columns ── */}
        <rect x="17" y="60" width="4" height="40" fill="#b8a88a" stroke="#8a7a6a" strokeWidth="0.5" rx="1" />
        <rect x="219" y="60" width="4" height="40" fill="#b8a88a" stroke="#8a7a6a" strokeWidth="0.5" rx="1" />
        <rect x="15" y="58" width="8" height="4" fill="#c8b89a" stroke="#8a7a6a" strokeWidth="0.5" rx="1" />
        <rect x="217" y="58" width="8" height="4" fill="#c8b89a" stroke="#8a7a6a" strokeWidth="0.5" rx="1" />

        {/* ── Brand text ── */}
        <text
          x="120"
          y="80"
          textAnchor="middle"
          fontSize="7"
          fontWeight="700"
          letterSpacing="0.8"
          fill="#5a4d3e"
          fontFamily="serif"
        >
          Worship Atelier
        </text>
        <text
          x="120"
          y="90"
          textAnchor="middle"
          fontSize="4.5"
          letterSpacing="0.5"
          fill="#8a7a6a"
          fontFamily="serif"
        >
          by K-Worship
        </text>

        {/* ── Cornice (bottom decorative band) ── */}
        <rect x="0" y="98" width="240" height="2" fill="#c8b89a" />
        <rect x="0" y="100" width="240" height="1.5" fill="#b8a88a" />
        {/* Dentil molding */}
        {Array.from({ length: 24 }).map((_, i) => (
          <rect key={i} x={5 + i * 10} y="96" width="4" height="2" fill="#b8a88a" opacity="0.6" />
        ))}

        {/* ── Side walls connecting to building ── */}
        <rect x="0" y="85" width="20" height="16.5" fill="#d4c5a9" stroke="#8a7a6a" strokeWidth="0.5" />
        <rect x="220" y="85" width="20" height="16.5" fill="#d4c5a9" stroke="#8a7a6a" strokeWidth="0.5" />
      </svg>
    </div>
  );
}

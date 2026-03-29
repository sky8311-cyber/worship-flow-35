
interface GothicEntranceProps {
  collapsed?: boolean;
  isMobile?: boolean;
}

export function GothicEntrance({ collapsed = false, isMobile = false }: GothicEntranceProps) {
  if (collapsed) {
    return (
      <div className="flex flex-col items-center px-1 py-1">
        <svg viewBox="0 0 30 40" className="w-8 h-10" fill="none">
          {/* Simplified pointed arch door */}
          <path
            d="M5,40 L5,18 Q5,5 15,2 Q25,5 25,18 L25,40"
            fill="#5a4d3e"
            stroke="#8a7a6a"
            strokeWidth="1"
          />
          {/* Door split */}
          <line x1="15" y1="8" x2="15" y2="40" stroke="#8a7a6a" strokeWidth="0.5" />
          {/* Tiny knobs */}
          <circle cx="13" cy="25" r="1" fill="#b8902a" />
          <circle cx="17" cy="25" r="1" fill="#b8902a" />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-2 pt-2 pb-0">
      <svg
        viewBox="0 0 160 70"
        className="w-full h-auto"
        preserveAspectRatio="xMidYMax meet"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* ── Background wall with brick pattern ── */}
        <rect x="0" y="0" width="160" height="70" fill="#c8b89a" />
        {/* Brick horizontal lines */}
        {Array.from({ length: 7 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={10 + i * 10} x2="160" y2={10 + i * 10} stroke="#b8a88a" strokeWidth="0.3" />
        ))}
        {/* Brick vertical lines (staggered) */}
        {Array.from({ length: 7 }).map((_, row) => (
          Array.from({ length: 8 }).map((_, col) => (
            <line
              key={`v${row}-${col}`}
              x1={(row % 2 === 0 ? 0 : 10) + col * 20}
              y1={10 + row * 10}
              x2={(row % 2 === 0 ? 0 : 10) + col * 20}
              y2={20 + row * 10}
              stroke="#b8a88a"
              strokeWidth="0.3"
            />
          ))
        ))}

        {/* ── Left column ── */}
        <rect x="22" y="15" width="8" height="55" fill="#b8a88a" stroke="#8a7a6a" strokeWidth="0.8" rx="1" />
        {/* Column capital */}
        <rect x="19" y="12" width="14" height="5" fill="#d4c5a9" stroke="#8a7a6a" strokeWidth="0.6" rx="1" />
        {/* Column base */}
        <rect x="19" y="67" width="14" height="3" fill="#d4c5a9" stroke="#8a7a6a" strokeWidth="0.4" rx="0.5" />

        {/* ── Right column ── */}
        <rect x="130" y="15" width="8" height="55" fill="#b8a88a" stroke="#8a7a6a" strokeWidth="0.8" rx="1" />
        {/* Column capital */}
        <rect x="127" y="12" width="14" height="5" fill="#d4c5a9" stroke="#8a7a6a" strokeWidth="0.6" rx="1" />
        {/* Column base */}
        <rect x="127" y="67" width="14" height="3" fill="#d4c5a9" stroke="#8a7a6a" strokeWidth="0.4" rx="0.5" />

        {/* ── Pointed arch doorway ── */}
        <path
          d="M40,70 L40,32 Q40,8 80,2 Q120,8 120,32 L120,70"
          fill="#5a4d3e"
          stroke="#8a7a6a"
          strokeWidth="1.2"
        />

        {/* ── Tympanum (semi-circular area above door) ── */}
        <path
          d="M45,35 Q45,14 80,6 Q115,14 115,35"
          fill="#6a5d4e"
          stroke="#8a7a6a"
          strokeWidth="0.5"
        />
        {/* Small cross in tympanum */}
        <g transform="translate(80,20)">
          <line x1="0" y1="-5" x2="0" y2="5" stroke="#b8902a" strokeWidth="1" />
          <line x1="-3.5" y1="-2" x2="3.5" y2="-2" stroke="#b8902a" strokeWidth="1" />
        </g>

        {/* ── Door panels ── */}
        {/* Left door */}
        <path
          d="M48,70 L48,36 Q48,22 79,36 L79,70"
          fill="#4a3d2e"
          stroke="#6a5d4e"
          strokeWidth="0.5"
        />
        {/* Right door */}
        <path
          d="M81,70 L81,36 Q81,22 112,36 L112,70"
          fill="#4a3d2e"
          stroke="#6a5d4e"
          strokeWidth="0.5"
        />
        {/* Door split line */}
        <line x1="80" y1="10" x2="80" y2="70" stroke="#8a7a6a" strokeWidth="0.8" />

        {/* ── Door hardware ── */}
        {/* Left knob */}
        <circle cx="74" cy="50" r="2" fill="#b8902a" stroke="#8a7a6a" strokeWidth="0.4" />
        {/* Right knob */}
        <circle cx="86" cy="50" r="2" fill="#b8902a" stroke="#8a7a6a" strokeWidth="0.4" />

        {/* ── Small rose window above arch ── */}
        <g transform="translate(80,6)">
          <circle cx="0" cy="0" r="0" />
        </g>

        {/* ── Arch molding (outer decorative arch) ── */}
        <path
          d="M36,70 L36,30 Q36,4 80,-1 Q124,4 124,30 L124,70"
          fill="none"
          stroke="#8a7a6a"
          strokeWidth="0.6"
          strokeDasharray="2,2"
        />

        {/* ── Steps ── */}
        <rect x="35" y="68" width="90" height="2" fill="#d4c5a9" stroke="#b8a88a" strokeWidth="0.3" rx="0.5" />

        {/* ── Side decorative panels ── */}
        {/* Left lancet window */}
        <path d="M10,25 L10,55 Q10,22 16,20 Q22,22 22,55 L22,25" fill="rgba(135,206,235,0.2)" stroke="#8a7a6a" strokeWidth="0.5" />
        {/* Right lancet window */}
        <path d="M138,25 L138,55 Q138,22 144,20 Q150,22 150,55 L150,25" fill="rgba(135,206,235,0.2)" stroke="#8a7a6a" strokeWidth="0.5" />
      </svg>
    </div>
  );
}

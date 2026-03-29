
interface GothicEntranceProps {
  collapsed?: boolean;
  isMobile?: boolean;
}

export function GothicEntrance({ collapsed = false, isMobile = false }: GothicEntranceProps) {
  if (collapsed) {
    return (
      <div className="flex flex-col items-center px-1 py-1">
        <svg viewBox="0 0 30 40" className="w-8 h-10" fill="none">
          {/* Two small pointed arch doors */}
          <path
            d="M3,40 L3,20 Q3,10 10,7 Q17,10 17,20 L17,40"
            fill="#5a4d3e"
            stroke="#8a7a6a"
            strokeWidth="0.8"
          />
          <path
            d="M13,40 L13,20 Q13,10 20,7 Q27,10 27,20 L27,40"
            fill="#5a4d3e"
            stroke="#8a7a6a"
            strokeWidth="0.8"
          />
          {/* Tiny knobs */}
          <circle cx="14" cy="26" r="0.8" fill="#b8902a" />
          <circle cx="16" cy="26" r="0.8" fill="#b8902a" />
        </svg>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center px-2 pt-1 pb-0">
      <svg
        viewBox="0 0 80 32"
        className="w-full h-auto max-h-[60px]"
        preserveAspectRatio="xMidYMax meet"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* ── Background brick strip ── */}
        <rect x="0" y="0" width="80" height="32" fill="#c8b89a" />
        {/* Stone block lines — horizontal */}
        {Array.from({ length: 4 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={i * 8} x2="80" y2={i * 8} stroke="#b8a88a" strokeWidth="0.3" />
        ))}
        {/* Stone block lines — vertical (staggered) */}
        {Array.from({ length: 4 }).map((_, row) => (
          Array.from({ length: 6 }).map((_, col) => (
            <line
              key={`v${row}-${col}`}
              x1={(row % 2 === 0 ? 0 : 7) + col * 14}
              y1={row * 8}
              x2={(row % 2 === 0 ? 0 : 7) + col * 14}
              y2={(row + 1) * 8}
              stroke="#b8a88a"
              strokeWidth="0.3"
            />
          ))
        ))}

        {/* ── Left pointed arch doorway ── */}
        <path
          d="M14,32 L14,17 Q14,6 27,3 Q40,6 40,17 L40,32"
          fill="#5a4d3e"
          stroke="#8a7a6a"
          strokeWidth="0.8"
        />
        {/* Left door panels */}
        <path
          d="M16,32 L16,18 Q16,10 26.5,18 L26.5,32"
          fill="#4a3d2e"
          stroke="#6a5d4e"
          strokeWidth="0.3"
        />
        <path
          d="M27.5,32 L27.5,18 Q27.5,10 38,18 L38,32"
          fill="#4a3d2e"
          stroke="#6a5d4e"
          strokeWidth="0.3"
        />
        {/* Left door split */}
        <line x1="27" y1="7" x2="27" y2="32" stroke="#8a7a6a" strokeWidth="0.4" />
        {/* Left door knobs */}
        <circle cx="25.5" cy="22" r="0.8" fill="#b8902a" stroke="#8a7a6a" strokeWidth="0.2" />
        <circle cx="28.5" cy="22" r="0.8" fill="#b8902a" stroke="#8a7a6a" strokeWidth="0.2" />

        {/* ── Right pointed arch doorway ── */}
        <path
          d="M40,32 L40,17 Q40,6 53,3 Q66,6 66,17 L66,32"
          fill="#5a4d3e"
          stroke="#8a7a6a"
          strokeWidth="0.8"
        />
        {/* Right door panels */}
        <path
          d="M42,32 L42,18 Q42,10 52.5,18 L52.5,32"
          fill="#4a3d2e"
          stroke="#6a5d4e"
          strokeWidth="0.3"
        />
        <path
          d="M53.5,32 L53.5,18 Q53.5,10 64,18 L64,32"
          fill="#4a3d2e"
          stroke="#6a5d4e"
          strokeWidth="0.3"
        />
        {/* Right door split */}
        <line x1="53" y1="7" x2="53" y2="32" stroke="#8a7a6a" strokeWidth="0.4" />
        {/* Right door knobs */}
        <circle cx="51.5" cy="22" r="0.8" fill="#b8902a" stroke="#8a7a6a" strokeWidth="0.2" />
        <circle cx="54.5" cy="22" r="0.8" fill="#b8902a" stroke="#8a7a6a" strokeWidth="0.2" />

        {/* ── Center pillar between doors ── */}
        <line x1="40" y1="3" x2="40" y2="32" stroke="#8a7a6a" strokeWidth="1" />

        {/* ── Small tympanum crosses ── */}
        <g transform="translate(27,8)">
          <line x1="0" y1="-2" x2="0" y2="2" stroke="#b8902a" strokeWidth="0.5" />
          <line x1="-1.5" y1="-0.8" x2="1.5" y2="-0.8" stroke="#b8902a" strokeWidth="0.5" />
        </g>
        <g transform="translate(53,8)">
          <line x1="0" y1="-2" x2="0" y2="2" stroke="#b8902a" strokeWidth="0.5" />
          <line x1="-1.5" y1="-0.8" x2="1.5" y2="-0.8" stroke="#b8902a" strokeWidth="0.5" />
        </g>

        {/* ── Step ── */}
        <rect x="11" y="30" width="58" height="2" fill="#d4c5a9" stroke="#b8a88a" strokeWidth="0.2" rx="0.3" />
      </svg>
    </div>
  );
}

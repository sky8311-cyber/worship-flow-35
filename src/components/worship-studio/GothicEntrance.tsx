
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
        {/* Brick lines */}
        {Array.from({ length: 3 }).map((_, i) => (
          <line key={`h${i}`} x1="0" y1={8 + i * 10} x2="80" y2={8 + i * 10} stroke="#b8a88a" strokeWidth="0.3" />
        ))}
        {Array.from({ length: 3 }).map((_, row) => (
          Array.from({ length: 5 }).map((_, col) => (
            <line
              key={`v${row}-${col}`}
              x1={(row % 2 === 0 ? 0 : 8) + col * 16}
              y1={8 + row * 10}
              x2={(row % 2 === 0 ? 0 : 8) + col * 16}
              y2={18 + row * 10}
              stroke="#b8a88a"
              strokeWidth="0.3"
            />
          ))
        ))}

        {/* ── Pointed arch doorway ── */}
        <path
          d="M25,32 L25,16 Q25,4 40,1 Q55,4 55,16 L55,32"
          fill="#5a4d3e"
          stroke="#8a7a6a"
          strokeWidth="0.8"
        />

        {/* ── Door panels ── */}
        <path
          d="M28,32 L28,17 Q28,8 39.5,17 L39.5,32"
          fill="#4a3d2e"
          stroke="#6a5d4e"
          strokeWidth="0.3"
        />
        <path
          d="M40.5,32 L40.5,17 Q40.5,8 52,17 L52,32"
          fill="#4a3d2e"
          stroke="#6a5d4e"
          strokeWidth="0.3"
        />

        {/* Door split line */}
        <line x1="40" y1="5" x2="40" y2="32" stroke="#8a7a6a" strokeWidth="0.5" />

        {/* ── Door knobs ── */}
        <circle cx="38" cy="22" r="1" fill="#b8902a" stroke="#8a7a6a" strokeWidth="0.3" />
        <circle cx="42" cy="22" r="1" fill="#b8902a" stroke="#8a7a6a" strokeWidth="0.3" />

        {/* ── Small tympanum cross ── */}
        <g transform="translate(40,8)">
          <line x1="0" y1="-2.5" x2="0" y2="2.5" stroke="#b8902a" strokeWidth="0.6" />
          <line x1="-1.8" y1="-1" x2="1.8" y2="-1" stroke="#b8902a" strokeWidth="0.6" />
        </g>

        {/* ── Step ── */}
        <rect x="22" y="30" width="36" height="2" fill="#d4c5a9" stroke="#b8a88a" strokeWidth="0.2" rx="0.3" />
      </svg>
    </div>
  );
}

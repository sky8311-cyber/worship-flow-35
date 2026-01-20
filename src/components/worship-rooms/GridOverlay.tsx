import { Z_LAYERS } from "./FloorSlots";

interface GridOverlayProps {
  visible: boolean;
}

/**
 * Visual grid overlay shown during edit mode.
 * Helps users align furniture on the floor area.
 */
export function GridOverlay({ visible }: GridOverlayProps) {
  if (!visible) return null;

  return (
    <svg 
      className="absolute inset-0 pointer-events-none" 
      viewBox="0 0 800 500"
      style={{ zIndex: Z_LAYERS.FLOOR + 1 }}
    >
      <defs>
        <pattern id="furniture-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path 
            d="M 40 0 L 0 0 0 40" 
            fill="none" 
            stroke="rgba(0,0,0,0.08)" 
            strokeWidth="1" 
          />
        </pattern>
      </defs>
      {/* Grid only covers the floor area */}
      <rect 
        x="60" 
        y="220" 
        width="680" 
        height="260" 
        fill="url(#furniture-grid)" 
      />
      {/* Subtle border around floor area */}
      <rect 
        x="60" 
        y="220" 
        width="680" 
        height="260" 
        fill="none"
        stroke="rgba(99, 102, 241, 0.3)"
        strokeWidth="2"
        strokeDasharray="8 4"
        rx="4"
      />
    </svg>
  );
}

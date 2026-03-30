import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useStoryBarStudios, incrementVisitCount, type StoryStudio } from "@/hooks/useStoryBarStudios";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StudioUnit } from "./StudioUnit";
import { StoryCard } from "./StoryCard";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const PLACEHOLDER_TENANTS = [
  { id: 'ph1', name: '김찬양', initials: '김', icon: '🎵', variant: 'friend' as const },
  { id: 'ph2', name: '박워십', initials: '박', icon: '🎹', variant: 'friend' as const },
  { id: 'ph3', name: '이예배', initials: '이', icon: '🙏', variant: 'friend' as const },
  { id: 'ph4', name: '최성령', initials: '최', icon: '🕊️', variant: 'friend' as const },
  { id: 'ph5', name: '정은혜', initials: '정', icon: '✝️', variant: 'friend' as const },
  { id: 'ph6', name: '한찬미', initials: '한', icon: '🎶', variant: 'friend' as const },
  { id: 'ph7', name: '오다윗', initials: '오', icon: '🎸', variant: 'friend' as const },
  { id: 'ph8', name: '새벽이슬 워십',   initials: '새', icon: '🌅', variant: 'ambassador' as const },
  { id: 'ph9', name: '시온찬양단',       initials: '시', icon: '🏛️', variant: 'ambassador' as const },
  { id: 'ph10', name: '다윗의장막 밴드', initials: '다', icon: '🎺', variant: 'ambassador' as const },
];

const PLACEHOLDER_FRIENDS = PLACEHOLDER_TENANTS.filter(t => t.variant === 'friend');
const PLACEHOLDER_AMBASSADORS = PLACEHOLDER_TENANTS.filter(t => t.variant === 'ambassador');

/* ─── Glass facade style ─── */
const glassWallStyle: React.CSSProperties = {
  background: 'linear-gradient(to bottom, #d0e0ec, #b8ccd8)',
};

/* ─── Floor label — small metal plate ─── */
function FloorLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center mx-2 my-0.5">
      <span className="text-[7px] font-bold text-[#5a6a7a] border border-[#9ab0c0] bg-[#e4ecf2] px-1.5 py-px rounded-[2px] tracking-wider uppercase shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
        {label}
      </span>
    </div>
  );
}

/* ─── SVG Rooftop Scene — trees, parasols+chairs, railing, worship stage ─── */
function RooftopScene({ width, isMobile }: { width: number; isMobile: boolean }) {
  const h = isMobile ? 38 : 44;
  const spacing = width / 6;

  // 3 parasol sets (left side)
  const parasolSets = [
    { x: spacing * 0.8, color: '#d06030' },
    { x: spacing * 1.8, color: '#c04828' },
    { x: spacing * 3, color: '#d07040' },
  ];

  // 6 trees — varied sizes
  const trees = [
    { x: 6, trunkH: 10, r1: 5, r2: 3.5 },
    { x: 22, trunkH: 7, r1: 3.5, r2: 2.5 },
    { x: width * 0.38, trunkH: 8, r1: 4, r2: 3 },
    { x: width * 0.62, trunkH: 6, r1: 3, r2: 2 },
    { x: width - 28, trunkH: 9, r1: 4.5, r2: 3 },
    { x: width - 10, trunkH: 7, r1: 3.5, r2: 2.5 },
  ];

  // Worship stage position (right side)
  const stageX = spacing * 4.5;
  const stageW = spacing * 1.8;
  const stageY = h - 5;

  return (
    <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {/* Railing — evenly spaced balusters */}
      <rect x={0} y={h - 4} width={width} height={1.5} rx={0.5} fill="#7a8a9a" />
      <rect x={0} y={h - 1} width={width} height={1} rx={0.3} fill="#6a7a8a" />
      {Array.from({ length: Math.floor(width / 8) }).map((_, i) => (
        <rect key={`bal-${i}`} x={4 + i * 8} y={h - 4} width={1.2} height={4} rx={0.3} fill="#8a9aaa" />
      ))}

      {/* Trees */}
      {trees.map((t, i) => (
        <g key={`tree-${i}`}>
          <rect x={t.x - 1} y={h - 4 - t.trunkH} width={2} height={t.trunkH} rx={0.8} fill="#6b5b4f" />
          <circle cx={t.x} cy={h - 4 - t.trunkH - t.r1 * 0.6} r={t.r1} fill="#4a8a4a" opacity={0.85} />
          <circle cx={t.x - 2} cy={h - 4 - t.trunkH + 1} r={t.r2} fill="#5a9a5a" opacity={0.7} />
        </g>
      ))}

      {/* Parasol + table + chairs sets */}
      {parasolSets.map((p, i) => {
        const baseY = h - 5;
        return (
          <g key={`parasol-${i}`}>
            <rect x={p.x - 0.5} y={baseY - 12} width={1} height={10} fill="#8a7a6a" />
            <path d={`M ${p.x - 8},${baseY - 11} Q ${p.x},${baseY - 17} ${p.x + 8},${baseY - 11} Z`} fill={p.color} opacity={0.85} />
            <rect x={p.x - 2} y={baseY - 4} width={4} height={3} rx={0.5} fill="#7a6a5a" />
            <rect x={p.x - 6} y={baseY - 3} width={3} height={2.5} rx={0.5} fill="#8a7a6a" />
            <rect x={p.x - 5.5} y={baseY - 5.5} width={2} height={2.5} rx={0.5} fill="#9a8a7a" />
            <rect x={p.x + 3} y={baseY - 3} width={3} height={2.5} rx={0.5} fill="#8a7a6a" />
            <rect x={p.x + 3.5} y={baseY - 5.5} width={2} height={2.5} rx={0.5} fill="#9a8a7a" />
          </g>
        );
      })}

      {/* Worship Stage — low-rise white platform with instruments */}
      <g>
        {/* Stage platform */}
        <rect x={stageX} y={stageY - 3} width={stageW} height={3} rx={1} fill="#f0f0f0" stroke="#ccc" strokeWidth={0.5} />
        <rect x={stageX + 1} y={stageY - 4} width={stageW - 2} height={1.5} rx={0.5} fill="#fafafa" stroke="#ddd" strokeWidth={0.3} />

        {/* Drum set — center of stage */}
        {(() => {
          const drumCx = stageX + stageW * 0.5;
          const drumY = stageY - 5;
          return (
            <>
              {/* Bass drum */}
              <ellipse cx={drumCx} cy={drumY} rx={4} ry={3} fill="#c0c0c0" stroke="#999" strokeWidth={0.4} />
              <ellipse cx={drumCx} cy={drumY} rx={2.5} ry={1.8} fill="#e0e0e0" />
              {/* Snare */}
              <ellipse cx={drumCx - 5} cy={drumY + 1} rx={2} ry={1.2} fill="#d4c090" stroke="#aa9060" strokeWidth={0.3} />
              {/* Hi-hat */}
              <line x1={drumCx + 5} y1={drumY + 2} x2={drumCx + 5} y2={drumY - 4} stroke="#888" strokeWidth={0.5} />
              <ellipse cx={drumCx + 5} cy={drumY - 4} rx={2} ry={0.6} fill="#c8b040" opacity={0.8} />
              {/* Cymbal */}
              <line x1={drumCx - 3} y1={drumY - 1} x2={drumCx - 3} y2={drumY - 5} stroke="#888" strokeWidth={0.4} />
              <ellipse cx={drumCx - 3} cy={drumY - 5} rx={2.5} ry={0.5} fill="#d4b848" opacity={0.7} />
              {/* Drum sticks */}
              <line x1={drumCx - 1} y1={drumY - 3} x2={drumCx + 2} y2={drumY + 1} stroke="#8b6f4e" strokeWidth={0.5} />
              <line x1={drumCx + 1} y1={drumY - 3} x2={drumCx - 2} y2={drumY + 1} stroke="#8b6f4e" strokeWidth={0.5} />
            </>
          );
        })()}

        {/* Acoustic guitar — leaning on stand, left of drums */}
        {(() => {
          const gx = stageX + stageW * 0.18;
          const gy = stageY - 5;
          return (
            <>
              {/* Neck */}
              <line x1={gx} y1={gy - 8} x2={gx + 1} y2={gy + 1} stroke="#8b6f4e" strokeWidth={1} />
              {/* Body */}
              <ellipse cx={gx + 1.5} cy={gy + 1} rx={3} ry={2.5} fill="#c4956a" stroke="#8b6f4e" strokeWidth={0.4} />
              {/* Sound hole */}
              <circle cx={gx + 1.5} cy={gy + 0.5} r={0.8} fill="#5a4030" />
              {/* Headstock */}
              <rect x={gx - 1} y={gy - 9} width={2} height={2} rx={0.5} fill="#5a4030" />
            </>
          );
        })()}

        {/* Mic stand — right of drums */}
        {(() => {
          const mx = stageX + stageW * 0.82;
          const my = stageY - 5;
          return (
            <>
              {/* Stand base (tripod) */}
              <line x1={mx} y1={my + 4} x2={mx - 2} y2={my + 5} stroke="#666" strokeWidth={0.5} />
              <line x1={mx} y1={my + 4} x2={mx + 2} y2={my + 5} stroke="#666" strokeWidth={0.5} />
              {/* Vertical pole */}
              <line x1={mx} y1={my + 4} x2={mx} y2={my - 6} stroke="#666" strokeWidth={0.7} />
              {/* Mic head */}
              <ellipse cx={mx} cy={my - 7} rx={1.5} ry={2} fill="#333" />
              <rect x={mx - 0.3} y={my - 6} width={0.6} height={1} fill="#555" />
            </>
          );
        })()}
      </g>
    </svg>
  );
}

/* ─── SVG String Lights — poles start at building top, extend upward into sky ─── */
function RooftopStringLights({ width, buildingTop }: { width: number; buildingTop: number }) {
  const poleHeight = 30;
  const poleX = width - 14;
  // Pole bottom is at building top, extends upward
  const poleBottomY = buildingTop + poleHeight;
  const poleTopY = buildingTop;

  const strands = [
    { endX: 10, endY: poleTopY + poleHeight * 0.7, cp1x: poleX - 20, cp1y: poleTopY + 6, cp2x: 30, cp2y: poleTopY + poleHeight * 0.4 },
    { endX: 25, endY: poleTopY + poleHeight * 0.85, cp1x: poleX - 15, cp1y: poleTopY + 10, cp2x: 40, cp2y: poleTopY + poleHeight * 0.6 },
    { endX: 45, endY: poleTopY + poleHeight * 0.95, cp1x: poleX - 10, cp1y: poleTopY + 15, cp2x: 55, cp2y: poleTopY + poleHeight * 0.75 },
  ];

  const svgH = poleBottomY + 4;

  return (
    <svg width={width} height={svgH} className="absolute bottom-0 left-0 pointer-events-none" viewBox={`0 0 ${width} ${svgH}`} preserveAspectRatio="none">
      {/* Pole — anchored at building top, extends up */}
      <rect x={poleX - 1} y={poleTopY} width={2} height={poleHeight} rx={0.8} fill="#6b5b4f" />
      {/* Small flag at top of pole */}
      <polygon points={`${poleX + 1},${poleTopY} ${poleX + 6},${poleTopY + 2.5} ${poleX + 1},${poleTopY + 5}`} fill="#c94040" opacity={0.7} />

      {strands.map((s, si) => {
        const path = `M ${poleX},${poleTopY + 2} C ${s.cp1x},${s.cp1y} ${s.cp2x},${s.cp2y} ${s.endX},${s.endY}`;
        const bulbCount = 5 + si;
        return (
          <g key={si}>
            <path d={path} fill="none" stroke="#4a4a4a" strokeWidth={0.8} opacity={0.5} />
            {Array.from({ length: bulbCount }).map((_, bi) => {
              const t = (bi + 1) / (bulbCount + 1);
              const mt = 1 - t;
              const bx = mt * mt * mt * poleX + 3 * mt * mt * t * s.cp1x + 3 * mt * t * t * s.cp2x + t * t * t * s.endX;
              const by = mt * mt * mt * (poleTopY + 2) + 3 * mt * mt * t * s.cp1y + 3 * mt * t * t * s.cp2y + t * t * t * s.endY;
              return (
                <circle
                  key={bi}
                  cx={bx}
                  cy={by + 1.5}
                  r={1.5}
                  fill="#f5c542"
                  opacity={0.85}
                  className="animate-string-shimmer"
                  style={{ animationDelay: `${(si * 0.5 + bi * 0.25)}s` }}
                />
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}
/* ─── SVG Café Interior ─── */
function CafeSVG() {
  return (
    <svg viewBox="0 0 80 50" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <rect x={0} y={0} width={80} height={50} fill="#e8f0f4" fillOpacity={0.3} />
      <path d="M 0,0 Q 6,10 3,50" fill="#c94040" fillOpacity={0.25} />
      <path d="M 80,0 Q 74,10 77,50" fill="#c94040" fillOpacity={0.25} />
      {/* Counter */}
      <rect x={5} y={32} width={70} height={4} rx={1} fill="#8b6f4e" />
      {/* Espresso machine — dome top + portafilter */}
      <rect x={52} y={16} width={18} height={16} rx={2} fill="#4a4a4a" />
      <rect x={54} y={14} width={14} height={4} rx={2} fill="#555" />
      {/* Dome top */}
      <ellipse cx={61} cy={14} rx={6} ry={2.5} fill="#5a5a5a" />
      {/* Group head / portafilter */}
      <rect x={56} y={26} width={4} height={3} rx={0.5} fill="#888" />
      <rect x={63} y={26} width={4} height={3} rx={0.5} fill="#888" />
      {/* Drip tray */}
      <rect x={55} y={30} width={12} height={2} rx={0.5} fill="#666" />
      {/* Cup under portafilter */}
      <rect x={57} y={28} width={3} height={3} rx={0.5} fill="#f0e6d6" />
      {/* Steam wand */}
      <line x1={70} y1={20} x2={72} y2={28} stroke="#999" strokeWidth={0.8} />
      {/* Cups on counter */}
      <rect x={12} y={28} width={5} height={5} rx={1} fill="#f0e6d6" />
      <rect x={20} y={29} width={4} height={4} rx={1} fill="#e8dcc8" />
      {/* Stools */}
      <rect x={30} y={36} width={2} height={10} fill="#6b5b4f" />
      <rect x={25} y={34} width={12} height={2} rx={1} fill="#6b5b4f" />
      <rect x={44} y={36} width={2} height={10} fill="#6b5b4f" />
      <rect x={39} y={34} width={12} height={2} rx={1} fill="#6b5b4f" />
      {/* Hanging pendant light */}
      <line x1={40} y1={0} x2={40} y2={8} stroke="#333" strokeWidth={0.5} />
      <polygon points="36,8 44,8 42,12 38,12" fill="#f5c542" fillOpacity={0.6} />
    </svg>
  );
}

/* ─── SVG Gallery Interior ─── */
function GallerySVG() {
  return (
    <svg viewBox="0 0 80 50" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <rect x={0} y={0} width={80} height={50} fill="#fafafa" fillOpacity={0.4} />
      {/* Track lighting */}
      <rect x={5} y={2} width={70} height={1.5} rx={0.5} fill="#555" />
      <circle cx={18} cy={3} r={1.5} fill="#f5c542" fillOpacity={0.7} />
      <circle cx={40} cy={3} r={1.5} fill="#f5c542" fillOpacity={0.7} />
      <circle cx={62} cy={3} r={1.5} fill="#f5c542" fillOpacity={0.7} />
      <polygon points="18,4 12,20 24,20" fill="#f5c542" fillOpacity={0.06} />
      <polygon points="40,4 34,20 46,20" fill="#f5c542" fillOpacity={0.06} />
      <polygon points="62,4 56,20 68,20" fill="#f5c542" fillOpacity={0.06} />
      {/* Art frame 1 — Mountain landscape */}
      <rect x={8} y={10} width={20} height={16} rx={1} fill="none" stroke="#333" strokeWidth={0.8} />
      <rect x={10} y={12} width={16} height={12} fill="#87CEEB" />
      <polygon points="10,24 18,16 26,24" fill="#4a8a4a" />
      <polygon points="14,24 22,18 26,24" fill="#3a7a3a" />
      <circle cx={22} cy={15} r={2} fill="#f5c542" opacity={0.8} />
      {/* Art frame 2 — Abstract color blocks */}
      <rect x={33} y={8} width={14} height={22} rx={1} fill="none" stroke="#333" strokeWidth={0.8} />
      <rect x={35} y={10} width={10} height={6} fill="#e8c040" />
      <rect x={35} y={16} width={5} height={6} fill="#4080c0" />
      <rect x={40} y={16} width={5} height={6} fill="#50a060" />
      <rect x={35} y={22} width={10} height={6} fill="#c06040" />
      {/* Art frame 3 — Starry night sky */}
      <rect x={54} y={12} width={18} height={14} rx={1} fill="none" stroke="#333" strokeWidth={0.8} />
      <rect x={56} y={14} width={14} height={10} fill="#1a1a40" />
      <circle cx={60} cy={17} r={0.8} fill="#fff" opacity={0.9} />
      <circle cx={64} cy={16} r={0.5} fill="#fff" opacity={0.7} />
      <circle cx={67} cy={19} r={0.6} fill="#fff" opacity={0.8} />
      <circle cx={62} cy={20} r={0.4} fill="#fff" opacity={0.6} />
      <circle cx={58} cy={21} r={0.5} fill="#fff" opacity={0.7} />
      <circle cx={66} cy={17} r={1} fill="#f5e6a0" opacity={0.5} />
      {/* Floor */}
      <rect x={0} y={42} width={80} height={8} fill="#e8e4dc" fillOpacity={0.5} />
      {/* Pedestal */}
      <rect x={34} y={35} width={12} height={7} rx={0.5} fill="#ddd" />
      <rect x={37} y={32} width={6} height={3} rx={1} fill="#aaa" />
    </svg>
  );
}

/* ─── G/F Commercial Units — Café | Entrance | Gallery ─── */
function GroundFloorShops({ collapsed, isMobile }: { collapsed: boolean; isMobile: boolean }) {
  if (collapsed && !isMobile) {
    return (
      <div className="flex flex-col items-center gap-0.5 py-1 text-[6px] text-muted-foreground">
        <span>☕</span>
        <span>🚪</span>
        <span>🖼️</span>
      </div>
    );
  }

  return (
    <div className="flex h-16 border-t border-[#7a8a9a]">
      {/* Café */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Striped awning */}
        <div
          className="w-full h-1.5 shrink-0"
          style={{
            background: 'repeating-linear-gradient(90deg, #c94040, #c94040 4px, #fff 4px, #fff 8px)',
          }}
        />
        <span className="text-[5px] font-bold text-[#5a4a3a] tracking-wider text-center mt-0.5 relative z-10">CAFÉ</span>
        <div className="flex-1 relative">
          <CafeSVG />
        </div>
        {/* Flower pot outside */}
        <div className="absolute bottom-0 left-1 text-[7px] animate-leaf-sway">🌿</div>
      </div>

      {/* Entrance Door */}
      <div className="w-6 flex flex-col items-center justify-end bg-gradient-to-b from-[#a0b8c8] to-[#8aa0b0] border-x border-[#7a8a9a] relative">
        {/* Arch top */}
        <svg className="absolute top-0 w-full" viewBox="0 0 40 12" preserveAspectRatio="none">
          <path d="M 0,12 Q 20,0 40,12 Z" fill="#5a6a7a" />
          <path d="M 2,12 Q 20,2 38,12 Z" fill="#a0c0d4" fillOpacity={0.4} />
        </svg>
        {/* Door frame */}
        <div className="w-5 flex-1 mt-2 mb-0 bg-[#5a6a7a] rounded-t-[2px] flex flex-col items-center justify-center relative overflow-hidden">
          {/* Glass panel */}
          <div className="w-4 flex-1 mt-0.5 bg-[#b0d0e0]/40 rounded-t-[2px] border border-[#7a8a9a]/50" />
          {/* Handle */}
          <div className="w-0.5 h-1.5 bg-[#c0a060] rounded-full mb-0.5 mt-0.5" />
        </div>
        {/* Plants beside door */}
        <div className="absolute bottom-0 left-0 text-[5px]">🌱</div>
        <div className="absolute bottom-0 right-0 text-[5px]">🌱</div>
      </div>

      {/* Gallery */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <span className="text-[5px] font-bold text-[#5a6a7a] tracking-wider text-center mt-0.5 relative z-10">GALLERY</span>
        <div className="flex-1 relative">
          <GallerySVG />
        </div>
      </div>
    </div>
  );
}

/* ─── Animated Road (full width) ─── */
function AnimatedRoad({ collapsed, isMobile }: { collapsed: boolean; isMobile: boolean }) {
  return (
    <>
      {/* Sidewalk */}
      <div className={cn("shrink-0 flex items-end justify-around px-1 select-none pointer-events-none", isMobile ? "h-2" : "h-2.5")}
        style={{ background: 'linear-gradient(to bottom, #c4b8a8, #b8a998)' }}>
        {(!collapsed || isMobile) && (
          <>
            <span className="text-[7px] mb-px">🏮</span>
            <div className="animate-pinwheel-spin inline-block text-[8px] mb-px">✤</div>
            <span className="text-[7px] mb-px">🏮</span>
          </>
        )}
      </div>

      {/* Road */}
      <div
        className={cn("shrink-0 relative overflow-hidden select-none pointer-events-none", isMobile ? "h-8" : "h-10")}
        style={{ background: '#4a4a4a', borderTop: '2px solid #3a3a3a' }}
      >
        {/* Center line */}
        <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-white/25" />
        {/* Upper lane — right to left */}
        <span className="absolute top-[2px] text-[28px] leading-none animate-car-move-left" style={{ animationDelay: '0s' }}>🚗</span>
        {/* Lower lane — left to right (car flipped to face right) */}
        <span className="absolute bottom-[2px] text-[28px] leading-none animate-car-move-right" style={{ animationDelay: '3s', transform: 'scaleX(-1)' }}>🚕</span>
        {(!collapsed || isMobile) && (
          <span className="absolute top-[2px] text-[24px] leading-none animate-car-move-left" style={{ animationDelay: '8s' }}>🚙</span>
        )}
      </div>
    </>
  );
}

interface StudioSidePanelProps {
  myStudioId?: string;
  onStudioSelect: (roomId: string) => void;
  onMyStudioSelect: () => void;
  mode?: "sidebar" | "sheet" | "mobile";
}

export function StudioSidePanel({ myStudioId, onStudioSelect, onMyStudioSelect, mode = "sidebar" }: StudioSidePanelProps) {
  const { language } = useTranslation();
  const { user } = useAuth();
  const studios = useStoryBarStudios(myStudioId);
  const [storyIndex, setStoryIndex] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const isSheet = mode === "sheet";
  const isMobile = mode === "mobile";

  const { data: profileAvatar } = useQuery({
    queryKey: ["my-profile-avatar", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("profiles")
        .select("avatar_url")
        .eq("id", user.id)
        .single();
      return data?.avatar_url || null;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });

  const myAvatarUrl = user?.user_metadata?.avatar_url || profileAvatar || undefined;

  const myStudio = studios.find(s => s.isSelf);
  const friendStudios = studios.filter(s => !s.isSelf && !s.isAmbassador);
  const ambassadorStudios = studios.filter(s => s.isAmbassador);

  const handleStoryClick = (studio: StoryStudio) => {
    const idx = studios.findIndex(s => s.id === studio.id);
    if (idx >= 0) {
      incrementVisitCount(studio.id);
      setStoryIndex(idx);
    }
  };

  const handleVisit = (roomId: string) => {
    setStoryIndex(null);
    onStudioSelect(roomId);
  };

  /* ─── Building interior content ─── */
  const buildingContent = (
    <>
      {/* ROOFTOP — My Atelier */}
      {myStudio && (
        <div className="px-0.5 relative">
          {!collapsed && (
            <div className="flex flex-col items-center gap-0.5 px-2 py-0.5 select-none">
              <div className="bg-white px-3 py-0.5 rounded-[2px] shadow-sm border border-[#ddd]">
                <span className="text-[7px] font-bold text-[#2a2a2a] tracking-[0.15em]">
                  WORSHIP ATELIER <span className="text-[5px] font-normal text-[#666]">by kworship.app</span>
                </span>
              </div>
              <FloorLabel label="ROOFTOP" />
            </div>
          )}
          <StudioUnit
            compact={false}
            avatarUrl={myAvatarUrl}
            studioName={language === "ko" ? "내 아틀리에" : "My Atelier"}
            ownerName={user?.user_metadata?.full_name || user?.email?.split("@")[0] || ""}
            roomId={myStudio.id}
            hasUnseenStory={myStudio.hasNewPosts}
            variant="penthouse"
            collapsed={collapsed}
            onStoryClick={() => handleStoryClick(myStudio)}
            onVisit={onMyStudioSelect}
          />
        </div>
      )}

      {/* 2F — Friends / Neighbors */}
      {friendStudios.length > 0 ? (
        <div>
          {!collapsed && <FloorLabel label={language === "ko" ? "2F · 이웃" : "2F · Neighbors"} />}
          {friendStudios.map(s => (
            <StudioUnit
              compact={true}
              key={s.id}
              avatarUrl={s.avatarUrl || undefined}
              studioName={s.ownerName?.split(" ")[0] || "Studio"}
              ownerName={s.ownerName || ""}
              roomId={s.id}
              hasUnseenStory={s.hasNewPosts}
              variant="friend"
              collapsed={collapsed}
              onStoryClick={() => handleStoryClick(s)}
              onVisit={() => handleVisit(s.id)}
            />
          ))}
        </div>
      ) : (
        <div>
          {!collapsed && <FloorLabel label={language === "ko" ? "2F · 이웃" : "2F · Neighbors"} />}
          {PLACEHOLDER_FRIENDS.map(t => (
            <div key={t.id} className="opacity-60 pointer-events-none select-none">
              <StudioUnit
                compact={true}
                studioName={`${t.icon} ${t.name}`}
                ownerName={t.name}
                roomId={t.id}
                hasUnseenStory={false}
                variant="friend"
                collapsed={collapsed}
                placeholderInitials={t.initials}
                onStoryClick={() => {}}
                onVisit={() => {}}
              />
            </div>
          ))}
        </div>
      )}

      {/* Minimal spacer between floors */}
      <div className="min-h-[6px]" />

      {/* 1F — Ambassadors */}
      {ambassadorStudios.length > 0 ? (
        <div>
          {!collapsed && <FloorLabel label={language === "ko" ? "1F · 앰배서더" : "1F · Ambassadors"} />}
          {ambassadorStudios.map(s => (
            <StudioUnit
              compact={true}
              key={s.id}
              avatarUrl={s.avatarUrl || undefined}
              studioName={s.ownerName?.split(" ")[0] || "Studio"}
              ownerName={s.ownerName || ""}
              roomId={s.id}
              hasUnseenStory={s.hasNewPosts}
              variant="ambassador"
              collapsed={collapsed}
              onStoryClick={() => handleStoryClick(s)}
              onVisit={() => handleVisit(s.id)}
            />
          ))}
        </div>
      ) : (
        <div>
          {!collapsed && <FloorLabel label={language === "ko" ? "1F · 앰배서더" : "1F · Ambassadors"} />}
          {PLACEHOLDER_AMBASSADORS.map(t => (
            <div key={t.id} className="opacity-60 pointer-events-none select-none">
              <StudioUnit
                compact={true}
                studioName={`${t.icon} ${t.name}`}
                ownerName={t.name}
                roomId={t.id}
                hasUnseenStory={false}
                variant="ambassador"
                collapsed={collapsed}
                placeholderInitials={t.initials}
                onStoryClick={() => {}}
                onVisit={() => {}}
              />
            </div>
          ))}
        </div>
      )}
    </>
  );

  const showBuilding = mode === "sidebar" || isMobile;

  return (
    <>
      <div className={cn(
        "relative",
        isSheet ? "w-full" : isMobile
          ? "w-full flex flex-col h-full"
          : `${collapsed ? "w-14" : "w-64"} shrink-0 flex flex-col h-full transition-all duration-300 ease-in-out`
      )}>
        {/* Sky background with animated clouds */}
        {showBuilding && (
          <div
            className="absolute inset-0 z-0 overflow-hidden"
            style={{ background: 'linear-gradient(to bottom, #87CEEB 0%, #b8d9f0 40%, #daeeff 100%)' }}
          >
            {(!collapsed || isMobile) && (
              <>
                <div className="absolute top-3 animate-cloud-drift select-none pointer-events-none text-2xl opacity-80" style={{ animationDuration: '35s' }}>☁️</div>
                <div className="absolute top-8 animate-cloud-drift select-none pointer-events-none text-lg opacity-60" style={{ animationDuration: '28s', animationDelay: '5s' }}>☁️</div>
                <div className="absolute top-14 animate-cloud-drift select-none pointer-events-none text-sm opacity-40" style={{ animationDuration: '42s', animationDelay: '12s' }}>☁️</div>
              </>
            )}
          </div>
        )}

        {/* Collapse toggle — sidebar only */}
        {mode === "sidebar" && (
          <button
            onClick={() => setCollapsed(c => !c)}
            className="absolute top-2 right-0 translate-x-1/2 z-40 bg-background border border-border rounded-full p-1 text-primary hover:bg-accent shadow-sm transition-colors"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}

        {isSheet ? (
          <ScrollArea className="flex-1">
            {buildingContent}
          </ScrollArea>
        ) : (
          <>
            {/* Rooftop area with string lights — anchored to building top */}
            <div className={cn("relative z-10 shrink-0", isMobile ? "h-10" : "h-12")}>
              <div className="flex flex-col items-center justify-end h-full pb-1">
                {collapsed && !isMobile && <div className="h-2" />}
              </div>

              {/* String lights — poles from building top extending upward */}
              {(!collapsed || isMobile) && (
                <RooftopStringLights width={collapsed ? 56 : 256} buildingTop={isMobile ? 2 : 4} />
              )}
            </div>

            {/* Building wrapper */}
            <div className="relative z-10 flex flex-col flex-1 min-h-0">
              {/* Rooftop scene — railing, trees, parasol+chairs */}
              {(!collapsed || isMobile) && (
                <div className={cn("shrink-0", isMobile ? "mx-6" : "mx-3")}>
                  <RooftopScene width={collapsed ? 56 : isMobile ? 200 : 232} isMobile={isMobile} />
                </div>
              )}

              {/* Building body — glass facade */}
              <div
                className={cn("flex-1 min-h-0 flex flex-col border-x border-t border-[#7a8a9a] overflow-hidden", isMobile ? "mx-6" : "mx-3")}
                style={{
                  ...glassWallStyle,
                  boxShadow: '2px 0 8px rgba(0,0,0,0.1), -2px 0 8px rgba(0,0,0,0.1)',
                }}
              >
                {/* Glass panel vertical lines overlay */}
                <div
                  className="absolute inset-0 pointer-events-none z-0"
                  style={{
                    backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 38px, rgba(255,255,255,0.15) 38px, rgba(255,255,255,0.15) 39px)',
                  }}
                />
                <ScrollArea className="flex-1 min-h-0 relative z-10">
                  {buildingContent}
                </ScrollArea>
              </div>

              {/* G/F Ground Floor — Commercial Units */}
              <div className={cn("shrink-0 border-x border-[#7a8a9a] bg-[#e4ecf2]", isMobile ? "mx-6" : "mx-3")}>
                <GroundFloorShops collapsed={collapsed} isMobile={isMobile} />
              </div>

              {/* Animated Road — full width (no mx) */}
              <AnimatedRoad collapsed={collapsed} isMobile={isMobile} />
            </div>
          </>
        )}
      </div>

      {/* Story Card Overlay */}
      {storyIndex !== null && (
        <StoryCard
          studios={studios}
          initialIndex={storyIndex}
          onClose={() => setStoryIndex(null)}
          onVisit={handleVisit}
        />
      )}
    </>
  );
}

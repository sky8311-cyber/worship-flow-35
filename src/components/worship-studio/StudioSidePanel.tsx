import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useStoryBarStudios, incrementVisitCount, type StoryStudio } from "@/hooks/useStoryBarStudios";
import { usePlazaUsers } from "@/hooks/usePlazaUsers";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StudioUnit } from "./StudioUnit";
import { StoryCard } from "./StoryCard";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/* ─── Glass facade style ─── */
const glassWallStyle: React.CSSProperties = {
  background: 'linear-gradient(to bottom, #c0d4e4 0%, #a8bcd0 50%, #98b0c4 100%)',
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

/* ─── SVG Rooftop Scene — trees, parasols+chairs, railing, worship stage (1.5x scale) ─── */
function RooftopScene({ width, isMobile }: { width: number; isMobile: boolean }) {
  const h = isMobile ? 78 : 90;
  const spacing = width / 6;

  // 3 parasol sets (left side) — 1.5x
  const parasolSets = [
    { x: spacing * 0.8, color: '#d06030' },
    { x: spacing * 1.8, color: '#c04828' },
    { x: spacing * 3, color: '#d07040' },
  ];

  // 6 trees — 1.5x sizes
  const trees = [
    { x: 6, trunkH: 15, r1: 7.5, r2: 5.25 },
    { x: 22, trunkH: 10.5, r1: 5.25, r2: 3.75 },
    { x: width * 0.38, trunkH: 12, r1: 6, r2: 4.5 },
    { x: width * 0.62, trunkH: 9, r1: 4.5, r2: 3 },
    { x: width - 28, trunkH: 13.5, r1: 6.75, r2: 4.5 },
    { x: width - 10, trunkH: 10.5, r1: 5.25, r2: 3.75 },
  ];

  // Worship stage position (right side) — 1.5x
  const stageX = spacing * 4.5;
  const stageW = spacing * 1.8;
  const stageY = h - 7;

  return (
    <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {/* Railing — 1.5x thickness */}
      <rect x={0} y={h - 6} width={width} height={2.25} rx={0.75} fill="#7a8a9a" />
      <rect x={0} y={h - 1.5} width={width} height={1.5} rx={0.45} fill="#6a7a8a" />
      {Array.from({ length: Math.floor(width / 12) }).map((_, i) => (
        <rect key={`bal-${i}`} x={6 + i * 12} y={h - 6} width={1.8} height={6} rx={0.45} fill="#8a9aaa" />
      ))}

      {/* Trees — 1.5x */}
      {trees.map((t, i) => (
        <g key={`tree-${i}`}>
          <rect x={t.x - 1.5} y={h - 6 - t.trunkH} width={3} height={t.trunkH} rx={1.2} fill="#6b5b4f" />
          <circle cx={t.x} cy={h - 6 - t.trunkH - t.r1 * 0.6} r={t.r1} fill="#4a8a4a" opacity={0.85} />
          <circle cx={t.x - 3} cy={h - 6 - t.trunkH + 1.5} r={t.r2} fill="#5a9a5a" opacity={0.7} />
        </g>
      ))}

      {/* Parasol + table + chairs — 1.5x */}
      {parasolSets.map((p, i) => {
        const baseY = h - 7.5;
        return (
          <g key={`parasol-${i}`}>
            <rect x={p.x - 0.75} y={baseY - 18} width={1.5} height={15} fill="#8a7a6a" />
            <path d={`M ${p.x - 12},${baseY - 16.5} Q ${p.x},${baseY - 25.5} ${p.x + 12},${baseY - 16.5} Z`} fill={p.color} opacity={0.85} />
            <rect x={p.x - 3} y={baseY - 6} width={6} height={4.5} rx={0.75} fill="#7a6a5a" />
            <rect x={p.x - 9} y={baseY - 4.5} width={4.5} height={3.75} rx={0.75} fill="#8a7a6a" />
            <rect x={p.x - 8.25} y={baseY - 8.25} width={3} height={3.75} rx={0.75} fill="#9a8a7a" />
            <rect x={p.x + 4.5} y={baseY - 4.5} width={4.5} height={3.75} rx={0.75} fill="#8a7a6a" />
            <rect x={p.x + 5.25} y={baseY - 8.25} width={3} height={3.75} rx={0.75} fill="#9a8a7a" />
          </g>
        );
      })}

      {/* Worship Stage — 1.5x */}
      <g>
        <rect x={stageX} y={stageY - 4.5} width={stageW} height={4.5} rx={1.5} fill="#f0f0f0" stroke="#ccc" strokeWidth={0.75} />
        <rect x={stageX + 1.5} y={stageY - 6} width={stageW - 3} height={2.25} rx={0.75} fill="#fafafa" stroke="#ddd" strokeWidth={0.45} />

        {/* Drum set — 2.6x (bigger than guitar, taller than parasols) */}
        {(() => {
          const drumCx = stageX + stageW * 0.5;
          const drumY = stageY - 10;
          return (
            <>
              <ellipse cx={drumCx} cy={drumY} rx={11.5} ry={8} fill="#c0c0c0" stroke="#999" strokeWidth={0.9} />
              <ellipse cx={drumCx} cy={drumY} rx={7} ry={5} fill="#e0e0e0" />
              <ellipse cx={drumCx - 14} cy={drumY + 3} rx={5.5} ry={3.3} fill="#d4c090" stroke="#aa9060" strokeWidth={0.7} />
              <line x1={drumCx + 14} y1={drumY + 5} x2={drumCx + 14} y2={drumY - 12} stroke="#888" strokeWidth={1.1} />
              <ellipse cx={drumCx + 14} cy={drumY - 12} rx={5.5} ry={1.6} fill="#c8b040" opacity={0.8} />
              <line x1={drumCx - 7} y1={drumY - 3} x2={drumCx - 7} y2={drumY - 14} stroke="#888" strokeWidth={0.9} />
              <ellipse cx={drumCx - 7} cy={drumY - 14} rx={6.5} ry={1.4} fill="#d4b848" opacity={0.7} />
              <line x1={drumCx - 2} y1={drumY - 8} x2={drumCx + 5} y2={drumY + 3} stroke="#8b6f4e" strokeWidth={1.1} />
              <line x1={drumCx + 2} y1={drumY - 8} x2={drumCx - 5} y2={drumY + 3} stroke="#8b6f4e" strokeWidth={1.1} />
            </>
          );
        })()}

        {/* Acoustic guitar — 1.5x */}
        {(() => {
          const gx = stageX + stageW * 0.18;
          const gy = stageY - 7.5;
          return (
            <>
              <line x1={gx} y1={gy - 12} x2={gx + 1.5} y2={gy + 1.5} stroke="#8b6f4e" strokeWidth={1.5} />
              <ellipse cx={gx + 2.25} cy={gy + 1.5} rx={4.5} ry={3.75} fill="#c4956a" stroke="#8b6f4e" strokeWidth={0.6} />
              <circle cx={gx + 2.25} cy={gy + 0.75} r={1.2} fill="#5a4030" />
              <rect x={gx - 1.5} y={gy - 13.5} width={3} height={3} rx={0.75} fill="#5a4030" />
            </>
          );
        })()}

        {/* Mic stand — 1.5x */}
        {(() => {
          const mx = stageX + stageW * 0.82;
          const my = stageY - 7.5;
          return (
            <>
              <line x1={mx} y1={my + 6} x2={mx - 3} y2={my + 7.5} stroke="#666" strokeWidth={0.75} />
              <line x1={mx} y1={my + 6} x2={mx + 3} y2={my + 7.5} stroke="#666" strokeWidth={0.75} />
              <line x1={mx} y1={my + 6} x2={mx} y2={my - 9} stroke="#666" strokeWidth={1.05} />
              <ellipse cx={mx} cy={my - 10.5} rx={2.25} ry={3} fill="#333" />
              <rect x={mx - 0.45} y={my - 9} width={0.9} height={1.5} fill="#555" />
            </>
          );
        })()}
      </g>
    </svg>
  );
}

/* ─── SVG String Lights — poles anchored at building body top border, 1.5x height ─── */
function RooftopStringLights({ width }: { width: number }) {
  const poleHeight = 51; // 1.5x from 34
  const svgH = poleHeight + 2;
  const poleX = width - 14;
  const poleBottomY = svgH;
  const poleTopY = svgH - poleHeight;

  const strands = [
    { endX: 10, endY: svgH - 4, cp1x: poleX - 30, cp1y: poleTopY + 14, cp2x: 25, cp2y: svgH - 18 },
    { endX: 25, endY: svgH - 1, cp1x: poleX - 22, cp1y: poleTopY + 20, cp2x: 38, cp2y: svgH - 10 },
    { endX: 45, endY: svgH + 1, cp1x: poleX - 14, cp1y: poleTopY + 28, cp2x: 50, cp2y: svgH - 4 },
  ];

  return (
    <svg
      width={width}
      height={svgH}
      className="absolute left-0 pointer-events-none z-20"
      style={{ bottom: '100%', marginBottom: '-1px' }}
      viewBox={`0 0 ${width} ${svgH}`}
      preserveAspectRatio="xMidYMax meet"
    >
      {/* Pole — bottom touches building top border */}
      <rect x={poleX - 1} y={poleTopY} width={2} height={poleHeight} rx={0.8} fill="#6b5b4f" />
      {/* Flag */}
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
    <svg viewBox="0 0 120 70" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <rect x={0} y={0} width={120} height={70} fill="#e8f0f4" fillOpacity={0.3} />
      {/* Curtain sides */}
      <path d="M 0,0 Q 4,10 2,70" fill="#c94040" fillOpacity={0.25} />
      <path d="M 120,0 Q 116,10 118,70" fill="#c94040" fillOpacity={0.25} />
      {/* Back wall shelf */}
      <rect x={3} y={6} width={30} height={1.5} rx={0.5} fill="#8b6f4e" />
      {/* Books on shelf */}
      <rect x={4} y={1} width={2} height={5} rx={0.3} fill="#c94040" />
      <rect x={7} y={2} width={2} height={4} rx={0.3} fill="#4080c0" />
      <rect x={10} y={1.5} width={1.5} height={4.5} rx={0.3} fill="#50a060" />
      <rect x={12.5} y={2.5} width={2} height={3.5} rx={0.3} fill="#e8c040" />
      <rect x={15.5} y={1} width={2.5} height={5} rx={0.3} fill="#8060a0" />
      <rect x={19} y={2} width={1.5} height={4} rx={0.3} fill="#c06040" />
      <rect x={21.5} y={1.5} width={2} height={4.5} rx={0.3} fill="#4a8a4a" />
      <rect x={24.5} y={2} width={2} height={4} rx={0.3} fill="#d07040" />
      <rect x={27.5} y={1} width={2.5} height={5} rx={0.3} fill="#5a6a7a" />
      {/* Menu board on wall */}
      <rect x={38} y={3} width={16} height={12} rx={1} fill="#3a3020" />
      <rect x={40} y={5} width={12} height={2} rx={0.3} fill="#f5c542" fillOpacity={0.6} />
      <rect x={40} y={8} width={8} height={1.5} rx={0.3} fill="#f5c542" fillOpacity={0.4} />
      <rect x={40} y={10.5} width={10} height={1.5} rx={0.3} fill="#f5c542" fillOpacity={0.4} />
      {/* Wall art */}
      <rect x={95} y={4} width={14} height={10} rx={0.5} fill="none" stroke="#6b5b4f" strokeWidth={0.6} />
      <rect x={96.5} y={5.5} width={11} height={7} fill="#f0e6d6" />
      <ellipse cx={102} cy={8} rx={3} ry={2.5} fill="#c94040" fillOpacity={0.3} />
      {/* Counter */}
      <rect x={5} y={44} width={110} height={4} rx={1} fill="#8b6f4e" />
      {/* Espresso machine (smaller) */}
      <rect x={80} y={30} width={12} height={14} rx={1.5} fill="#4a4a4a" />
      <rect x={81} y={28} width={10} height={3} rx={1.5} fill="#555" />
      <ellipse cx={86} cy={28} rx={4} ry={1.8} fill="#5a5a5a" />
      <rect x={82} y={38} width={3} height={2.5} rx={0.3} fill="#888" />
      <rect x={87} y={38} width={3} height={2.5} rx={0.3} fill="#888" />
      <rect x={81} y={42} width={10} height={1.5} rx={0.3} fill="#666" />
      <rect x={83} y={40} width={2.5} height={2.5} rx={0.3} fill="#f0e6d6" />
      {/* Bottles on back counter */}
      <rect x={60} y={34} width={2.5} height={8} rx={0.8} fill="#4080c0" fillOpacity={0.7} />
      <rect x={64} y={36} width={2} height={6} rx={0.8} fill="#50a060" fillOpacity={0.7} />
      <rect x={67.5} y={35} width={2.5} height={7} rx={0.8} fill="#c06040" fillOpacity={0.7} />
      <rect x={71} y={37} width={2} height={5} rx={0.8} fill="#e8c040" fillOpacity={0.7} />
      {/* Cups on counter */}
      <rect x={15} y={40} width={3.5} height={4} rx={0.8} fill="#f0e6d6" />
      <rect x={21} y={41} width={3} height={3} rx={0.8} fill="#e8dcc8" />
      <rect x={27} y={40.5} width={3} height={3.5} rx={0.8} fill="#d4c8b0" />
      {/* Stools */}
      <rect x={35} y={48} width={1.5} height={14} fill="#6b5b4f" />
      <rect x={31} y={46.5} width={10} height={1.5} rx={0.8} fill="#6b5b4f" />
      <rect x={48} y={48} width={1.5} height={14} fill="#6b5b4f" />
      <rect x={44} y={46.5} width={10} height={1.5} rx={0.8} fill="#6b5b4f" />
      <rect x={100} y={48} width={1.5} height={14} fill="#6b5b4f" />
      <rect x={96} y={46.5} width={10} height={1.5} rx={0.8} fill="#6b5b4f" />
      {/* Hanging pendant lights */}
      <line x1={30} y1={0} x2={30} y2={18} stroke="#333" strokeWidth={0.4} />
      <polygon points="27,18 33,18 32,22 28,22" fill="#f5c542" fillOpacity={0.5} />
      <line x1={60} y1={0} x2={60} y2={16} stroke="#333" strokeWidth={0.4} />
      <polygon points="57,16 63,16 62,20 58,20" fill="#f5c542" fillOpacity={0.5} />
      <line x1={90} y1={0} x2={90} y2={19} stroke="#333" strokeWidth={0.4} />
      <polygon points="87,19 93,19 92,23 88,23" fill="#f5c542" fillOpacity={0.5} />
      {/* Potted plant on counter */}
      <rect x={8} y={40} width={4} height={4} rx={1} fill="#8b6f4e" />
      <circle cx={10} cy={38} r={3} fill="#4a8a4a" opacity={0.7} />
    </svg>
  );
}

/* ─── SVG Gallery Interior ─── */
function GallerySVG() {
  return (
    <svg viewBox="0 0 120 70" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <rect x={0} y={0} width={120} height={70} fill="#fafafa" fillOpacity={0.4} />
      {/* Track lighting */}
      <rect x={5} y={2} width={110} height={1.2} rx={0.4} fill="#555" />
      <circle cx={20} cy={3} r={1.2} fill="#f5c542" fillOpacity={0.7} />
      <circle cx={45} cy={3} r={1.2} fill="#f5c542" fillOpacity={0.7} />
      <circle cx={70} cy={3} r={1.2} fill="#f5c542" fillOpacity={0.7} />
      <circle cx={95} cy={3} r={1.2} fill="#f5c542" fillOpacity={0.7} />
      <polygon points="20,4 14,18 26,18" fill="#f5c542" fillOpacity={0.05} />
      <polygon points="45,4 39,18 51,18" fill="#f5c542" fillOpacity={0.05} />
      <polygon points="70,4 64,18 76,18" fill="#f5c542" fillOpacity={0.05} />
      <polygon points="95,4 89,18 101,18" fill="#f5c542" fillOpacity={0.05} />
      {/* Art frame 1 — Mountain landscape */}
      <rect x={6} y={10} width={16} height={12} rx={0.8} fill="none" stroke="#333" strokeWidth={0.6} />
      <rect x={7.5} y={11.5} width={13} height={9} fill="#87CEEB" />
      <polygon points="7.5,20.5 14,14 20.5,20.5" fill="#4a8a4a" />
      <polygon points="11,20.5 17,16 20.5,20.5" fill="#3a7a3a" />
      <circle cx={18} cy={13.5} r={1.5} fill="#f5c542" opacity={0.8} />
      {/* Art frame 2 — Abstract */}
      <rect x={28} y={8} width={11} height={17} rx={0.8} fill="none" stroke="#333" strokeWidth={0.6} />
      <rect x={29.5} y={9.5} width={8} height={5} fill="#e8c040" />
      <rect x={29.5} y={14.5} width={4} height={5} fill="#4080c0" />
      <rect x={33.5} y={14.5} width={4} height={5} fill="#50a060" />
      <rect x={29.5} y={19.5} width={8} height={4} fill="#c06040" />
      {/* Art frame 3 — Starry night */}
      <rect x={45} y={11} width={14} height={10} rx={0.8} fill="none" stroke="#333" strokeWidth={0.6} />
      <rect x={46.5} y={12.5} width={11} height={7} fill="#1a1a40" />
      <circle cx={49} cy={14.5} r={0.6} fill="#fff" opacity={0.9} />
      <circle cx={52} cy={13.5} r={0.4} fill="#fff" opacity={0.7} />
      <circle cx={54.5} cy={16} r={0.5} fill="#fff" opacity={0.8} />
      <circle cx={50.5} cy={17} r={0.3} fill="#fff" opacity={0.6} />
      <circle cx={54} cy={14} r={0.8} fill="#f5e6a0" opacity={0.5} />
      {/* Art frame 4 — Portrait */}
      <rect x={65} y={9} width={10} height={14} rx={0.8} fill="none" stroke="#333" strokeWidth={0.6} />
      <rect x={66.5} y={10.5} width={7} height={11} fill="#f0e6d6" />
      <circle cx={70} cy={14} r={2.5} fill="#d4a070" opacity={0.6} />
      <rect x={68} y={17} width={4} height={4} rx={0.5} fill="#4080c0" opacity={0.5} />
      {/* Art frame 5 — Minimal shapes */}
      <rect x={82} y={10} width={13} height={13} rx={0.8} fill="none" stroke="#333" strokeWidth={0.6} />
      <rect x={83.5} y={11.5} width={10} height={10} fill="#f8f4f0" />
      <circle cx={88.5} cy={16.5} r={4} fill="none" stroke="#c94040" strokeWidth={0.8} />
      <rect x={86} y={14} width={5} height={5} fill="none" stroke="#4080c0" strokeWidth={0.6} />
      {/* Art frame 6 — Small sketch */}
      <rect x={101} y={12} width={10} height={8} rx={0.5} fill="none" stroke="#333" strokeWidth={0.5} />
      <rect x={102.5} y={13.5} width={7} height={5} fill="#e8e4dc" />
      <line x1={103} y1={18} x2={109} y2={14} stroke="#6b5b4f" strokeWidth={0.4} />
      <line x1={105} y1={18} x2={108} y2={15} stroke="#8a7a6a" strokeWidth={0.3} />
      {/* Floor */}
      <rect x={0} y={56} width={120} height={14} fill="#e8e4dc" fillOpacity={0.5} />
      {/* Pedestal with sculpture */}
      <rect x={15} y={46} width={8} height={10} rx={0.5} fill="#ddd" />
      <rect x={17} y={42} width={4} height={4} rx={0.8} fill="#aaa" />
      <ellipse cx={19} cy={41} rx={2.5} ry={1.5} fill="#999" />
      {/* Bench */}
      <rect x={50} y={52} width={20} height={2} rx={0.5} fill="#8b6f4e" />
      <rect x={52} y={54} width={2} height={5} fill="#6b5b4f" />
      <rect x={66} y={54} width={2} height={5} fill="#6b5b4f" />
      {/* Potted plant */}
      <rect x={95} y={50} width={5} height={6} rx={1} fill="#8b6f4e" />
      <circle cx={97.5} cy={48} r={3.5} fill="#4a8a4a" opacity={0.7} />
      <circle cx={95.5} cy={49} r={2} fill="#5a9a5a" opacity={0.5} />
      {/* Visitor silhouette */}
      <circle cx={38} cy={44} r={2} fill="#555" opacity={0.4} />
      <rect x={36.5} y={46} width={3} height={7} rx={1} fill="#555" opacity={0.3} />
      {/* Second visitor */}
      <circle cx={78} cy={45} r={1.8} fill="#555" opacity={0.35} />
      <rect x={76.5} y={47} width={3} height={6.5} rx={1} fill="#555" opacity={0.25} />
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
    <div className="flex h-20 border-t border-[#7a8a9a]">
      {/* Café */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Striped awning — taller with scalloped edge */}
        <div className="w-full shrink-0 relative">
          <div
            className="w-full h-3"
            style={{
              background: 'repeating-linear-gradient(90deg, #c94040, #c94040 4px, #fff 4px, #fff 8px)',
            }}
          />
          {/* Scalloped bottom edge */}
          <svg className="w-full h-1.5 block" viewBox="0 0 100 6" preserveAspectRatio="none">
            {Array.from({ length: 10 }).map((_, i) => (
              <path key={i} d={`M ${i * 10},0 Q ${i * 10 + 5},6 ${(i + 1) * 10},0`} fill={i % 2 === 0 ? '#c94040' : '#fff'} />
            ))}
          </svg>
        </div>
        <span className="text-[5px] font-bold text-[#5a4a3a] tracking-wider text-center mt-0.5 relative z-10">CAFÉ & BOOKS</span>
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
    {/* Sidewalk with patio set */}
      <div className={cn("shrink-0 select-none pointer-events-none relative z-10", isMobile ? "h-5" : "h-6")}
        style={{ background: 'linear-gradient(to bottom, #c4b8a8, #b8a998)' }}>
        {/* Patio table & chairs in front of café */}
        {(!collapsed || isMobile) && (
          <svg className="absolute left-2 top-0 h-full" viewBox="0 0 30 20" preserveAspectRatio="xMidYMid meet">
            {/* Table */}
            <rect x={10} y={6} width={10} height={1.5} rx={0.5} fill="#7a6a5a" />
            <rect x={14} y={7.5} width={2} height={8} fill="#6b5b4f" />
            <rect x={11} y={15} width={8} height={1} rx={0.5} fill="#6b5b4f" />
            {/* Chair left */}
            <rect x={4} y={8} width={5} height={1} rx={0.3} fill="#8a7a6a" />
            <rect x={5} y={9} width={1} height={6} fill="#7a6a5a" />
            <rect x={7.5} y={9} width={1} height={6} fill="#7a6a5a" />
            <rect x={4} y={5} width={1} height={4} rx={0.3} fill="#8a7a6a" />
            {/* Chair right */}
            <rect x={21} y={8} width={5} height={1} rx={0.3} fill="#8a7a6a" />
            <rect x={22} y={9} width={1} height={6} fill="#7a6a5a" />
            <rect x={24.5} y={9} width={1} height={6} fill="#7a6a5a" />
            <rect x={25} y={5} width={1} height={4} rx={0.3} fill="#8a7a6a" />
            {/* Cup on table */}
            <rect x={13} y={4.5} width={2} height={2} rx={0.5} fill="#f0e6d6" />
          </svg>
        )}
      </div>

      {/* Road */}
      <div
        className={cn("shrink-0 relative overflow-hidden select-none pointer-events-none z-20", isMobile ? "h-8" : "h-10")}
        style={{ background: '#4a4a4a', borderTop: '2px solid #3a3a3a' }}
      >
        {/* Center line */}
        <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-white/25" />

        {/* Upper lane (above center line) — right to left, raised 15px */}
        <span className="absolute z-30 text-[28px] leading-none animate-car-move-left" style={{ top: '-13px', animationDelay: '0s' }}>🚗</span>

        {/* Lower lane (below center line) — left to right, emoji flipped to face right */}
        <span className="absolute z-30 bottom-[10%] text-[28px] leading-none animate-car-move-right" style={{ animationDelay: '3s' }}>
          <span style={{ display: 'inline-block', transform: 'scaleX(-1)' }}>🚕</span>
        </span>

        {(!collapsed || isMobile) && (
          <>
            {/* Upper lane — 2nd car, raised 15px */}
            <span className="absolute z-30 text-[24px] leading-none animate-car-move-left" style={{ top: '-13px', animationDelay: '8s' }}>🚙</span>
            {/* Lower lane — minivan */}
            <span className="absolute z-30 bottom-[10%] text-[24px] leading-none animate-car-move-right" style={{ animationDelay: '12s' }}>
              <span style={{ display: 'inline-block', transform: 'scaleX(-1)' }}>🚐</span>
            </span>
          </>
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
  const { data: plazaUsers } = usePlazaUsers();
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
              <div className="bg-white px-4 py-1 rounded-[2px] border-2 border-[#7a8a9a] shadow-[2px_3px_0px_#6a7a8a] flex items-center justify-center">
                <span className="text-[8px] font-bold text-[#2a2a2a] tracking-[0.15em] text-center w-full">
                  WORSHIP ATELIER <span className="text-[6px] font-normal text-[#555]">by kworship.app</span>
                </span>
              </div>
              
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

      {/* 3F — Friends / Neighbors */}
      <div>
        {!collapsed && <FloorLabel label={language === "ko" ? "3F · 이웃" : "3F · Neighbors"} />}
        {friendStudios.length > 0 ? (
          friendStudios.map(s => (
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
          ))
        ) : (
          Array.from({ length: 3 }).map((_, i) => (
            <StudioUnit key={`empty-f-${i}`} empty compact studioName="" ownerName="" roomId="" hasUnseenStory={false} variant="friend" collapsed={collapsed} onStoryClick={() => {}} onVisit={() => {}} />
          ))
        )}
      </div>

      <div className="min-h-[6px]" />

      {/* 2F — Ambassadors */}
      <div>
        {!collapsed && <FloorLabel label={language === "ko" ? "2F · 앰배서더" : "2F · Ambassadors"} />}
        {ambassadorStudios.length > 0 ? (
          ambassadorStudios.map(s => (
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
          ))
        ) : (
          Array.from({ length: 3 }).map((_, i) => (
            <StudioUnit key={`empty-a-${i}`} empty compact studioName="" ownerName="" roomId="" hasUnseenStory={false} variant="ambassador" collapsed={collapsed} onStoryClick={() => {}} onVisit={() => {}} />
          ))
        )}
      </div>

      <div className="min-h-[6px]" />

      {/* 1F — Plaza */}
      <div>
        {!collapsed && <FloorLabel label={language === "ko" ? "1F · 광장" : "1F · Plaza"} />}
        {(plazaUsers && plazaUsers.length > 0) ? (
          plazaUsers.map(p => (
            <StudioUnit
              compact={true}
              key={p.roomId}
              avatarUrl={p.avatarUrl || undefined}
              studioName={p.studioName || p.ownerName?.split(" ")[0] || "Studio"}
              ownerName={p.ownerName || ""}
              roomId={p.roomId}
              hasUnseenStory={false}
              variant="plaza"
              collapsed={collapsed}
              onStoryClick={() => handleVisit(p.roomId)}
              onVisit={() => handleVisit(p.roomId)}
            />
          ))
        ) : (
          Array.from({ length: 3 }).map((_, i) => (
            <StudioUnit key={`empty-p-${i}`} empty compact studioName="" ownerName="" roomId="" hasUnseenStory={false} variant="plaza" collapsed={collapsed} onStoryClick={() => {}} onVisit={() => {}} />
          ))
        )}
      </div>
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
                <div className="absolute top-1 left-0 animate-cloud-drift select-none pointer-events-none text-2xl opacity-80" style={{ animationDuration: '45s' }}>☁️</div>
                <div className="absolute top-3 left-0 animate-cloud-drift select-none pointer-events-none text-lg opacity-60" style={{ animationDuration: '35s', animationDelay: '8s' }}>☁️</div>
                <div className="absolute top-5 left-0 animate-cloud-drift select-none pointer-events-none text-sm opacity-40" style={{ animationDuration: '55s', animationDelay: '15s' }}>☁️</div>
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
            {/* Spacer for string lights to extend into */}
            <div className={cn("relative z-10 shrink-0", isMobile ? "h-5" : "h-6")} />

            {/* Building wrapper */}
            <div className="relative z-10 flex flex-col flex-1 min-h-0">
              {/* Rooftop scene */}
              {(!collapsed || isMobile) && (
                <div className={cn("shrink-0 relative overflow-visible", isMobile ? "mx-6" : "mx-3")}>
                  <RooftopScene width={collapsed ? 56 : isMobile ? 200 : 232} isMobile={isMobile} />
                </div>
              )}

              {/* Building body — glass facade */}
              <div
                className={cn("flex-1 min-h-0 flex flex-col border-x border-t border-[#7a8a9a] overflow-visible relative", isMobile ? "mx-6" : "mx-3")}
                style={{
                  ...glassWallStyle,
                  boxShadow: '2px 0 8px rgba(0,0,0,0.1), -2px 0 8px rgba(0,0,0,0.1)',
                }}
              >
                {/* String lights — anchored to building body top border */}
                {(!collapsed || isMobile) && (
                  <RooftopStringLights width={collapsed ? 56 : isMobile ? 200 : 232} />
                )}
                <ScrollArea className={cn("flex-1 min-h-0 relative z-10", isMobile && "max-h-[50vh]")}>
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

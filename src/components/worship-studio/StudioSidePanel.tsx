import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useStoryBarStudios, incrementVisitCount, type StoryStudio } from "@/hooks/useStoryBarStudios";
import { usePlazaUsers } from "@/hooks/usePlazaUsers";
import { supabase } from "@/integrations/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StudioUnit } from "./StudioUnit";
import { StoryCard } from "./StoryCard";
import { ChevronLeft, ChevronRight, Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { isNightTime } from "@/lib/nightModeHelper";

/* ─── Glass facade style (day / night) ─── */
const glassWallDay: React.CSSProperties = {
  background: 'linear-gradient(to bottom, #3a3a3a 0%, #2a2a2a 50%, #222222 100%)',
};
const glassWallNight: React.CSSProperties = {
  background: 'linear-gradient(to bottom, #2a3a4a 0%, #1e2e3e 50%, #182838 100%)',
};

/* ─── Floor label — small metal plate ─── */
function FloorLabel({ label, isNight }: { label: string; isNight: boolean }) {
  return (
    <div className="flex items-center justify-center mx-2 my-0.5">
      <span className={cn(
        "text-[7px] font-bold px-1.5 py-px rounded-[2px] tracking-wider uppercase shadow-[0_1px_2px_rgba(0,0,0,0.06)]",
        isNight
          ? "text-[#8a9aaa] border border-[#4a5a6a] bg-[#1e2e3e]"
          : "text-[#c0c0c0] border border-[#555] bg-[#333]"
      )}>
        {label}
      </span>
    </div>
  );
}

/* ─── Night Sky Stars ─── */
function NightSkyStars({ width, height }: { width: number; height: number }) {
  const stars = useMemo(() => {
    const result: { x: number; y: number; r: number; opacity: number; delay: number; dur: number }[] = [];
    let seed = 42;
    const rand = () => { seed = (seed * 16807 + 0) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 180; i++) {
      // Milky Way band: diagonal density (center band has higher probability)
      const rawX = rand() * 100;
      const rawY = rand() * 85;
      // Bias towards a diagonal band from top-left to bottom-right
      const bandCenter = rawX * 0.6; // diagonal line
      const distFromBand = Math.abs(rawY - bandCenter);
      // 60% of stars cluster near the band, rest scattered
      if (i > 60 && distFromBand > 25 && rand() > 0.3) continue;
      result.push({
        x: rawX * width / 100,
        y: rawY * height / 100,
        r: 0.2 + rand() * 0.6,
        opacity: 0.3 + rand() * 0.7,
        delay: rand() * 6,
        dur: 2 + rand() * 4,
      });
    }
    return result;
  }, [width, height]);

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {/* Crescent moon */}
      <circle cx={width * 0.8} cy={height * 0.18} r={10} fill="#f5e6a0" opacity={0.9} />
      <circle cx={width * 0.8 + 4} cy={height * 0.18 - 2} r={8.5} fill="#141852" />
      {/* Moon glow */}
      <circle cx={width * 0.8} cy={height * 0.18} r={18} fill="#f5e6a0" opacity={0.06} />

      {stars.map((s, i) => (
        <circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={s.r}
          fill="#fff"
          opacity={s.opacity}
          className="animate-star-twinkle"
          style={{ animationDelay: `${s.delay}s`, animationDuration: `${s.dur}s` }}
        />
      ))}
    </svg>
  );
}

/* ─── SVG Rooftop Scene ─── */
function RooftopScene({ width, isMobile, isNight }: { width: number; isMobile: boolean; isNight: boolean }) {
  const h = isMobile ? 78 : 90;
  const floorY = h - 4;
  const spacing = width / 6;

  const parasolSets = [
    { x: spacing * 0.8, color: '#d06030' },
    { x: spacing * 1.8, color: '#c04828' },
    { x: spacing * 3, color: '#d07040' },
  ];

  const trees = [
    { x: 6, trunkH: 15, r1: 7.5, r2: 5.25 },
    { x: 22, trunkH: 10.5, r1: 5.25, r2: 3.75 },
    { x: width * 0.38, trunkH: 12, r1: 6, r2: 4.5 },
    { x: width * 0.62, trunkH: 9, r1: 4.5, r2: 3 },
    { x: width - 28, trunkH: 13.5, r1: 6.75, r2: 4.5 },
    { x: width - 10, trunkH: 10.5, r1: 5.25, r2: 3.75 },
  ];

  const stageX = spacing * 4.5;
  const stageW = spacing * 1.8;
  const stageY = floorY;

  const floorColor = isNight ? "#3a4a5a" : "#8a9aaa";
  const floorLineColor = isNight ? "#2a3a4a" : "#7a8a9a";
  const silhouetteOpacity = isNight ? 0.35 : 1;
  const railColor1 = isNight ? "#4a5a6a" : "#7a8a9a";
  const railColor2 = isNight ? "#3a4a5a" : "#6a7a8a";
  const railColor3 = isNight ? "#5a6a7a" : "#8a9aaa";

  return (
    <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} className="w-full" preserveAspectRatio="xMidYMid meet">
      {/* Rooftop floor surface */}
      <rect x={0} y={floorY} width={width} height={h - floorY} fill={floorColor} />
      <rect x={0} y={floorY} width={width} height={1} fill={floorLineColor} />

      {/* Night: Stage spotlight glow (rendered below objects) */}
      {isNight && (
        <>
          <defs>
            <radialGradient id="stageSpot" cx="50%" cy="0%" r="100%">
              <stop offset="0%" stopColor="#f5e6a0" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#f5e6a0" stopOpacity={0} />
            </radialGradient>
          </defs>
          <ellipse cx={stageX + stageW / 2} cy={stageY - 12} rx={stageW * 0.8} ry={20} fill="url(#stageSpot)" />
        </>
      )}

      {/* Trees — grounded on floor surface */}
      <g opacity={silhouetteOpacity}>
        {trees.map((t, i) => (
          <g key={`tree-${i}`}>
            <rect x={t.x - 1.5} y={floorY - t.trunkH} width={3} height={t.trunkH} rx={1.2} fill={isNight ? "#2a3020" : "#6b5b4f"} />
            <circle cx={t.x} cy={floorY - t.trunkH - t.r1 * 0.6} r={t.r1} fill={isNight ? "#1a3a1a" : "#4a8a4a"} opacity={0.85} />
            <circle cx={t.x - 3} cy={floorY - t.trunkH + 1.5} r={t.r2} fill={isNight ? "#2a4a2a" : "#5a9a5a"} opacity={0.7} />
          </g>
        ))}
      </g>




      {/* Worship Stage — stays bright at night */}
      <g>
        <rect x={stageX} y={stageY - 4.5} width={stageW} height={4.5} rx={1.5} fill={isNight ? "#e0e0e0" : "#f0f0f0"} stroke="#ccc" strokeWidth={0.75} />
        <rect x={stageX + 1.5} y={stageY - 6} width={stageW - 3} height={2.25} rx={0.75} fill={isNight ? "#f0f0f0" : "#fafafa"} stroke="#ddd" strokeWidth={0.45} />

        {/* Drum set */}
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

        {/* Acoustic guitar */}
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

        {/* Mic stand */}
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

      {/* Railing — rendered last = topmost layer (front fence) */}
      <rect x={0} y={floorY - 4.5} width={width} height={2.25} rx={0.75} fill={railColor1} />
      <rect x={0} y={floorY - 0.5} width={width} height={1.5} rx={0.45} fill={railColor2} />
      {Array.from({ length: Math.floor(width / 12) }).map((_, i) => (
        <rect key={`bal-${i}`} x={6 + i * 12} y={floorY - 4.5} width={1.8} height={5} rx={0.45} fill={railColor3} />
      ))}
    </svg>
  );
}

/* ─── SVG String Lights ─── */
function RooftopStringLights({ width, isNight }: { width: number; isNight: boolean }) {
  const poleHeight = 51;
  const svgH = poleHeight + 2;
  const poleX = width - 14;
  const poleBottomY = svgH;
  const poleTopY = svgH - poleHeight;

  const strands = [
    { endX: 10, endY: svgH - 4, cp1x: poleX - 30, cp1y: poleTopY + 14, cp2x: 25, cp2y: svgH - 18 },
    { endX: 25, endY: svgH - 1, cp1x: poleX - 22, cp1y: poleTopY + 20, cp2x: 38, cp2y: svgH - 10 },
    { endX: 45, endY: svgH + 1, cp1x: poleX - 14, cp1y: poleTopY + 28, cp2x: 50, cp2y: svgH - 4 },
  ];

  const bulbColor = isNight ? "#ffe066" : "#f5c542";
  const bulbOpacity = isNight ? 1.0 : 0.85;

  return (
    <svg
      width={width}
      height={svgH}
      className="absolute left-0 pointer-events-none z-20"
      style={{ bottom: '100%', marginBottom: '-1px' }}
      viewBox={`0 0 ${width} ${svgH}`}
      preserveAspectRatio="xMidYMax meet"
    >
      {/* Pole */}
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
                <g key={bi}>
                  <circle
                    cx={bx}
                    cy={by + 1.5}
                    r={isNight ? 2 : 1.5}
                    fill={bulbColor}
                    opacity={bulbOpacity}
                    className="animate-string-shimmer"
                    style={{ animationDelay: `${(si * 0.5 + bi * 0.25)}s` }}
                  />
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

/* ─── SVG Café Interior ─── */
function CafeSVG({ isNight }: { isNight: boolean }) {
  return (
    <svg viewBox="0 0 120 70" className="w-full h-full" preserveAspectRatio="xMidYMax meet">
      <rect x={0} y={0} width={120} height={70} fill={isNight ? "#1a1408" : "#e8f0f4"} fillOpacity={isNight ? 0.8 : 0.3} />
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
      {/* Espresso machine */}
      <rect x={80} y={30} width={12} height={14} rx={1.5} fill="#4a4a4a" />
      <rect x={81} y={28} width={10} height={3} rx={1.5} fill="#555" />
      <ellipse cx={86} cy={28} rx={4} ry={1.8} fill="#5a5a5a" />
      <rect x={82} y={38} width={3} height={2.5} rx={0.3} fill="#888" />
      <rect x={87} y={38} width={3} height={2.5} rx={0.3} fill="#888" />
      <rect x={81} y={42} width={10} height={1.5} rx={0.3} fill="#666" />
      <rect x={83} y={40} width={2.5} height={2.5} rx={0.3} fill="#f0e6d6" />
      {/* Bottles */}
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
      {/* Hanging pendant lights — brighter at night */}
      <line x1={30} y1={0} x2={30} y2={18} stroke="#333" strokeWidth={0.4} />
      <polygon points="27,18 33,18 32,22 28,22" fill="#f5c542" fillOpacity={isNight ? 0.9 : 0.5} />
      <line x1={60} y1={0} x2={60} y2={16} stroke="#333" strokeWidth={0.4} />
      <polygon points="57,16 63,16 62,20 58,20" fill="#f5c542" fillOpacity={isNight ? 0.9 : 0.5} />
      <line x1={90} y1={0} x2={90} y2={19} stroke="#333" strokeWidth={0.4} />
      <polygon points="87,19 93,19 92,23 88,23" fill="#f5c542" fillOpacity={isNight ? 0.9 : 0.5} />
      {/* Potted plant on counter */}
      <rect x={8} y={40} width={4} height={4} rx={1} fill="#8b6f4e" />
      <circle cx={10} cy={38} r={3} fill="#4a8a4a" opacity={0.7} />
    </svg>
  );
}

/* ─── SVG Gallery Interior ─── */
function GallerySVG({ isNight }: { isNight: boolean }) {
  return (
    <svg viewBox="0 0 120 70" className="w-full h-full" preserveAspectRatio="xMidYMax meet">
      <rect x={0} y={0} width={120} height={70} fill={isNight ? "#f5f0e8" : "#fafafa"} fillOpacity={isNight ? 0.7 : 0.4} />

      <g opacity={1}>
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
        {/* Art frames */}
        <rect x={6} y={10} width={16} height={12} rx={0.8} fill="none" stroke="#333" strokeWidth={0.6} />
        <rect x={7.5} y={11.5} width={13} height={9} fill="#87CEEB" />
        <polygon points="7.5,20.5 14,14 20.5,20.5" fill="#4a8a4a" />
        <polygon points="11,20.5 17,16 20.5,20.5" fill="#3a7a3a" />
        <circle cx={18} cy={13.5} r={1.5} fill="#f5c542" opacity={0.8} />
        <rect x={28} y={8} width={11} height={17} rx={0.8} fill="none" stroke="#333" strokeWidth={0.6} />
        <rect x={29.5} y={9.5} width={8} height={5} fill="#e8c040" />
        <rect x={29.5} y={14.5} width={4} height={5} fill="#4080c0" />
        <rect x={33.5} y={14.5} width={4} height={5} fill="#50a060" />
        <rect x={29.5} y={19.5} width={8} height={4} fill="#c06040" />
        <rect x={45} y={11} width={14} height={10} rx={0.8} fill="none" stroke="#333" strokeWidth={0.6} />
        <rect x={46.5} y={12.5} width={11} height={7} fill="#1a1a40" />
        <circle cx={49} cy={14.5} r={0.6} fill="#fff" opacity={0.9} />
        <circle cx={52} cy={13.5} r={0.4} fill="#fff" opacity={0.7} />
        <circle cx={54.5} cy={16} r={0.5} fill="#fff" opacity={0.8} />
        <circle cx={50.5} cy={17} r={0.3} fill="#fff" opacity={0.6} />
        <circle cx={54} cy={14} r={0.8} fill="#f5e6a0" opacity={0.5} />
        <rect x={65} y={9} width={10} height={14} rx={0.8} fill="none" stroke="#333" strokeWidth={0.6} />
        <rect x={66.5} y={10.5} width={7} height={11} fill="#f0e6d6" />
        <circle cx={70} cy={14} r={2.5} fill="#d4a070" opacity={0.6} />
        <rect x={68} y={17} width={4} height={4} rx={0.5} fill="#4080c0" opacity={0.5} />
        <rect x={82} y={10} width={13} height={13} rx={0.8} fill="none" stroke="#333" strokeWidth={0.6} />
        <rect x={83.5} y={11.5} width={10} height={10} fill="#f8f4f0" />
        <circle cx={88.5} cy={16.5} r={4} fill="none" stroke="#c94040" strokeWidth={0.8} />
        <rect x={86} y={14} width={5} height={5} fill="none" stroke="#4080c0" strokeWidth={0.6} />
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
        {/* Visitors */}
        <circle cx={38} cy={44} r={2} fill="#555" opacity={0.4} />
        <rect x={36.5} y={46} width={3} height={7} rx={1} fill="#555" opacity={0.3} />
        <circle cx={78} cy={45} r={1.8} fill="#555" opacity={0.35} />
        <rect x={76.5} y={47} width={3} height={6.5} rx={1} fill="#555" opacity={0.25} />
      </g>
    </svg>
  );
}

/* ─── G/F Commercial Units ─── */
function GroundFloorShops({ collapsed, isMobile, isNight }: { collapsed: boolean; isMobile: boolean; isNight: boolean }) {
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
    <div className={cn("flex border-t", isNight ? "border-[#3a4a5a]" : "border-[#7a8a9a]", isMobile ? "h-28" : "h-20")}>
      {/* Café — open at night */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <div className="w-full shrink-0 relative">
          <div
            className="w-full h-3"
            style={{
              background: 'repeating-linear-gradient(90deg, #c94040, #c94040 4px, #fff 4px, #fff 8px)',
            }}
          />
          <svg className="w-full h-1.5 block" viewBox="0 0 100 6" preserveAspectRatio="none">
            {Array.from({ length: 10 }).map((_, i) => (
              <path key={i} d={`M ${i * 10},0 Q ${i * 10 + 5},6 ${(i + 1) * 10},0`} fill={i % 2 === 0 ? '#c94040' : '#fff'} />
            ))}
          </svg>
        </div>
        <span
          className={cn(
            "text-[5px] font-bold tracking-wider text-center mt-0.5 relative z-10",
            isNight ? "text-[#f5c542]" : "text-[#5a4a3a]"
          )}
          style={isNight ? { textShadow: '0 0 6px #f5c542' } : undefined}
        >
          CAFÉ & BOOKS
          {isNight && <span className="ml-0.5 text-[4px]">✦ OPEN</span>}
        </span>
        <div className="flex-1 relative">
          <CafeSVG isNight={isNight} />
        </div>
        <div className="absolute bottom-0 left-1 text-[7px] animate-leaf-sway">🌿</div>
      </div>

      {/* Entrance Door */}
      <div className={cn(
        "w-6 flex flex-col items-center justify-end border-x relative",
        isNight
          ? "bg-gradient-to-b from-[#2a3a4a] to-[#1e2e3e] border-[#3a4a5a]"
          : "bg-gradient-to-b from-[#a0b8c8] to-[#8aa0b0] border-[#7a8a9a]"
      )}>
        <div className={cn(
          "flex-1 w-full relative",
          isNight
            ? "bg-gradient-to-b from-[#2a3a4a] to-[#1e2e3e]"
            : "bg-gradient-to-b from-[#a0b8c8] to-[#8aa0b0]"
        )}>
          <svg className="absolute bottom-0 w-full" viewBox="0 0 40 8" preserveAspectRatio="none">
            <path d="M 4,8 Q 20,1 36,8 Z" fill={isNight ? "#2a3a4a" : "#5a6a7a"} />
            <path d="M 6,8 Q 20,3 34,8 Z" fill={isNight ? "#3a5a6a" : "#a0c0d4"} fillOpacity={0.3} />
          </svg>
        </div>
        <div className={cn("w-5 mb-0 rounded-t-[3px] flex flex-col items-center relative overflow-hidden",
          isNight ? "bg-[#2a3a4a]" : "bg-[#5a6a7a]",
          isMobile ? "h-14" : "h-10"
        )}>
          <div className={cn("w-4 flex-1 mt-0.5 rounded-t-[2px] border",
            isNight ? "bg-[#1a2a3a]/60 border-[#3a4a5a]/50" : "bg-[#b0d0e0]/40 border-[#7a8a9a]/50"
          )} />
          <svg className="absolute right-0.5" style={{ top: '55%' }} width="4" height="4" viewBox="0 0 4 4">
            <circle cx="2" cy="2" r="1.5" fill="#b8860b" />
            <circle cx="2" cy="1.6" r="0.6" fill="#d4a830" opacity={0.7} />
          </svg>
          <div className={cn("w-full h-0.5", isNight ? "bg-[#1a2a3a]" : "bg-[#4a5a6a]")} />
        </div>
        <div className="absolute bottom-0 left-0 text-[5px]">🌱</div>
        <div className="absolute bottom-0 right-0 text-[5px]">🌱</div>
      </div>

      {/* Gallery — open at night too */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <span
          className={cn(
            "text-[5px] font-bold tracking-wider text-center mt-0.5 relative z-10",
            isNight ? "text-[#f5c542]" : "text-[#5a6a7a]"
          )}
          style={isNight ? { textShadow: '0 0 6px #f5c542' } : undefined}
        >
          GALLERY
          {isNight && <span className="ml-0.5 text-[4px]">✦ OPEN</span>}
        </span>
        <div className="flex-1 relative">
          <GallerySVG isNight={isNight} />
        </div>
      </div>
    </div>
  );
}

/* ─── Animated Road ─── */
function AnimatedRoad({ collapsed, isMobile, isNight }: { collapsed: boolean; isMobile: boolean; isNight: boolean }) {
  const roadColor = isNight ? "#2a2a2a" : "#4a4a4a";
  const roadBorder = isNight ? "#1a1a1a" : "#3a3a3a";
  const sidewalkBg = isNight
    ? "linear-gradient(to bottom, #6a6050, #5a5040)"
    : "linear-gradient(to bottom, #c4b8a8, #b8a998)";

  return (
    <div className="relative shrink-0 overflow-hidden">
      {/* Sidewalk */}
      <div className={cn("select-none pointer-events-none relative", isMobile ? "h-3" : "h-4")}
        style={{ background: sidewalkBg }}>
        {(!collapsed || isMobile) && (
          <svg className="absolute left-2 top-0 h-full" viewBox="0 0 30 20" preserveAspectRatio="xMidYMid meet">
            <rect x={10} y={6} width={10} height={1.5} rx={0.5} fill="#7a6a5a" />
            <rect x={14} y={7.5} width={2} height={8} fill="#6b5b4f" />
            <rect x={11} y={15} width={8} height={1} rx={0.5} fill="#6b5b4f" />
            <rect x={4} y={8} width={5} height={1} rx={0.3} fill="#8a7a6a" />
            <rect x={5} y={9} width={1} height={6} fill="#7a6a5a" />
            <rect x={7.5} y={9} width={1} height={6} fill="#7a6a5a" />
            <rect x={4} y={5} width={1} height={4} rx={0.3} fill="#8a7a6a" />
            <rect x={21} y={8} width={5} height={1} rx={0.3} fill="#8a7a6a" />
            <rect x={22} y={9} width={1} height={6} fill="#7a6a5a" />
            <rect x={24.5} y={9} width={1} height={6} fill="#7a6a5a" />
            <rect x={25} y={5} width={1} height={4} rx={0.3} fill="#8a7a6a" />
            <rect x={13} y={4.5} width={2} height={2} rx={0.5} fill="#f0e6d6" />
          </svg>
        )}
      </div>

      {/* Road */}
      <div
        className={cn("relative select-none pointer-events-none", isMobile ? "h-8" : "h-10")}
        style={{ background: roadColor, borderTop: `2px solid ${roadBorder}` }}
      >
        <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-white/25" />
        {/* Car moving left — headlight on left side */}
        <span className="absolute z-10 text-[28px] leading-none animate-car-move-left" style={{ top: '-13px', animationDelay: '0s' }}>
          {isNight && <span className="absolute" style={{ left: '-8px', top: '10px', width: '12px', height: '6px', background: 'radial-gradient(ellipse at right, rgba(255,230,100,0.8), rgba(255,230,100,0.3) 40%, transparent 100%)', borderRadius: '50%', pointerEvents: 'none' }} />}
          {isNight && <span className="absolute" style={{ left: '-20px', top: '6px', width: '24px', height: '10px', background: 'radial-gradient(ellipse at right, rgba(255,230,100,0.25), transparent 80%)', borderRadius: '50%', pointerEvents: 'none' }} />}
          🚗
        </span>
        {/* Car moving right — headlight on right side (car is flipped) */}
        <span className="absolute z-10 bottom-[10%] text-[28px] leading-none animate-car-move-right" style={{ animationDelay: '3s' }}>
          {isNight && <span className="absolute" style={{ right: '-8px', top: '10px', width: '12px', height: '6px', background: 'radial-gradient(ellipse at left, rgba(255,230,100,0.8), rgba(255,230,100,0.3) 40%, transparent 100%)', borderRadius: '50%', pointerEvents: 'none' }} />}
          {isNight && <span className="absolute" style={{ right: '-20px', top: '6px', width: '24px', height: '10px', background: 'radial-gradient(ellipse at left, rgba(255,230,100,0.25), transparent 80%)', borderRadius: '50%', pointerEvents: 'none' }} />}
          <span style={{ display: 'inline-block', transform: 'scaleX(-1)' }}>🚕</span>
        </span>
        {(!collapsed || isMobile) && (
          <>
            <span className="absolute z-10 text-[24px] leading-none animate-car-move-left" style={{ top: '-13px', animationDelay: '8s' }}>
              {isNight && <span className="absolute" style={{ left: '-7px', top: '8px', width: '10px', height: '5px', background: 'radial-gradient(ellipse at right, rgba(255,230,100,0.8), rgba(255,230,100,0.3) 40%, transparent 100%)', borderRadius: '50%', pointerEvents: 'none' }} />}
              {isNight && <span className="absolute" style={{ left: '-18px', top: '5px', width: '20px', height: '8px', background: 'radial-gradient(ellipse at right, rgba(255,230,100,0.25), transparent 80%)', borderRadius: '50%', pointerEvents: 'none' }} />}
              🚙
            </span>
            <span className="absolute z-10 bottom-[10%] text-[24px] leading-none animate-car-move-right" style={{ animationDelay: '12s' }}>
              {isNight && <span className="absolute" style={{ right: '-7px', top: '8px', width: '10px', height: '5px', background: 'radial-gradient(ellipse at left, rgba(255,230,100,0.8), rgba(255,230,100,0.3) 40%, transparent 100%)', borderRadius: '50%', pointerEvents: 'none' }} />}
              {isNight && <span className="absolute" style={{ right: '-18px', top: '5px', width: '20px', height: '8px', background: 'radial-gradient(ellipse at left, rgba(255,230,100,0.25), transparent 80%)', borderRadius: '50%', pointerEvents: 'none' }} />}
              <span style={{ display: 'inline-block', transform: 'scaleX(-1)' }}>🚐</span>
            </span>
          </>
        )}
      </div>
    </div>
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
  const { user, profile } = useAuth();
  const studios = useStoryBarStudios(myStudioId);
  const { data: plazaUsers } = usePlazaUsers();
  const [storyIndex, setStoryIndex] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const isSheet = mode === "sheet";
  const isMobile = mode === "mobile";
  const rooftopRef = useRef<HTMLDivElement>(null);
  const [rooftopWidth, setRooftopWidth] = useState(200);

  /* ─── Night mode: auto from timezone + manual toggle ─── */
  const autoNight = useMemo(() => isNightTime(profile?.timezone ?? null), [profile?.timezone]);
  const [isNight, setIsNight] = useState(autoNight);

  // Sync with timezone on reconnect / profile change
  useEffect(() => {
    setIsNight(autoNight);
  }, [autoNight]);

  useEffect(() => {
    if (!isMobile) return;
    const el = rooftopRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      if (entry) setRooftopWidth(entry.contentRect.width);
    });
    ro.observe(el);
    setRooftopWidth(el.clientWidth);
    return () => ro.disconnect();
  }, [isMobile]);

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
              <div className="px-4 py-1 rounded-[2px] border-2 border-[#7a8a9a] shadow-[2px_3px_0px_#6a7a8a] flex items-center justify-center bg-white">
                <span className="text-[8px] font-bold tracking-[0.15em] text-center w-full text-[#2a2a2a]">
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
            isNight={isNight}
            onStoryClick={() => handleStoryClick(myStudio)}
            onVisit={onMyStudioSelect}
          />
        </div>
      )}

      {/* 3F — Friends / Neighbors */}
      <div>
        {!collapsed && <FloorLabel label={language === "ko" ? "3F · 이웃" : "3F · Neighbors"} isNight={isNight} />}
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
              isNight={isNight}
              onStoryClick={() => handleStoryClick(s)}
              onVisit={() => handleVisit(s.id)}
            />
          ))
        ) : (
          Array.from({ length: 3 }).map((_, i) => (
            <StudioUnit key={`empty-f-${i}`} empty compact studioName="" ownerName="" roomId="" hasUnseenStory={false} variant="friend" collapsed={collapsed} isNight={isNight} onStoryClick={() => {}} onVisit={() => {}} />
          ))
        )}
      </div>

      <div className="min-h-[6px]" />

      {/* 2F — Ambassadors */}
      <div>
        {!collapsed && <FloorLabel label={language === "ko" ? "2F · 앰배서더" : "2F · Ambassadors"} isNight={isNight} />}
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
              isNight={isNight}
              onStoryClick={() => handleStoryClick(s)}
              onVisit={() => handleVisit(s.id)}
            />
          ))
        ) : (
          Array.from({ length: 3 }).map((_, i) => (
            <StudioUnit key={`empty-a-${i}`} empty compact studioName="" ownerName="" roomId="" hasUnseenStory={false} variant="ambassador" collapsed={collapsed} isNight={isNight} onStoryClick={() => {}} onVisit={() => {}} />
          ))
        )}
      </div>

      <div className="min-h-[6px]" />

      {/* 1F — Plaza */}
      <div>
        {!collapsed && <FloorLabel label={language === "ko" ? "1F · 광장" : "1F · Plaza"} isNight={isNight} />}
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
              isNight={isNight}
              onStoryClick={() => handleVisit(p.roomId)}
              onVisit={() => handleVisit(p.roomId)}
            />
          ))
        ) : (
          Array.from({ length: 3 }).map((_, i) => (
            <StudioUnit key={`empty-p-${i}`} empty compact studioName="" ownerName="" roomId="" hasUnseenStory={false} variant="plaza" collapsed={collapsed} isNight={isNight} onStoryClick={() => {}} onVisit={() => {}} />
          ))
        )}
      </div>
    </>
  );

  const showBuilding = mode === "sidebar" || isMobile;

  const skyDay = 'linear-gradient(to bottom, #87CEEB 0%, #b8d9f0 40%, #daeeff 100%)';
  const skyNight = 'linear-gradient(to bottom, #0a0e2a 0%, #141852 40%, #1a1a40 100%)';

  return (
    <>
      <div className={cn(
        "relative",
        isSheet ? "w-full" : isMobile
          ? "w-full flex flex-col h-full"
          : `${collapsed ? "w-14" : "w-64"} shrink-0 flex flex-col h-full transition-all duration-300 ease-in-out`
      )}>
        {/* Sky background */}
        {showBuilding && (
          <div
            className="absolute inset-0 z-0 overflow-hidden transition-colors duration-700"
            style={{ background: isNight ? skyNight : skyDay }}
          >
            {/* Day: clouds */}
            {!isNight && (!collapsed || isMobile) && (
              <>
                <div className="absolute top-1 left-0 animate-cloud-drift select-none pointer-events-none text-2xl opacity-80" style={{ animationDuration: '45s' }}>☁️</div>
                <div className="absolute top-3 left-0 animate-cloud-drift select-none pointer-events-none text-lg opacity-60" style={{ animationDuration: '35s', animationDelay: '8s' }}>☁️</div>
                <div className="absolute top-5 left-0 animate-cloud-drift select-none pointer-events-none text-sm opacity-40" style={{ animationDuration: '55s', animationDelay: '15s' }}>☁️</div>
              </>
            )}
            {/* Night: stars + moon */}
            {isNight && (!collapsed || isMobile) && (
              <NightSkyStars width={300} height={200} />
            )}
          </div>
        )}

        {/* Day/Night toggle button */}
        {showBuilding && (!collapsed || isMobile) && (
          <button
            onClick={() => setIsNight(n => !n)}
            className={cn(
              "absolute top-2 left-2 z-40 rounded-full p-1.5 shadow-sm transition-colors",
              isNight
                ? "bg-[#1a1a40]/80 text-[#f5e6a0] hover:bg-[#2a2a50]/80 border border-[#3a3a5a]"
                : "bg-white/80 text-[#f5a020] hover:bg-white border border-[#ddd]"
            )}
            title={isNight ? "Switch to day" : "Switch to night"}
          >
            {isNight ? <Sun size={14} /> : <Moon size={14} />}
          </button>
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
            {/* Spacer for string lights */}
            <div className={cn("relative z-10 shrink-0", isMobile ? "h-2" : "h-6")} />

            {/* Building wrapper */}
            <div className="relative z-10 flex flex-col flex-1 min-h-0">
              {/* Rooftop scene */}
              {(!collapsed || isMobile) && (
                <div ref={isMobile ? rooftopRef : undefined} className={cn("shrink-0 relative overflow-visible", isMobile ? "mx-6" : "mx-3")}>
                  <RooftopScene width={collapsed ? 56 : isMobile ? rooftopWidth : 232} isMobile={isMobile} isNight={isNight} />
                </div>
              )}

              {/* Building body — glass facade */}
              <div
                className={cn(
                  "min-h-0 flex flex-col border-x border-t overflow-visible relative transition-colors duration-700",
                  isNight ? "border-[#3a4a5a]" : "border-[#7a8a9a]",
                  isMobile ? "mx-6 flex-1 min-h-0" : "mx-3 flex-1"
                )}
                style={{
                  ...(isNight ? glassWallNight : glassWallDay),
                  boxShadow: isNight
                    ? '2px 0 8px rgba(0,0,0,0.3), -2px 0 8px rgba(0,0,0,0.3)'
                    : '2px 0 8px rgba(0,0,0,0.1), -2px 0 8px rgba(0,0,0,0.1)',
                }}
              >
                {/* String lights */}
                {(!collapsed || isMobile) && (
                  <RooftopStringLights width={collapsed ? 56 : isMobile ? 200 : 232} isNight={isNight} />
                )}
                <ScrollArea className="flex-1 min-h-0 relative z-10">
                  {buildingContent}
                </ScrollArea>
              </div>

              {/* G/F Ground Floor */}
              <div className={cn(
                "shrink-0 border-x transition-colors duration-700",
                isNight ? "border-[#3a4a5a] bg-[#1e2e3e]" : "border-[#7a8a9a] bg-[#e4ecf2]",
                isMobile ? "mx-6" : "mx-3"
              )}>
                <GroundFloorShops collapsed={collapsed} isMobile={isMobile} isNight={isNight} />
              </div>

              {/* Animated Road */}
              <AnimatedRoad collapsed={collapsed} isMobile={isMobile} isNight={isNight} />
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

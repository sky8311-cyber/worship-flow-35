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
  backgroundImage: 'linear-gradient(to bottom, #d0e0ec, #b8ccd8), repeating-linear-gradient(90deg, transparent, transparent 38px, rgba(255,255,255,0.18) 38px, rgba(255,255,255,0.18) 39px)',
  backgroundBlendMode: 'normal',
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

/* ─── SVG Rooftop Trees ─── */
function RooftopTree({ x, height = 40 }: { x: number; height?: number }) {
  const crownR = height * 0.35;
  const trunkH = height * 0.45;
  return (
    <g transform={`translate(${x}, 0)`}>
      {/* Trunk */}
      <rect x={-2} y={-trunkH} width={4} height={trunkH} rx={1} fill="#6b5b4f" />
      {/* Crown */}
      <circle cx={0} cy={-trunkH - crownR * 0.6} r={crownR} fill="#5a8a5a" opacity={0.9} />
      <circle cx={-crownR * 0.5} cy={-trunkH - crownR * 0.3} r={crownR * 0.7} fill="#4a7a4a" opacity={0.7} />
      <circle cx={crownR * 0.4} cy={-trunkH - crownR * 0.4} r={crownR * 0.6} fill="#6a9a6a" opacity={0.8} />
    </g>
  );
}

/* ─── SVG String Lights from pole ─── */
function RooftopStringLights({ width, height }: { width: number; height: number }) {
  const poleX = width - 14;
  const poleTop = 4;
  const poleBottom = height - 2;
  // 3 strands draping from top of pole down-left
  const strands = [
    { endX: 10, endY: height * 0.55, cp1x: poleX - 20, cp1y: poleTop + 5, cp2x: 30, cp2y: height * 0.3 },
    { endX: 25, endY: height * 0.7, cp1x: poleX - 15, cp1y: poleTop + 10, cp2x: 40, cp2y: height * 0.5 },
    { endX: 45, endY: height * 0.85, cp1x: poleX - 10, cp1y: poleTop + 18, cp2x: 55, cp2y: height * 0.65 },
  ];

  return (
    <svg width={width} height={height} className="absolute inset-0 pointer-events-none" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {/* Pole */}
      <rect x={poleX - 1.5} y={poleTop} width={3} height={poleBottom - poleTop} rx={1} fill="#6b5b4f" />
      {/* Small flag/ornament at top */}
      <polygon points={`${poleX + 1.5},${poleTop} ${poleX + 8},${poleTop + 3} ${poleX + 1.5},${poleTop + 6}`} fill="#c94040" opacity={0.7} />

      {/* Wire strands with bulbs */}
      {strands.map((s, si) => {
        const path = `M ${poleX},${poleTop + 2} C ${s.cp1x},${s.cp1y} ${s.cp2x},${s.cp2y} ${s.endX},${s.endY}`;
        // Place bulbs along the curve
        const bulbCount = 5 + si;
        return (
          <g key={si}>
            <path d={path} fill="none" stroke="#4a4a4a" strokeWidth={0.8} opacity={0.5} />
            {Array.from({ length: bulbCount }).map((_, bi) => {
              const t = (bi + 1) / (bulbCount + 1);
              // Approximate point on cubic bezier
              const mt = 1 - t;
              const bx = mt * mt * mt * poleX + 3 * mt * mt * t * s.cp1x + 3 * mt * t * t * s.cp2x + t * t * t * s.endX;
              const by = mt * mt * mt * (poleTop + 2) + 3 * mt * mt * t * s.cp1y + 3 * mt * t * t * s.cp2y + t * t * t * s.endY;
              return (
                <circle
                  key={bi}
                  cx={bx}
                  cy={by + 1.5}
                  r={1.8}
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
      {/* Glass window bg */}
      <rect x={0} y={0} width={80} height={50} fill="#e8f0f4" fillOpacity={0.3} />
      {/* Curtain left */}
      <path d="M 0,0 Q 6,10 3,50" fill="#c94040" fillOpacity={0.25} />
      {/* Curtain right */}
      <path d="M 80,0 Q 74,10 77,50" fill="#c94040" fillOpacity={0.25} />
      {/* Counter */}
      <rect x={5} y={32} width={70} height={4} rx={1} fill="#8b6f4e" />
      {/* Coffee machine */}
      <rect x={55} y={18} width={14} height={14} rx={2} fill="#4a4a4a" />
      <rect x={58} y={20} width={8} height={4} rx={1} fill="#666" />
      <circle cx={62} cy={28} r={2} fill="#888" />
      {/* Cups on counter */}
      <rect x={12} y={28} width={5} height={5} rx={1} fill="#f0e6d6" />
      <rect x={20} y={29} width={4} height={4} rx={1} fill="#e8dcc8" />
      {/* Stool */}
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
      {/* White gallery wall */}
      <rect x={0} y={0} width={80} height={50} fill="#fafafa" fillOpacity={0.4} />
      {/* Track lighting */}
      <rect x={5} y={2} width={70} height={1.5} rx={0.5} fill="#555" />
      <circle cx={18} cy={3} r={1.5} fill="#f5c542" fillOpacity={0.7} />
      <circle cx={40} cy={3} r={1.5} fill="#f5c542" fillOpacity={0.7} />
      <circle cx={62} cy={3} r={1.5} fill="#f5c542" fillOpacity={0.7} />
      {/* Light beams */}
      <polygon points="18,4 12,20 24,20" fill="#f5c542" fillOpacity={0.06} />
      <polygon points="40,4 34,20 46,20" fill="#f5c542" fillOpacity={0.06} />
      <polygon points="62,4 56,20 68,20" fill="#f5c542" fillOpacity={0.06} />
      {/* Art frame 1 - landscape */}
      <rect x={8} y={10} width={20} height={16} rx={1} fill="none" stroke="#333" strokeWidth={0.8} />
      <rect x={10} y={12} width={16} height={12} fill="#c4a47a" />
      <circle cx={20} cy={16} r={3} fill="#e8c97a" />
      <rect x={10} y={20} width={16} height={4} fill="#6a8a5a" />
      {/* Art frame 2 - portrait */}
      <rect x={33} y={8} width={14} height={22} rx={1} fill="none" stroke="#333" strokeWidth={0.8} />
      <rect x={35} y={10} width={10} height={18} fill="#8ab0d0" />
      <circle cx={40} cy={16} r={3} fill="#c06060" />
      {/* Art frame 3 - small */}
      <rect x={54} y={12} width={18} height={14} rx={1} fill="none" stroke="#333" strokeWidth={0.8} />
      <rect x={56} y={14} width={14} height={10} fill="#d0a0c0" />
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
          className="w-full h-2.5 shrink-0"
          style={{
            background: 'repeating-linear-gradient(90deg, #c94040, #c94040 4px, #fff 4px, #fff 8px)',
          }}
        />
        <span className="text-[6px] font-bold text-[#5a4a3a] tracking-wider text-center mt-0.5 relative z-10">CAFÉ</span>
        <div className="flex-1 relative">
          <CafeSVG />
        </div>
        {/* Flower pot outside */}
        <div className="absolute bottom-0 left-1 text-[7px] animate-leaf-sway">🌿</div>
      </div>

      {/* Entrance Door */}
      <div className="w-10 flex flex-col items-center justify-end bg-gradient-to-b from-[#a0b8c8] to-[#8aa0b0] border-x border-[#7a8a9a] relative">
        {/* Arch top */}
        <svg className="absolute top-0 w-full" viewBox="0 0 40 12" preserveAspectRatio="none">
          <path d="M 0,12 Q 20,0 40,12 Z" fill="#5a6a7a" />
          <path d="M 2,12 Q 20,2 38,12 Z" fill="#a0c0d4" fillOpacity={0.4} />
        </svg>
        {/* Door frame */}
        <div className="w-7 flex-1 mt-3 mb-0 bg-[#5a6a7a] rounded-t-[3px] flex flex-col items-center justify-center relative overflow-hidden">
          {/* Glass panel */}
          <div className="w-5 flex-1 mt-1 bg-[#b0d0e0]/40 rounded-t-[2px] border border-[#7a8a9a]/50" />
          {/* Handle */}
          <div className="w-0.5 h-2 bg-[#c0a060] rounded-full mb-1 mt-0.5" />
        </div>
        {/* Plants beside door */}
        <div className="absolute bottom-0 left-0 text-[5px]">🌱</div>
        <div className="absolute bottom-0 right-0 text-[5px]">🌱</div>
      </div>

      {/* Gallery */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <span className="text-[6px] font-bold text-[#5a6a7a] tracking-wider text-center mt-1 relative z-10">GALLERY</span>
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
      <div className={cn("shrink-0 flex items-end justify-around px-1 select-none pointer-events-none", isMobile ? "h-3" : "h-4")}
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
        className={cn("shrink-0 relative overflow-hidden select-none pointer-events-none", isMobile ? "h-6" : "h-8")}
        style={{ background: '#4a4a4a', borderTop: '2px solid #3a3a3a' }}
      >
        {/* Center line */}
        <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-white/25" />
        {/* Animated cars */}
        <span className="absolute top-[2px] text-[11px] animate-car-move-right" style={{ animationDelay: '0s' }}>🚗</span>
        <span className="absolute bottom-[2px] text-[10px] animate-car-move-left" style={{ animationDelay: '3s', transform: 'scaleX(-1)' }}>🚕</span>
        {(!collapsed || isMobile) && (
          <span className="absolute top-[2px] text-[9px] animate-car-move-right" style={{ animationDelay: '8s' }}>🚙</span>
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
      {/* ROOFTOP — My Studio */}
      {myStudio && (
        <div className="px-0.5 relative">
          {!collapsed && (
            <div className="flex items-center justify-around px-2 py-0.5 select-none">
              <span className="text-[10px]">⛱️</span>
              <FloorLabel label="ROOFTOP" />
              <span className="text-[10px]">⛱️</span>
            </div>
          )}
          <StudioUnit
            compact={false}
            avatarUrl={myAvatarUrl}
            studioName={language === "ko" ? "내 스튜디오" : "My Studio"}
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
            {/* Rooftop area with neon sign + string lights + trees */}
            <div className={cn("relative z-10 shrink-0", isMobile ? "h-20" : "h-24")}>
              {/* Neon signage */}
              <div className="flex flex-col items-center justify-end h-full pb-1">
                {(!collapsed || isMobile) && (
                  <div className="flex flex-col items-center relative w-full">
                    <div
                      className="bg-[#3a3a4a] px-3 py-1 rounded-sm shadow-lg animate-neon-glow relative z-10"
                      style={{
                        boxShadow: '0 2px 12px rgba(180,210,240,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
                      }}
                    >
                      <span
                        className="text-[9px] font-bold text-[#a0d0f0] tracking-[0.2em] uppercase"
                        style={{
                          textShadow: '0 0 8px rgba(160,200,240,0.6), 0 0 16px rgba(160,200,240,0.3)',
                        }}
                      >
                        WORSHIP ATELIER
                      </span>
                    </div>
                  </div>
                )}
                {collapsed && !isMobile && <div className="h-2" />}
              </div>

              {/* String lights from pole + Trees (SVG overlay) */}
              {(!collapsed || isMobile) && (
                <>
                  <RooftopStringLights width={collapsed ? 56 : 256} height={isMobile ? 80 : 96} />
                  {/* Trees */}
                  <svg className="absolute bottom-0 left-0 pointer-events-none" width={collapsed ? 56 : 256} height={isMobile ? 80 : 96} viewBox={`0 0 ${collapsed ? 56 : 256} ${isMobile ? 80 : 96}`}>
                    <RooftopTree x={18} height={28} />
                    <RooftopTree x={collapsed ? 40 : 60} height={22} />
                  </svg>
                </>
              )}
            </div>

            {/* Building wrapper */}
            <div className="relative z-10 flex flex-col flex-1 min-h-0">
              {/* Building body — glass facade */}
              <div
                className={cn("flex-1 min-h-0 flex flex-col border-x border-t border-[#7a8a9a] rounded-t-md overflow-hidden", isMobile ? "mx-6" : "mx-3")}
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

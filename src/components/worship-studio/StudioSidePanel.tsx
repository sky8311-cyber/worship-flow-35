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

/* ─── Brick wall texture style ─── */
const brickWallStyle = {
  backgroundColor: '#f5f0e8',
  backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 15px, #e8ddd0 15px, #e8ddd0 16px), repeating-linear-gradient(90deg, transparent, transparent 30px, #e8ddd0 30px, #e8ddd0 31px)',
};

/* ─── Floor label — small metal plate ─── */
function FloorLabel({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center mx-2 my-0.5">
      <span className="text-[7px] font-bold text-[#8a7a6a] border border-[#c4b8a8] bg-[#ede8df] px-1.5 py-px rounded-[1px] tracking-wider uppercase shadow-[0_1px_2px_rgba(0,0,0,0.06)]">
        {label}
      </span>
    </div>
  );
}

/* ─── String Lights ─── */
function StringLights({ count = 7 }: { count?: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5 py-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="w-1 h-1 rounded-full bg-amber-300 animate-string-shimmer"
          style={{ animationDelay: `${i * 0.3}s` }}
        />
      ))}
    </div>
  );
}

/* ─── G/F Commercial Units ─── */
function GroundFloorShops({ collapsed, isMobile }: { collapsed: boolean; isMobile: boolean }) {
  if (collapsed && !isMobile) {
    return (
      <div className="flex flex-col items-center gap-0.5 py-1 text-[6px] text-[#5a4a3a]">
        <span>☕</span>
        <span>🖼️</span>
        <span>🎭</span>
      </div>
    );
  }

  return (
    <div className="flex h-16 border-t border-[#3a2f28]">
      {/* Café */}
      <div className="flex-1 flex flex-col items-center border-r border-[#c4b8a8] bg-[#f5f0e8] overflow-hidden">
        {/* Striped awning */}
        <div
          className="w-full h-2.5 shrink-0"
          style={{
            background: 'repeating-linear-gradient(90deg, #c94040, #c94040 4px, #f5f0e8 4px, #f5f0e8 8px)',
          }}
        />
        <span className="text-[6px] font-bold text-[#5a4a3a] tracking-wider mt-0.5">CAFÉ</span>
        <div className="flex-1 flex items-center justify-center gap-1">
          <span className="text-[10px]">☕</span>
          <span className="text-[8px] animate-leaf-sway inline-block">🌸</span>
        </div>
      </div>

      {/* Gallery */}
      <div className="flex-1 flex flex-col items-center border-r border-[#c4b8a8] bg-[#faf8f4] overflow-hidden">
        <span className="text-[6px] font-bold text-[#5a4a3a] tracking-wider mt-1">GALLERY</span>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-5 h-4 border border-[#c4b8a8] bg-white flex items-center justify-center">
            <span className="text-[8px]">🖼️</span>
          </div>
        </div>
      </div>

      {/* Theatre */}
      <div className="flex-1 flex flex-col items-center bg-[#3a2f28] overflow-hidden relative">
        {/* Marquee bulbs */}
        <div className="flex gap-1 mt-0.5">
          {[0, 1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="w-[3px] h-[3px] rounded-full bg-amber-300 animate-bulb-twinkle"
              style={{ animationDelay: `${i * 0.3}s` }}
            />
          ))}
        </div>
        <span className="text-[6px] font-bold text-amber-200/90 tracking-wider mt-0.5"
          style={{ textShadow: '0 0 4px rgba(245,190,80,0.5)' }}>
          THEATRE
        </span>
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[10px]">🎭</span>
        </div>
        {/* Bottom bulbs */}
        <div className="flex gap-1 mb-0.5">
          {[0, 1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="w-[3px] h-[3px] rounded-full bg-amber-300 animate-bulb-twinkle"
              style={{ animationDelay: `${i * 0.3 + 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Animated Road ─── */
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
        <span className="absolute bottom-[2px] text-[10px] animate-car-move-left" style={{ animationDelay: '3s' }}>🚕</span>
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
      {/* ROOFTOP — My Studio with parasols */}
      {myStudio && (
        <div className="px-0.5">
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
            className="absolute top-2 right-0 translate-x-1/2 z-40 bg-[#faf7f2] border border-[#e8e0d5] rounded-full p-1 text-[#b8902a] hover:bg-amber-50 shadow-sm transition-colors"
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
            {/* Neon signage */}
            <div className={cn("relative z-10 shrink-0 flex flex-col items-center justify-end", isMobile ? "h-12" : "h-14")}>
              {(!collapsed || isMobile) && (
                <div className="flex flex-col items-center">
                  <div
                    className="bg-[#3a2f28] px-3 py-1 rounded-sm shadow-lg animate-neon-glow"
                    style={{
                      boxShadow: '0 2px 12px rgba(245,190,80,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
                    }}
                  >
                    <span
                      className="text-[9px] font-bold text-amber-200/90 tracking-[0.2em] uppercase"
                      style={{
                        textShadow: '0 0 8px rgba(245,190,80,0.6), 0 0 16px rgba(245,190,80,0.3)',
                      }}
                    >
                      WORSHIP ATELIER
                    </span>
                  </div>
                  {/* String lights under signage */}
                  <StringLights count={7} />
                </div>
              )}
              {collapsed && !isMobile && <div className="h-2" />}
            </div>

            {/* Building wrapper */}
            <div className={cn("relative z-10 flex flex-col flex-1 min-h-0", isMobile ? "mx-6" : "mx-3")}>
              {/* Building body — cream exterior with brick texture */}
              <div
                className="flex-1 min-h-0 flex flex-col border-x border-t border-[#d4c5a9] rounded-t-md overflow-hidden"
                style={{
                  ...brickWallStyle,
                  boxShadow: '2px 0 8px rgba(0,0,0,0.08), -2px 0 8px rgba(0,0,0,0.08)',
                }}
              >
                <ScrollArea className="flex-1 min-h-0">
                  {buildingContent}
                </ScrollArea>
              </div>

              {/* G/F Ground Floor — Commercial Units */}
              <div className="shrink-0 border-x border-[#d4c5a9]" style={brickWallStyle}>
                <GroundFloorShops collapsed={collapsed} isMobile={isMobile} />
              </div>

              {/* Animated Road */}
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

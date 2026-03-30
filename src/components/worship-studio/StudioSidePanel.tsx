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
  backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 15px, #e8ddd0 15px, #e8ddd0 16px)',
};

/* ─── Floor label component ─── */
function FloorLabel({ label }: { label: string }) {
  return (
    <div className="relative flex items-center mx-1 my-0.5">
      <div className="flex-1 h-px bg-[#d4c5a9]" />
      <span className="text-[7px] font-bold text-[#a89070] bg-[#f5f0e8] px-1.5 tracking-wider uppercase">
        {label}
      </span>
      <div className="flex-1 h-px bg-[#d4c5a9]" />
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
        <div>
          {!collapsed && <FloorLabel label="ROOFTOP" />}
          <StudioUnit
            compact={isSheet || isMobile}
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
              compact={isSheet || isMobile}
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
                compact={isSheet || isMobile}
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

      <div className="flex-1 min-h-[24px]" />

      {/* 1F — Ambassadors */}
      {ambassadorStudios.length > 0 ? (
        <div>
          {!collapsed && <FloorLabel label={language === "ko" ? "1F · 앰배서더" : "1F · Ambassadors"} />}
          {ambassadorStudios.map(s => (
            <StudioUnit
              compact={isSheet || isMobile}
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
                compact={isSheet || isMobile}
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
        {/* Sky background */}
        {showBuilding && (
          <div
            className="absolute inset-0 z-0 overflow-hidden"
            style={{ background: 'linear-gradient(to bottom, #87CEEB 0%, #b8d9f0 40%, #daeeff 100%)' }}
          >
            {(!collapsed || isMobile) && (
              <>
                <div className="absolute top-3 left-3 text-2xl opacity-80 select-none pointer-events-none">☁️</div>
                <div className="absolute top-8 right-2 text-lg opacity-60 select-none pointer-events-none">☁️</div>
                <div className="absolute top-16 left-8 text-sm opacity-40 select-none pointer-events-none">☁️</div>
                {isMobile && (
                  <>
                    <div className="absolute top-5 right-16 text-xl opacity-50 select-none pointer-events-none">☁️</div>
                    <div className="absolute top-12 left-24 text-base opacity-35 select-none pointer-events-none">☁️</div>
                  </>
                )}
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
            {/* Backlit signage — postmodern atelier style */}
            <div className={cn("relative z-10 shrink-0 flex flex-col items-center justify-end", isMobile ? "h-12" : "h-14")}>
              {(!collapsed || isMobile) && (
                <div className="flex flex-col items-center">
                  <div
                    className="bg-[#3a2f28] px-3 py-1 rounded-sm shadow-lg"
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
                  {/* LED accent line */}
                  <div className="w-20 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent mt-0.5" />
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

              {/* Divider between tenants and ground floor */}
              <div className="shrink-0 border-t-2 border-[#3a2f28] mx-0" />

              {/* 1F Entrance — semicircular arch + dark brown doors */}
              <div
                className="shrink-0 border-x border-[#d4c5a9] px-2 pt-3 pb-0"
                style={brickWallStyle}
              >
                {(!collapsed || isMobile) ? (
                  <>
                    {/* Badges row */}
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="text-[7px] font-bold border border-[#3a2f28] bg-[#f5f0e8] text-[#3a2f28] px-1 py-0.5 rounded-sm">
                        Worship Atelier
                      </div>
                      <div className="text-[7px] font-bold border border-[#3a2f28] bg-[#f5f0e8] text-[#3a2f28] px-1 py-0.5 rounded-sm">
                        kworship.app
                      </div>
                    </div>
                    {/* Semicircular arch entrance */}
                    <div className="flex flex-col items-center">
                      {/* Arch frame */}
                      <div className="w-16 h-4 border-t-2 border-x-2 border-[#3a2f28] rounded-t-full bg-amber-50/30" />
                      {/* Double doors */}
                      <div className="flex gap-px -mt-px">
                        <div className="w-8 h-8 border border-[#3a2f28] bg-[#5a4a3a] relative">
                          <div className="absolute inset-1 bg-amber-50/40 rounded-[1px]" />
                          <div className="absolute right-1.5 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-amber-300/80" />
                        </div>
                        <div className="w-8 h-8 border border-[#3a2f28] bg-[#5a4a3a] relative">
                          <div className="absolute inset-1 bg-amber-50/40 rounded-[1px]" />
                          <div className="absolute left-1.5 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-amber-300/80" />
                        </div>
                      </div>
                      {/* Stairs */}
                      <div className="w-20 h-1.5 bg-[#e8ddd0] border-t border-[#d4c5a9]" />
                      <div className="w-24 h-1.5 bg-[#e8ddd0] border-t border-[#d4c5a9]" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-8 h-2 border-t border-x border-[#3a2f28] rounded-t-full bg-amber-50/30" />
                    <div className="flex gap-px -mt-px">
                      <div className="w-4 h-10 border border-[#3a2f28] bg-[#5a4a3a] relative">
                        <div className="absolute inset-0.5 bg-amber-50/40" />
                        <div className="absolute right-0.5 top-1/2 -translate-y-1/2 w-0.5 h-0.5 rounded-full bg-amber-300/80" />
                      </div>
                      <div className="w-4 h-10 border border-[#3a2f28] bg-[#5a4a3a] relative">
                        <div className="absolute inset-0.5 bg-amber-50/40" />
                        <div className="absolute left-0.5 top-1/2 -translate-y-1/2 w-0.5 h-0.5 rounded-full bg-amber-300/80" />
                      </div>
                    </div>
                    <div className="w-10 h-1.5 bg-[#e8ddd0] border-t border-[#d4c5a9]" />
                  </div>
                )}
              </div>

              {/* Plant pots & lawn strip */}
              <div
                className={cn("shrink-0 flex items-center justify-around px-1 select-none pointer-events-none border-x border-[#d4c5a9]", isMobile ? "h-3" : "h-4")}
                style={{ background: 'linear-gradient(to bottom, #6aaf50, #4a8f35)' }}
              >
                {(!collapsed || isMobile) && (
                  <>
                    <span className="text-[8px]">🪴</span>
                    <span className="text-[8px]">🌿</span>
                    <span className="text-[8px]">🪴</span>
                    <span className="text-[8px]">🌿</span>
                    {isMobile && (
                      <>
                        <span className="text-[8px]">🪴</span>
                        <span className="text-[8px]">🌿</span>
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Sidewalk */}
              <div className="h-2 shrink-0 select-none pointer-events-none" style={{ background: '#a89070' }} />

              {/* Road bar */}
              <div
                className={cn("shrink-0 flex items-center px-2 select-none pointer-events-none overflow-hidden relative", isMobile ? "h-6" : "h-8")}
                style={{ background: '#4a4a4a', borderTop: '2px solid #3a3a3a' }}
              >
                <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-white/25" />
                <span className="absolute left-1 text-[11px]">🚗</span>
                <span className="absolute left-8 text-[9px]">🚙</span>
                {(!collapsed || isMobile) && (
                  <>
                    <span className="absolute right-6 text-[10px]">🚕</span>
                    <span className="absolute right-1 text-[12px]">🚌</span>
                    {isMobile && (
                      <span className="absolute left-20 text-[10px]">🚐</span>
                    )}
                  </>
                )}
              </div>
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

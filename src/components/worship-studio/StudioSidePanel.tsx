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
import { GothicRoof } from "./GothicRoof";
import { GothicEntrance } from "./GothicEntrance";

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

  // Fetch current user's profile avatar (covers email signups who set avatar via settings)
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

  const usePlaceholderFriends = friendStudios.length === 0;
  const usePlaceholderAmbassadors = ambassadorStudios.length === 0;

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
      {/* PENTHOUSE — My Studio */}
      {myStudio && (
        <div className={collapsed ? "" : ""}>
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

      {/* FRIENDS — real or placeholder */}
      {friendStudios.length > 0 ? (
        <div>
          {!collapsed && (
            <div className="px-2 pt-1 pb-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                {language === "ko" ? "이웃" : "Neighbors"}
              </p>
            </div>
          )}
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
          {!collapsed && (
            <div className="px-2 pt-1 pb-0">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                {language === "ko" ? "이웃" : "Neighbors"}
              </p>
            </div>
          )}
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

      <div className="flex-1 min-h-[8px]" />

      {/* COMMERCIAL — Ambassadors: real or placeholder */}
      {ambassadorStudios.length > 0 ? (
        <div>
          {!collapsed && (
            <div className="px-2 pt-1.5 pb-0.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                {language === "ko" ? "앰배서더" : "Ambassadors"}
              </p>
            </div>
          )}
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
          {!collapsed && (
            <div className="px-2 pt-1.5 pb-0.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                {language === "ko" ? "앰배서더" : "Ambassadors"}
              </p>
            </div>
          )}
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
      {/* Panel container */}
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
            {/* Rooftop sign — floating above building */}
            {/* Building wrapper — roof + body share same margins */}
            <div className={cn("relative z-10 flex flex-col flex-1 min-h-0", isMobile ? "mx-6" : "mx-3")}>
              {/* Gothic Roof — Triple Lancet Arches */}
              <div className="shrink-0">
                <GothicRoof collapsed={collapsed && !isMobile} isMobile={isMobile} />
              </div>
              {/* Building body — Sandstone Gothic facade */}
              <div
                className="flex-1 min-h-0 flex flex-col border-x border-[#b8a88a] overflow-hidden"
                style={{
                  background: 'linear-gradient(to bottom, #e8ddd0, #ddd2c0 50%, #d4c5a9)',
                  backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 23px, rgba(138,122,106,0.08) 23px, rgba(138,122,106,0.08) 24px)',
                  boxShadow: '2px 0 8px rgba(0,0,0,0.08)',
                }}
              >
                <ScrollArea className="flex-1 min-h-0">
                  {buildingContent}
                </ScrollArea>
              </div>

              {/* Stone cornice divider */}
              <div className="shrink-0 h-2 border-x border-[#b8a88a]" style={{
                background: 'linear-gradient(to right, #c8b89a, #d4c5a9, #c8b89a)',
                borderTop: '1px solid #8a7a6a',
                borderBottom: '1px solid #8a7a6a',
              }} />

              {/* 1F Ground Floor — Gothic Entrance */}
              <div className="shrink-0 border-x border-[#b8a88a]" style={{
                background: '#c8b89a',
              }}>
                <GothicEntrance collapsed={collapsed && !isMobile} isMobile={isMobile} />
              </div>

              {/* Stone plinth */}
              <div
                className="shrink-0 h-2 border-x border-[#b8a88a] select-none pointer-events-none"
                style={{
                   background: '#a89070',
                  backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 11px, rgba(138,122,106,0.15) 11px, rgba(138,122,106,0.15) 12px), repeating-linear-gradient(0deg, transparent, transparent 5px, rgba(138,122,106,0.1) 5px, rgba(138,122,106,0.1) 6px)',
                }}
              />

              {/* Sidewalk */}
              <div className="h-1 shrink-0 select-none pointer-events-none" style={{ background: '#a89070' }} />

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

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useStoryBarStudios, incrementVisitCount, type StoryStudio } from "@/hooks/useStoryBarStudios";
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

interface StudioSidePanelProps {
  myStudioId?: string;
  onStudioSelect: (roomId: string) => void;
  onMyStudioSelect: () => void;
  mode?: "sidebar" | "sheet";
}

export function StudioSidePanel({ myStudioId, onStudioSelect, onMyStudioSelect, mode = "sidebar" }: StudioSidePanelProps) {
  const { language } = useTranslation();
  const { user } = useAuth();
  const studios = useStoryBarStudios(myStudioId);
  const [storyIndex, setStoryIndex] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const isSheet = mode === "sheet";

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
            compact={isSheet}
            avatarUrl={user?.user_metadata?.avatar_url || myStudio.avatarUrl || undefined}
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
            <div className="px-2 pt-2 pb-0.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                {language === "ko" ? "친구" : "Friends"}
              </p>
            </div>
          )}
          {friendStudios.map(s => (
            <StudioUnit
              compact={isSheet}
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
            <div className="px-2 pt-2 pb-0.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                {language === "ko" ? "이웃" : "Neighbors"}
              </p>
            </div>
          )}
          {PLACEHOLDER_FRIENDS.map(t => (
            <div key={t.id} className="opacity-60 pointer-events-none select-none">
              <StudioUnit
                compact={isSheet}
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
              compact={isSheet}
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
                compact={isSheet}
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

  return (
    <>
      {/* Panel container */}
      <div className={cn(
        "relative",
        isSheet ? "w-full" : `${collapsed ? "w-14" : "w-64"} shrink-0 flex flex-col h-full transition-all duration-300 ease-in-out`
      )}>
        {/* Sky background */}
        {!isSheet && (
          <div
            className="absolute inset-0 z-0 overflow-hidden"
            style={{ background: 'linear-gradient(to bottom, #87CEEB 0%, #b8d9f0 40%, #daeeff 100%)' }}
          >
            {!collapsed && (
              <>
                <div className="absolute top-3 left-3 text-2xl opacity-80 select-none pointer-events-none">☁️</div>
                <div className="absolute top-8 right-2 text-lg opacity-60 select-none pointer-events-none">☁️</div>
                <div className="absolute top-16 left-8 text-sm opacity-40 select-none pointer-events-none">☁️</div>
              </>
            )}
          </div>
        )}

        {/* Collapse toggle */}
        {!isSheet && (
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
            <div className="relative z-10 h-12 shrink-0 flex flex-col items-center justify-end">
              {!collapsed && (
                <>
                  <div className="border border-black bg-white px-2 py-0.5 text-[8px] font-bold tracking-wider text-black rounded-sm shadow-sm">
                    K-Worship Studio
                  </div>
                  {/* Poles */}
                  <div className="flex gap-6">
                    <div className="w-px h-2 bg-[#555]" />
                    <div className="w-px h-2 bg-[#555]" />
                  </div>
                </>
              )}
              {collapsed && <div className="h-2" />}
            </div>

            {/* Building wrapper with mx-3 to reveal sky on sides */}
            <div className="relative z-10 mx-3 flex flex-col flex-1 min-h-0">
              {/* Building body */}
              <div
                className="flex-1 min-h-0 flex flex-col bg-gradient-to-b from-slate-50 via-[#faf7f2] to-stone-100 border-x border-t border-[#d8cfc4] rounded-t-xl overflow-hidden"
                style={{
                  boxShadow: '0 -3px 0 0 #b8902a, 2px 0 8px rgba(0,0,0,0.08)',
                }}
              >
                <ScrollArea className="flex-1 min-h-0">
                  {buildingContent}
                </ScrollArea>
              </div>

              {/* Divider between tenants and ground floor */}
              <div className="shrink-0 border-t border-[#8a7a6a]/60 mx-0" />

              {/* 1F Ground Floor */}
              <div className="shrink-0 bg-[#e8ddd0] border-x border-[#d8cfc4] px-2 pt-1.5 pb-0">
                {!collapsed ? (
                  <>
                    {/* Badges row */}
                    <div className="flex justify-between items-center mb-1">
                      <div className="text-[7px] font-bold border border-black bg-white px-1 py-0.5 rounded-sm">
                        K-Worship Studio
                      </div>
                      <div className="text-[7px] font-bold border border-black bg-white px-1 py-0.5 rounded-sm">
                        kworship.app
                      </div>
                    </div>
                    {/* Door + Stairs centered */}
                    <div className="flex flex-col items-center">
                      <div className="flex gap-px">
                        <div className="w-6 h-12 rounded-none border border-[#5a5a5a] bg-sky-100/60 relative">
                          <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-[#5a5a5a]" />
                        </div>
                        <div className="w-6 h-12 rounded-none border border-[#5a5a5a] bg-sky-100/60 relative">
                          <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-[#5a5a5a]" />
                        </div>
                      </div>
                      <div className="w-16 h-1.5 bg-[#c8b89a] border-t border-[#a89070]" />
                      <div className="w-20 h-1.5 bg-[#c8b89a] border-t border-[#a89070]" />
                      <div className="w-24 h-1.5 bg-[#c8b89a] border-t border-[#a89070]" />
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="flex gap-px">
                      <div className="w-4 h-10 rounded-none border border-[#5a5a5a] bg-sky-100/60 relative">
                        <div className="absolute right-0.5 top-1/2 -translate-y-1/2 w-0.5 h-0.5 rounded-full bg-[#5a5a5a]" />
                      </div>
                      <div className="w-4 h-10 rounded-none border border-[#5a5a5a] bg-sky-100/60 relative">
                        <div className="absolute left-0.5 top-1/2 -translate-y-1/2 w-0.5 h-0.5 rounded-full bg-[#5a5a5a]" />
                      </div>
                    </div>
                    <div className="w-10 h-1.5 bg-[#c8b89a] border-t border-[#a89070]" />
                    <div className="w-12 h-1.5 bg-[#c8b89a] border-t border-[#a89070]" />
                  </div>
                )}
              </div>

              {/* Lawn / garden strip */}
              <div
                className="h-4 shrink-0 flex items-center justify-around px-1 select-none pointer-events-none border-x border-[#d8cfc4]"
                style={{ background: 'linear-gradient(to bottom, #6aaf50, #4a8f35)' }}
              >
                {!collapsed && (
                  <>
                    <span className="text-[8px]">🌷</span>
                    <span className="text-[8px]">🌿</span>
                    <span className="text-[8px]">🌷</span>
                    <span className="text-[8px]">🌿</span>
                  </>
                )}
              </div>

              {/* Sidewalk */}
              <div className="h-2 shrink-0 select-none pointer-events-none" style={{ background: '#a89070' }} />

              {/* Road bar */}
              <div
                className="h-8 shrink-0 flex items-center px-2 select-none pointer-events-none overflow-hidden relative"
                style={{ background: '#4a4a4a', borderTop: '2px solid #3a3a3a' }}
              >
                <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-white/25" />
                <span className="absolute left-1 text-[11px]">🚗</span>
                <span className="absolute left-8 text-[9px]">🚙</span>
                {!collapsed && (
                  <>
                    <span className="absolute right-6 text-[10px]">🚕</span>
                    <span className="absolute right-1 text-[12px]">🚌</span>
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

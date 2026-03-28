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
  { id: 'ph1', name: '김찬양', initials: '김', floor: '6F', icon: '🎵', windowsOn: true,  variant: 'friend' as const },
  { id: 'ph2', name: '박워십', initials: '박', floor: '5F', icon: '🎹', windowsOn: false, variant: 'friend' as const },
  { id: 'ph3', name: '이예배', initials: '이', floor: '5F', icon: '🙏', windowsOn: true,  variant: 'friend' as const },
  { id: 'ph4', name: '최성령', initials: '최', floor: '4F', icon: '🕊️', windowsOn: true,  variant: 'friend' as const },
  { id: 'ph5', name: '정은혜', initials: '정', floor: '4F', icon: '✝️', windowsOn: false, variant: 'friend' as const },
  { id: 'ph6', name: '한찬미', initials: '한', floor: '3F', icon: '🎶', windowsOn: true,  variant: 'friend' as const },
  { id: 'ph7', name: '오다윗', initials: '오', floor: '3F', icon: '🎸', windowsOn: false, variant: 'friend' as const },
  { id: 'ph8', name: '새벽이슬 워십',   initials: '새', floor: '2F', icon: '🌅', windowsOn: true,  variant: 'ambassador' as const },
  { id: 'ph9', name: '시온찬양단',       initials: '시', floor: '2F', icon: '🏛️', windowsOn: true,  variant: 'ambassador' as const },
  { id: 'ph10', name: '다윗의장막 밴드', initials: '다', floor: '1F', icon: '🎺', windowsOn: false, variant: 'ambassador' as const },
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

  // Group placeholder friends by floor for floor labels
  const groupedPlaceholderFriends = PLACEHOLDER_FRIENDS.reduce<Record<string, typeof PLACEHOLDER_FRIENDS>>((acc, t) => {
    (acc[t.floor] ??= []).push(t);
    return acc;
  }, {});

  const groupedPlaceholderAmbassadors = PLACEHOLDER_AMBASSADORS.reduce<Record<string, typeof PLACEHOLDER_AMBASSADORS>>((acc, t) => {
    (acc[t.floor] ??= []).push(t);
    return acc;
  }, {});

  return (
    <>
      <div
        className={cn(
          isSheet
            ? "w-full overflow-auto"
            : `${collapsed ? "w-14" : "w-56"} relative overflow-visible border-r border-[#e8e0d5] bg-gradient-to-b from-slate-50 via-[#faf7f2] to-stone-50 shadow-[inset_-2px_0_4px_rgba(184,144,42,0.06)] flex flex-col shrink-0 h-full transition-all duration-300 ease-in-out`
        )}
      >
        {/* Collapse toggle — sidebar only */}
        {!isSheet && (
          <button
            onClick={() => setCollapsed(c => !c)}
            className="absolute top-2 right-0 translate-x-1/2 z-20 bg-[#faf7f2] border border-[#e8e0d5] rounded-full p-1 text-[#b8902a] hover:bg-amber-50 shadow-sm transition-colors"
          >
            {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
          </button>
        )}

        <ScrollArea className="flex-1">
          {/* ROOFTOP GARDEN */}
          {!collapsed && (
            <div className="flex items-end justify-center gap-0.5 py-1 select-none pointer-events-none">
              <span className="text-xs">🌿</span>
              <span className="text-base">🌳</span>
              <span className="text-xs">🌿</span>
            </div>
          )}

          {/* PENTHOUSE — My Studio */}
          {myStudio && (
            <div className={collapsed ? "" : "mx-3"}>
              {!collapsed && (
                <div className="flex items-center justify-between px-1 pb-0.5">
                  <span className="text-[9px] font-mono text-amber-500 bg-amber-100 px-1 rounded">PH</span>
                </div>
              )}
              <StudioUnit
                avatarUrl={user?.user_metadata?.avatar_url}
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
            <div className={collapsed ? "" : "mx-1"}>
              {!collapsed && (
                <div className="flex items-center justify-between px-2 pt-2 pb-1">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                    {language === "ko" ? "친구" : "Friends"}
                  </p>
                  <span className="text-[9px] font-mono text-slate-400 bg-slate-100 px-1 rounded">2F</span>
                </div>
              )}
              <div className="border-t border-border/30" />
              {friendStudios.map(s => (
                <StudioUnit
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
            <div className={collapsed ? "" : "mx-1"}>
              {Object.entries(groupedPlaceholderFriends)
                .sort(([a], [b]) => parseInt(b) - parseInt(a)) // 6F first, then 5F, etc.
                .map(([floor, tenants], gi) => (
                  <div key={floor}>
                    {!collapsed && (
                      <div className="flex items-center justify-between px-2 pt-1.5 pb-0.5">
                        {gi === 0 && (
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                            {language === "ko" ? "이웃" : "Neighbors"}
                          </p>
                        )}
                        {gi !== 0 && <span />}
                        <span className="text-[9px] font-mono text-slate-400 bg-slate-100 px-1 rounded">{floor}</span>
                      </div>
                    )}
                    {gi === 0 && <div className="border-t border-border/30" />}
                    {tenants.map(t => (
                      <div key={t.id} className="opacity-60 pointer-events-none select-none">
                        <StudioUnit
                          studioName={`${t.icon} ${t.name}`}
                          ownerName={t.name}
                          roomId={t.id}
                          hasUnseenStory={false}
                          variant="friend"
                          collapsed={collapsed}
                          placeholderInitials={t.initials}
                          forceWindowsOn={t.windowsOn}
                          onStoryClick={() => {}}
                          onVisit={() => {}}
                        />
                      </div>
                    ))}
                  </div>
                ))}
            </div>
          )}

          <div className="flex-1 min-h-[40px]" />
        </ScrollArea>

        {/* Separator between friends and ambassadors */}
        <div className="mx-2 my-1 border-t border-dashed border-[#e0d8cc]" />

        {/* COMMERCIAL — Ambassadors: real or placeholder */}
        {ambassadorStudios.length > 0 ? (
          <div className="mt-auto border-t border-border/40 mx-0">
            {!collapsed && (
              <div className="flex items-center justify-between px-2 pt-1.5 pb-0.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                  {language === "ko" ? "앰배서더" : "Ambassadors"}
                </p>
                <span className="text-[9px] font-mono text-slate-300 bg-slate-50 px-1 rounded">1F</span>
              </div>
            )}
            {ambassadorStudios.map(s => (
              <StudioUnit
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
          <div className="mt-auto mx-0">
            {Object.entries(groupedPlaceholderAmbassadors)
              .sort(([a], [b]) => parseInt(b) - parseInt(a))
              .map(([floor, tenants], gi) => (
                <div key={floor}>
                  {!collapsed && (
                    <div className="flex items-center justify-between px-2 pt-1.5 pb-0.5">
                      {gi === 0 && (
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                          {language === "ko" ? "앰배서더" : "Ambassadors"}
                        </p>
                      )}
                      {gi !== 0 && <span />}
                      <span className="text-[9px] font-mono text-slate-300 bg-slate-50 px-1 rounded">{floor}</span>
                    </div>
                  )}
                  {tenants.map(t => (
                    <div key={t.id} className="opacity-60 pointer-events-none select-none">
                      <StudioUnit
                        studioName={`${t.icon} ${t.name}`}
                        ownerName={t.name}
                        roomId={t.id}
                        hasUnseenStory={false}
                        variant="ambassador"
                        collapsed={collapsed}
                        placeholderInitials={t.initials}
                        forceWindowsOn={t.windowsOn}
                        onStoryClick={() => {}}
                        onVisit={() => {}}
                      />
                    </div>
                  ))}
                </div>
              ))}
          </div>
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

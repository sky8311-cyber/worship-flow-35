import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useStoryBarStudios, incrementVisitCount, type StoryStudio } from "@/hooks/useStoryBarStudios";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StudioUnit } from "./StudioUnit";
import { StoryCard } from "./StoryCard";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface StudioSidePanelProps {
  myStudioId?: string;
  onStudioSelect: (roomId: string) => void;
  onMyStudioSelect: () => void;
}

export function StudioSidePanel({ myStudioId, onStudioSelect, onMyStudioSelect }: StudioSidePanelProps) {
  const { language } = useTranslation();
  const { user } = useAuth();
  const studios = useStoryBarStudios(myStudioId);
  const [storyIndex, setStoryIndex] = useState<number | null>(null);
  const [collapsed, setCollapsed] = useState(false);

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

  return (
    <>
      <div
        className={`${collapsed ? "w-14" : "w-56"} relative overflow-visible border-r border-[#e8e0d5] bg-gradient-to-b from-slate-50 via-[#faf7f2] to-stone-50 shadow-[inset_-2px_0_4px_rgba(184,144,42,0.06)] flex flex-col shrink-0 h-full transition-all duration-300 ease-in-out`}
      >
        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="absolute top-2 right-0 translate-x-1/2 z-20 bg-[#faf7f2] border border-[#e8e0d5] rounded-full p-1 text-[#b8902a] hover:bg-amber-50 shadow-sm transition-colors"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

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

          {/* FRIENDS */}
          {friendStudios.length > 0 && (
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
          )}

          <div className="flex-1 min-h-[40px]" />
        </ScrollArea>

        {/* COMMERCIAL — Ambassadors pinned to bottom */}
        {ambassadorStudios.length > 0 && (
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

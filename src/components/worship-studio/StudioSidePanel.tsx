import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useStoryBarStudios, incrementVisitCount, type StoryStudio } from "@/hooks/useStoryBarStudios";
import { ScrollArea } from "@/components/ui/scroll-area";
import { StudioUnit } from "./StudioUnit";
import { StoryCard } from "./StoryCard";

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
      <div className="w-64 border-r border-border/40 bg-[hsl(var(--background))] flex flex-col shrink-0 h-full">
        <ScrollArea className="flex-1">
          {/* PENTHOUSE — My Studio */}
          {myStudio && (
            <StudioUnit
              avatarUrl={user?.user_metadata?.avatar_url}
              studioName={language === "ko" ? "내 스튜디오" : "My Studio"}
              ownerName={user?.user_metadata?.full_name || user?.email?.split("@")[0] || ""}
              roomId={myStudio.id}
              hasUnseenStory={myStudio.hasNewPosts}
              variant="penthouse"
              onStoryClick={() => handleStoryClick(myStudio)}
              onVisit={onMyStudioSelect}
            />
          )}

          {/* FRIENDS */}
          {friendStudios.length > 0 && (
            <>
              <div className="border-t border-border/30" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider px-3 pt-2 pb-1 font-medium">
                {language === "ko" ? "친구" : "Friends"}
              </p>
              {friendStudios.map(s => (
                <StudioUnit
                  key={s.id}
                  avatarUrl={s.avatarUrl || undefined}
                  studioName={s.ownerName?.split(" ")[0] || "Studio"}
                  ownerName={s.ownerName || ""}
                  roomId={s.id}
                  hasUnseenStory={s.hasNewPosts}
                  variant="friend"
                  onStoryClick={() => handleStoryClick(s)}
                  onVisit={() => handleVisit(s.id)}
                />
              ))}
            </>
          )}

          {/* Spacer to push ambassadors to bottom */}
          <div className="flex-1 min-h-[40px]" />
        </ScrollArea>

        {/* COMMERCIAL — Ambassadors pinned to bottom */}
        {ambassadorStudios.length > 0 && (
          <div className="mt-auto border-t border-border/40">
            {ambassadorStudios.map(s => (
              <StudioUnit
                key={s.id}
                avatarUrl={s.avatarUrl || undefined}
                studioName={s.ownerName?.split(" ")[0] || "Studio"}
                ownerName={s.ownerName || ""}
                roomId={s.id}
                hasUnseenStory={s.hasNewPosts}
                variant="ambassador"
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

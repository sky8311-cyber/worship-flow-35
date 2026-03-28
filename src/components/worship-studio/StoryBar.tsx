import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { useStoryBarStudios, incrementVisitCount, type StoryStudio } from "@/hooks/useStoryBarStudios";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Music } from "lucide-react";
import { cn } from "@/lib/utils";
import { StoryCard } from "./StoryCard";

interface StoryBarProps {
  onStudioSelect: (studioId: string) => void;
  myStudioId?: string;
}

export function StoryBar({ onStudioSelect, myStudioId }: StoryBarProps) {
  const { user } = useAuth();
  const { language } = useTranslation();
  const studios = useStoryBarStudios(myStudioId);
  const [storyIndex, setStoryIndex] = useState<number | null>(null);

  if (studios.length === 0) return null;

  const handleBubbleTap = (index: number) => {
    const studio = studios[index];
    incrementVisitCount(studio.id);
    setStoryIndex(index);
  };

  const handleVisit = (roomId: string) => {
    setStoryIndex(null);
    onStudioSelect(roomId);
  };

  return (
    <>
      <div className="border-b border-border/40 bg-[#faf7f2] dark:bg-background/80 backdrop-blur-sm">
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-3 px-4 py-3 min-w-max">
            {studios.map((studio, i) => (
              <button
                key={studio.id}
                onClick={() => handleBubbleTap(i)}
                className="flex flex-col items-center gap-1 w-16 shrink-0"
              >
                <div className="relative">
                  <div
                    className={cn(
                      "rounded-full p-[2px]",
                      studio.isSelf
                        ? "ring-2 ring-[#b8902a] ring-offset-1"
                        : studio.hasNewPosts
                          ? "bg-gradient-to-tr from-primary to-primary/70"
                          : "bg-border"
                    )}
                  >
                    <Avatar className="h-12 w-12 border-2 border-background">
                      <AvatarImage
                        src={
                          studio.isSelf
                            ? user?.user_metadata?.avatar_url
                            : studio.avatarUrl || undefined
                        }
                      />
                      <AvatarFallback className="text-xs">
                        {studio.isSelf
                          ? "나"
                          : (studio.ownerName?.charAt(0) || "?")}
                      </AvatarFallback>
                    </Avatar>
                  </div>

                  {/* BGM badge */}
                  {studio.bgmSongTitle && (
                    <span className="absolute -bottom-0.5 -right-0.5 bg-primary text-primary-foreground rounded-full w-4 h-4 flex items-center justify-center">
                      <Music className="h-2.5 w-2.5" />
                    </span>
                  )}

                  {/* Status emoji badge */}
                  {studio.statusEmoji && !studio.bgmSongTitle && (
                    <span className="absolute -bottom-0.5 -right-0.5 text-xs leading-none">
                      {studio.statusEmoji}
                    </span>
                  )}
                </div>

                <span className="text-[10px] text-muted-foreground truncate w-full text-center">
                  {studio.isSelf
                    ? (language === "ko" ? "나" : "Me")
                    : (studio.ownerName?.split(" ")[0] || "")}
                </span>
              </button>
            ))}
          </div>
        </div>
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

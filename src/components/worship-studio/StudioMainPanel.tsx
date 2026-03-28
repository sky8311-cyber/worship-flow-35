import { useState, useEffect } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useIsMobile } from "@/hooks/use-mobile";
import { useStudioSpaces } from "@/hooks/useStudioSpaces";
import { SpaceTabBar } from "./spaces/SpaceTabBar";
import { SpaceCreateDialog } from "./spaces/SpaceCreateDialog";
import { SpaceCanvas } from "./spaces/SpaceCanvas";
import { cn } from "@/lib/utils";

interface StudioMainPanelProps {
  myStudioId?: string | null;
  selectedStudioId?: string | null;
  onStudioSelect?: (roomId: string) => void;
}

export function StudioMainPanel({
  myStudioId,
  selectedStudioId,
  onStudioSelect,
}: StudioMainPanelProps) {
  const { language } = useTranslation();
  const isMobile = useIsMobile();

  const isOwnStudio = !selectedStudioId || selectedStudioId === myStudioId;
  const currentRoomId = selectedStudioId || myStudioId || undefined;

  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null);
  const { data: spaces = [] } = useStudioSpaces(currentRoomId);

  // Reset active space when room changes
  useEffect(() => {
    setActiveSpaceId(null);
  }, [currentRoomId]);

  // Auto-select first space
  useEffect(() => {
    if (spaces.length > 0 && !activeSpaceId) {
      setActiveSpaceId(spaces[0].id);
    }
  }, [spaces, activeSpaceId]);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[hsl(var(--background))] relative">
      {/* Space Tab Bar */}
      <SpaceTabBar
        roomId={currentRoomId}
        activeSpaceId={activeSpaceId}
        onSpaceSelect={setActiveSpaceId}
        isOwner={isOwnStudio}
      />

      {/* Canvas area */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {activeSpaceId ? (
          <SpaceCanvas spaceId={activeSpaceId} isOwner={isOwnStudio} />
        ) : (
          <div className="flex-1 flex items-center justify-center h-full py-20 text-muted-foreground text-sm">
            {language === "ko"
              ? "첫 공간을 만들어보세요 ✨"
              : "Create your first space ✨"}
          </div>
        )}
      </div>
    </div>
  );
}

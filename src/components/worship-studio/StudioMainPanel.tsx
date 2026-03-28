import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, LayoutGrid } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useStudioSpaces } from "@/hooks/useStudioSpaces";
import { useSpaceBlocks } from "@/hooks/useSpaceBlocks";
import { SpaceTabBar } from "./spaces/SpaceTabBar";
import { SpaceCanvas } from "./spaces/SpaceCanvas";
import { SpaceBlockPicker } from "./spaces/SpaceBlockPicker";

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

  const isOwnStudio = !selectedStudioId || selectedStudioId === myStudioId;
  const currentRoomId = selectedStudioId || myStudioId || undefined;

  const [activeSpaceId, setActiveSpaceId] = useState<string | null>(null);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const { data: spaces = [] } = useStudioSpaces(currentRoomId);
  const { data: blocks = [] } = useSpaceBlocks(activeSpaceId || undefined);

  const selectedBlock = blocks.find(b => b.id === selectedBlockId) || null;

  // Reset on room change
  useEffect(() => {
    setActiveSpaceId(null);
    setSelectedBlockId(null);
  }, [currentRoomId]);

  // Auto-select first space
  useEffect(() => {
    if (spaces.length > 0 && !activeSpaceId) {
      setActiveSpaceId(spaces[0].id);
    }
  }, [spaces, activeSpaceId]);

  // Clear selection on space change
  useEffect(() => {
    setSelectedBlockId(null);
  }, [activeSpaceId]);

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[hsl(var(--background))] relative">
      <SpaceTabBar
        roomId={currentRoomId}
        activeSpaceId={activeSpaceId}
        onSpaceSelect={setActiveSpaceId}
        isOwner={isOwnStudio}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {activeSpaceId ? (
          <>
            <SpaceCanvas
              spaceId={activeSpaceId}
              isOwner={isOwnStudio}
              selectedBlockId={selectedBlockId}
              onSelectBlock={setSelectedBlockId}
            />

            {/* Right panel toggle button */}
            {isOwnStudio && (
              <button
                onClick={() => setRightPanelOpen(o => !o)}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-[hsl(var(--background))] border border-border rounded-l-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent shadow-sm transition-colors"
                style={{ right: rightPanelOpen ? undefined : 0, ...(rightPanelOpen ? { right: '240px' } : {}) }}
              >
                {rightPanelOpen ? <ChevronRight size={14} /> : <LayoutGrid size={14} />}
              </button>
            )}

            {/* Right panel */}
            {isOwnStudio && rightPanelOpen && (
              <SpaceBlockPicker
                spaceId={activeSpaceId}
                selectedBlock={selectedBlock}
                onBlockDeleted={() => setSelectedBlockId(null)}
              />
            )}
          </>
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

import { useState, useEffect, useCallback } from "react";
import { LayoutGrid, Plus } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useStudioSpaces } from "@/hooks/useStudioSpaces";
import { useSpaceBlocks, useUpdateBlock } from "@/hooks/useSpaceBlocks";
import { useIsMobile } from "@/hooks/use-mobile";
import { SpaceTabBar } from "./spaces/SpaceTabBar";
import { SpaceCanvas } from "./spaces/SpaceCanvas";
import { SpaceBlockPicker } from "./spaces/SpaceBlockPicker";
import { Drawer, DrawerContent, DrawerTrigger } from "@/components/ui/drawer";
import type { SpaceBlock as SpaceBlockType } from "@/hooks/useSpaceBlocks";

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
  const [isEditMode, setIsEditMode] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState<Map<string, Partial<SpaceBlockType>>>(new Map());
  const { data: spaces = [] } = useStudioSpaces(currentRoomId);
  const { data: blocks = [] } = useSpaceBlocks(activeSpaceId || undefined);
  const updateBlock = useUpdateBlock();

  const selectedBlock = blocks.find(b => b.id === selectedBlockId) || null;

  // Reset on room change
  useEffect(() => {
    setActiveSpaceId(null);
    setSelectedBlockId(null);
    setIsEditMode(false);
    setPendingUpdates(new Map());
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
    setIsEditMode(false);
    setPendingUpdates(new Map());
  }, [activeSpaceId]);

  const handlePendingUpdate = useCallback((id: string, updates: Partial<SpaceBlockType>) => {
    setPendingUpdates(prev => {
      const next = new Map(prev);
      next.set(id, { ...(prev.get(id) || {}), ...updates });
      return next;
    });
  }, []);

  const handleSaveEdits = useCallback(() => {
    if (!activeSpaceId) return;
    pendingUpdates.forEach((updates, id) => {
      updateBlock.mutate({ id, spaceId: activeSpaceId, ...updates });
    });
    setPendingUpdates(new Map());
    setIsEditMode(false);
  }, [activeSpaceId, pendingUpdates, updateBlock]);

  const handleCancelEdits = useCallback(() => {
    setPendingUpdates(new Map());
    setIsEditMode(false);
  }, []);

  const handleToggleEditMode = useCallback(() => {
    setIsEditMode(true);
  }, []);

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
              isEditMode={isEditMode}
              onToggleEditMode={handleToggleEditMode}
              onSaveEdits={handleSaveEdits}
              onCancelEdits={handleCancelEdits}
              pendingUpdates={pendingUpdates}
              onPendingUpdate={handlePendingUpdate}
            />

            {/* Right panel — only in edit mode */}
            {isOwnStudio && isEditMode && (
              <SpaceBlockPicker
                spaceId={activeSpaceId}
                selectedBlock={selectedBlock}
                onBlockDeleted={() => setSelectedBlockId(null)}
                isEditMode={isEditMode}
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

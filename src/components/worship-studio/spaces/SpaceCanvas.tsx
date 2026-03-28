import { useState, useCallback, useMemo } from "react";
import { useSpaceBlocks, useUpdateBlock } from "@/hooks/useSpaceBlocks";
import { SpaceBlock } from "./SpaceBlock";
import { MujiGridBackground } from "./MujiGridBackground";
import { useTranslation } from "@/hooks/useTranslation";
import type { SpaceBlock as SpaceBlockType } from "@/hooks/useSpaceBlocks";

interface SpaceCanvasProps {
  spaceId: string;
  isOwner: boolean;
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
  isEditMode: boolean;
  onToggleEditMode: () => void;
  onSaveEdits: () => void;
  onCancelEdits: () => void;
  pendingUpdates: Map<string, Partial<SpaceBlockType>>;
  onPendingUpdate: (id: string, updates: Partial<SpaceBlockType>) => void;
}

export function SpaceCanvas({
  spaceId, isOwner, selectedBlockId, onSelectBlock,
  isEditMode, onToggleEditMode, onSaveEdits, onCancelEdits,
  pendingUpdates, onPendingUpdate,
}: SpaceCanvasProps) {
  const { language } = useTranslation();
  const { data: blocks = [] } = useSpaceBlocks(spaceId);
  const updateBlock = useUpdateBlock();

  const canvasHeight = useMemo(() => {
    if (blocks.length === 0) return "100vh";
    const maxBottom = Math.max(...blocks.map(b => {
      const pending = pendingUpdates.get(b.id);
      const posY = pending?.pos_y ?? b.pos_y;
      const sizeH = pending?.size_h ?? b.size_h;
      return posY + sizeH;
    }));
    return maxBottom + 400 + "px";
  }, [blocks, pendingUpdates]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onSelectBlock(null);
    }
  }, [onSelectBlock]);

  const handleUpdateBlock = useCallback((id: string, updates: Partial<SpaceBlockType>) => {
    if (isEditMode) {
      // In edit mode, only accumulate layout changes locally
      const isLayoutChange = 'pos_x' in updates || 'pos_y' in updates || 'size_w' in updates || 'size_h' in updates;
      if (isLayoutChange) {
        onPendingUpdate(id, updates);
        return;
      }
    }
    // Content changes always go to DB immediately
    updateBlock.mutate({ id, spaceId, ...updates });
  }, [spaceId, updateBlock, isEditMode, onPendingUpdate]);

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 relative">
      {/* Edit mode toolbar */}
      {isOwner && (
        <div className="absolute top-3 right-3 z-30 flex items-center gap-2">
          {isEditMode ? (
            <>
              <button
                onClick={onSaveEdits}
                className="px-3 py-1.5 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-xs font-medium shadow hover:opacity-90 transition"
              >
                💾 {language === "ko" ? "저장" : "Save"}
              </button>
              <button
                onClick={onCancelEdits}
                className="px-3 py-1.5 rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] text-xs font-medium shadow hover:opacity-90 transition"
              >
                {language === "ko" ? "취소" : "Cancel"}
              </button>
            </>
          ) : (
            <button
              onClick={onToggleEditMode}
              className="px-3 py-1.5 rounded-full bg-[hsl(var(--background))]/80 border border-border text-[hsl(var(--primary))] text-xs font-medium shadow hover:bg-accent transition backdrop-blur-sm"
            >
              ✏️ {language === "ko" ? "편집" : "Edit"}
            </button>
          )}
        </div>
      )}

      <div
        className="relative w-full"
        style={{ height: canvasHeight, minHeight: "100%" }}
        onClick={handleCanvasClick}
      >
        <MujiGridBackground />
        {blocks.map(block => {
          const pending = pendingUpdates.get(block.id);
          const mergedBlock = pending ? { ...block, ...pending } : block;
          return (
            <SpaceBlock
              key={block.id}
              block={mergedBlock}
              isOwner={isOwner}
              isSelected={block.id === selectedBlockId}
              isEditMode={isEditMode}
              onSelect={() => onSelectBlock(block.id)}
              onUpdate={(updates) => handleUpdateBlock(block.id, updates)}
              spaceId={spaceId}
            />
          );
        })}
      </div>
    </div>
  );
}

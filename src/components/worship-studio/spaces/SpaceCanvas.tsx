import { useState, useCallback, useMemo } from "react";
import { useSpaceBlocks, useUpdateBlock } from "@/hooks/useSpaceBlocks";
import { SpaceBlock } from "./SpaceBlock";
import { MujiGridBackground } from "./MujiGridBackground";
import type { SpaceBlock as SpaceBlockType } from "@/hooks/useSpaceBlocks";

interface SpaceCanvasProps {
  spaceId: string;
  isOwner: boolean;
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
}

export function SpaceCanvas({ spaceId, isOwner, selectedBlockId, onSelectBlock }: SpaceCanvasProps) {
  const { data: blocks = [] } = useSpaceBlocks(spaceId);
  const updateBlock = useUpdateBlock();

  const canvasHeight = useMemo(() => {
    if (blocks.length === 0) return "100vh";
    const maxBottom = Math.max(...blocks.map(b => b.pos_y + b.size_h));
    return maxBottom + 400 + "px";
  }, [blocks]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onSelectBlock(null);
    }
  }, [onSelectBlock]);

  const handleUpdateBlock = useCallback((id: string, updates: Partial<SpaceBlockType>) => {
    updateBlock.mutate({ id, spaceId, ...updates });
  }, [spaceId, updateBlock]);

  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
      <div
        className="relative w-full"
        style={{ height: canvasHeight, minHeight: "100%" }}
        onClick={handleCanvasClick}
      >
        <MujiGridBackground />
        {blocks.map(block => (
          <SpaceBlock
            key={block.id}
            block={block}
            isOwner={isOwner}
            isSelected={block.id === selectedBlockId}
            onSelect={() => onSelectBlock(block.id)}
            onUpdate={(updates) => handleUpdateBlock(block.id, updates)}
            spaceId={spaceId}
          />
        ))}
      </div>
    </div>
  );
}

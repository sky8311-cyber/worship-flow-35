import { useCallback } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { SortableCanvasBlock } from "./SortableCanvasBlock";
import type { CanvasBlock } from "@/hooks/useCanvas";
import { useTranslation } from "@/hooks/useTranslation";

interface CanvasBlockListProps {
  blocks: CanvasBlock[];
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
  onReorder: (blocks: CanvasBlock[]) => void;
  onUpdateBlock: (id: string, content: Record<string, any>) => void;
  onRemoveBlock: (id: string) => void;
}

export function CanvasBlockList({
  blocks,
  selectedBlockId,
  onSelectBlock,
  onReorder,
  onUpdateBlock,
  onRemoveBlock,
}: CanvasBlockListProps) {
  const { language } = useTranslation();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (over && active.id !== over.id) {
        const oldIndex = blocks.findIndex((b) => b.id === active.id);
        const newIndex = blocks.findIndex((b) => b.id === over.id);
        const reordered = arrayMove(blocks, oldIndex, newIndex).map((b, i) => ({
          ...b,
          position: i,
        }));
        onReorder(reordered);
      }
    },
    [blocks, onReorder]
  );

  if (blocks.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-2xl text-muted-foreground/30 mb-4">✦</span>
        <p className="text-sm text-muted-foreground italic">
          {language === "ko"
            ? "오른쪽 패널에서 블록을 추가하세요"
            : "Add blocks from the right panel"}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={blocks.map((b) => b.id)}
          strategy={verticalListSortingStrategy}
        >
          {blocks.map((block) => (
            <SortableCanvasBlock
              key={block.id}
              block={block}
              isSelected={selectedBlockId === block.id}
              onSelect={() =>
                onSelectBlock(selectedBlockId === block.id ? null : block.id)
              }
              onUpdate={(content) => onUpdateBlock(block.id, content)}
              onRemove={() => onRemoveBlock(block.id)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {/* Bottom click area */}
      <div
        className="h-[120px] cursor-text"
        onClick={() => onSelectBlock(null)}
      />
    </div>
  );
}

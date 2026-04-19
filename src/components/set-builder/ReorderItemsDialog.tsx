import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown, GripVertical, Music, Circle } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslation } from "@/hooks/useTranslation";
import { useTranslation } from "@/hooks/useTranslation";

export type ReorderItem = {
  type: "song" | "component";
  id: string;
  data: any;
  dbId?: string;
};

interface ReorderItemsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: ReorderItem[];
  onSave: (newItems: ReorderItem[]) => void;
}

const getItemLabel = (item: ReorderItem): string => {
  if (item.type === "song") {
    const song = item.data?.song || item.data?.songs;
    return song?.title || "(제목 없음)";
  }
  return item.data?.label || "(이름 없음)";
};

const SortableRowWithArrows = ({
  item,
  index,
  total,
  onUp,
  onDown,
}: {
  item: ReorderItem;
  index: number;
  total: number;
  onUp: () => void;
  onDown: () => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  const Icon = item.type === "song" ? Music : Circle;
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 border border-border rounded-md bg-card"
    >
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 text-muted-foreground hover:text-foreground touch-none"
        aria-label="드래그하여 순서 변경"
      >
        <GripVertical className="w-4 h-4" />
      </button>
      <span className="text-sm font-bold text-primary w-6 text-center">{index + 1}</span>
      <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
      <span className="text-sm flex-1 truncate">{getItemLabel(item)}</span>
      <Button variant="ghost" size="icon" className="h-7 w-7 flex-shrink-0" onClick={onUp} disabled={index === 0}>
        <ChevronUp className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 flex-shrink-0"
        onClick={onDown}
        disabled={index === total - 1}
      >
        <ChevronDown className="w-4 h-4" />
      </Button>
    </div>
  );
};

export const ReorderItemsDialog = ({
  open,
  onOpenChange,
  items,
  onSave,
}: ReorderItemsDialogProps) => {
  const { t } = useTranslation();
  const isMobile = useIsMobile();
  const [tempItems, setTempItems] = useState<ReorderItem[]>(items);

  useEffect(() => {
    if (open) setTempItems(items);
  }, [open, items]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setTempItems((curr) => {
      const oldIndex = curr.findIndex((i) => i.id === active.id);
      const newIndex = curr.findIndex((i) => i.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return curr;
      return arrayMove(curr, oldIndex, newIndex);
    });
  };

  const moveItem = (idx: number, dir: -1 | 1) => {
    setTempItems((curr) => {
      const newIdx = idx + dir;
      if (newIdx < 0 || newIdx >= curr.length) return curr;
      return arrayMove(curr, idx, newIdx);
    });
  };

  const handleSave = () => {
    onSave(tempItems);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{t("setSongItem.reorder.title")}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-2 py-2">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={tempItems.map((i) => i.id)}
              strategy={verticalListSortingStrategy}
            >
              {tempItems.map((item, index) => (
                <SortableRowWithArrows
                  key={item.id}
                  item={item}
                  index={index}
                  total={tempItems.length}
                  onUp={() => moveItem(index, -1)}
                  onDown={() => moveItem(index, 1)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("setSongItem.reorder.cancel")}
          </Button>
          <Button onClick={handleSave}>{t("setSongItem.reorder.save")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { StudioWidget as StudioWidgetType } from "@/hooks/useStudioWidgets";
import { WidgetRenderer } from "./WidgetRenderer";
import { cn } from "@/lib/utils";

interface StudioWidgetProps {
  widget: StudioWidgetType;
  isOwner?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function StudioWidget({ 
  widget, 
  isOwner = false,
  onEdit,
  onDelete,
}: StudioWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: widget.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  // Calculate grid span classes
  const spanClasses = cn(
    widget.column_span === 2 && "md:col-span-2",
    widget.column_span === 3 && "md:col-span-3",
    widget.row_span === 2 && "row-span-2",
    widget.row_span === 3 && "row-span-3"
  );
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        spanClasses,
        isDragging && "opacity-50 z-50"
      )}
    >
      <WidgetRenderer
        widget={widget}
        isOwner={isOwner}
        onEdit={onEdit}
        onDelete={onDelete}
        dragHandleProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

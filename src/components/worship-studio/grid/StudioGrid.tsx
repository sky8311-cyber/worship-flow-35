import { useCallback, useState } from "react";
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { useTranslation } from "@/hooks/useTranslation";
import { 
  useStudioWidgets, 
  useCreateWidget, 
  useDeleteWidget,
  useReorderWidgets,
  useUpdateWidget,
  type WidgetType,
  type StudioWidget,
  type WidgetContent,
} from "@/hooks/useStudioWidgets";
import { StudioWidget as WidgetComponent } from "./StudioWidget";
import { WidgetPalette } from "./WidgetPalette";
import { WidgetEditDialog } from "./WidgetEditDialog";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface StudioGridProps {
  roomId: string;
  isOwner?: boolean;
  gridColumns?: number;
}

export function StudioGrid({ roomId, isOwner = false, gridColumns = 3 }: StudioGridProps) {
  const { language } = useTranslation();
  const { data: widgets, isLoading } = useStudioWidgets(roomId);
  const createWidget = useCreateWidget();
  const deleteWidget = useDeleteWidget();
  const reorderWidgets = useReorderWidgets();
  const updateWidget = useUpdateWidget();
  
  const [editingWidget, setEditingWidget] = useState<StudioWidget | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id && widgets) {
      const oldIndex = widgets.findIndex(w => w.id === active.id);
      const newIndex = widgets.findIndex(w => w.id === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(widgets, oldIndex, newIndex);
        const widgetIds = newOrder.map(w => w.id);
        
        reorderWidgets.mutate({ roomId, widgetIds });
      }
    }
  }, [widgets, roomId, reorderWidgets]);
  
  const handleAddWidget = (type: WidgetType) => {
    const nextOrder = widgets?.length || 0;
    
    createWidget.mutate({
      room_id: roomId,
      widget_type: type,
      sort_order: nextOrder,
      content: getDefaultContent(type),
    });
  };
  
  const handleDeleteWidget = (widgetId: string) => {
    deleteWidget.mutate({ id: widgetId, roomId });
  };
  
  const handleEditWidget = (widget: StudioWidget) => {
    setEditingWidget(widget);
    setEditDialogOpen(true);
  };
  
  const handleSaveWidget = (widgetId: string, content: WidgetContent) => {
    updateWidget.mutate({ id: widgetId, roomId, content });
  };
  
  if (isLoading) {
    return (
      <div className={cn(
        "grid gap-4 p-4",
        gridColumns === 2 && "grid-cols-1 md:grid-cols-2",
        gridColumns === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
        gridColumns === 4 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      )}>
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={i} className="h-32 w-full rounded-xl" />
        ))}
      </div>
    );
  }
  
  const sortedWidgets = widgets?.slice().sort((a, b) => a.sort_order - b.sort_order) || [];
  
  return (
    <div className="p-4 pb-28">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext 
          items={sortedWidgets.map(w => w.id)} 
          strategy={rectSortingStrategy}
        >
          <div className={cn(
            "grid gap-4 auto-rows-min",
            gridColumns === 2 && "grid-cols-1 md:grid-cols-2",
            gridColumns === 3 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
            gridColumns === 4 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          )}>
            {sortedWidgets.map(widget => (
              <WidgetComponent
                key={widget.id}
                widget={widget}
                isOwner={isOwner}
                onEdit={() => handleEditWidget(widget)}
                onDelete={() => handleDeleteWidget(widget.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
      
      {/* Empty state */}
      {sortedWidgets.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <span className="text-3xl">✨</span>
          </div>
          <h3 className="font-medium text-lg mb-2">
            {language === "ko" ? "예배는 일상에서 빚어집니다" : "Worship is shaped in daily life"}
          </h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            {language === "ko" 
              ? "하나님이 오늘 빚어가시는 것들을 이곳에 하나씩 모아보세요—기도, 묵상, 노래."
              : "Collect what God is forming—one prayer, one thought, one song at a time."}
          </p>
          
          {/* Empty state 내부에 위젯 추가 버튼 */}
          {isOwner && (
            <div className="w-full max-w-sm">
              <WidgetPalette 
                onAddWidget={handleAddWidget} 
                disabled={createWidget.isPending}
              />
            </div>
          )}
        </div>
      )}
      
      {/* 위젯이 있을 때만 하단에 버튼 표시 */}
      {isOwner && sortedWidgets.length > 0 && (
        <div className="mt-6">
          <WidgetPalette 
            onAddWidget={handleAddWidget} 
            disabled={createWidget.isPending}
          />
        </div>
      )}
      
      {/* Edit dialog */}
      <WidgetEditDialog
        widget={editingWidget}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSave={handleSaveWidget}
        roomId={roomId}
      />
    </div>
  );
}

function getDefaultContent(type: WidgetType): Record<string, unknown> {
  switch (type) {
    case "heading":
      return { text: "", level: 1 };
    case "quote":
    case "text":
      return { text: "" };
    case "callout":
      return { text: "", icon: "💡" };
    case "image":
      return { imageUrl: "", alt: "" };
    case "video":
      return { videoUrl: "", platform: "youtube" };
    case "todo":
    case "bullet-list":
    case "numbered-list":
      return { items: [] };
    case "external-link":
      return { url: "", linkTitle: "", linkIcon: "🔗" };
    case "song":
      return { songTitle: "", songArtist: "", isOriginal: true };
    case "recent-drafts":
      return { draftCount: 3 };
    case "gallery":
      return { images: [], galleryLayout: "grid" };
    case "bible-verse":
      return { verseReference: "", verseText: "" };
    case "profile-card":
      return { bio: "" };
    default:
      return {};
  }
}

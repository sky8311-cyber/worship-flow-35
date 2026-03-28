import { useState, useEffect, useRef } from "react";
import { useStudioSpaces, useUpdateSpace, useReorderSpaces } from "@/hooks/useStudioSpaces";
import { useTranslation } from "@/hooks/useTranslation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { SpaceCreateDialog } from "./SpaceCreateDialog";
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
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { StudioSpace } from "@/hooks/useStudioSpaces";

interface SpaceTabBarProps {
  roomId: string | undefined;
  activeSpaceId: string | null;
  onSpaceSelect: (spaceId: string) => void;
  isOwner: boolean;
}

function SortableTab({
  space,
  isActive,
  isOwner,
  onSelect,
  onRename,
}: {
  space: StudioSpace;
  isActive: boolean;
  isOwner: boolean;
  onSelect: () => void;
  onRename: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(space.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: space.id, disabled: !isOwner });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    borderBottomColor: isActive ? space.color : "transparent",
  };

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  const commitRename = () => {
    setEditing(false);
    const trimmed = editName.trim();
    if (trimmed && trimmed !== space.name) {
      onRename(trimmed);
    } else {
      setEditName(space.name);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(isOwner ? listeners : {})}
      onClick={onSelect}
      onDoubleClick={() => {
        if (isOwner) {
          setEditName(space.name);
          setEditing(true);
        }
      }}
      className={cn(
        "px-3 py-2 rounded-t-lg text-sm flex items-center gap-1.5 cursor-pointer",
        "border-b-2 transition-colors select-none whitespace-nowrap shrink-0",
        isDragging && "opacity-50",
        isActive
          ? "bg-background font-medium text-foreground"
          : "border-transparent hover:bg-accent/30"
      )}
    >
      <span>{space.icon}</span>
      {editing ? (
        <Input
          ref={inputRef}
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onBlur={commitRename}
          onKeyDown={(e) => {
            if (e.key === "Enter") commitRename();
            if (e.key === "Escape") {
              setEditName(space.name);
              setEditing(false);
            }
          }}
          onClick={(e) => e.stopPropagation()}
          className="h-6 w-24 text-sm px-1 py-0"
        />
      ) : (
        <span>{space.name}</span>
      )}
    </div>
  );
}

export function SpaceTabBar({
  roomId,
  activeSpaceId,
  onSpaceSelect,
  isOwner,
}: SpaceTabBarProps) {
  const { language } = useTranslation();
  const { data: spaces = [] } = useStudioSpaces(roomId);
  const updateSpace = useUpdateSpace();
  const reorderSpaces = useReorderSpaces();
  const [createOpen, setCreateOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // Auto-open create dialog when no spaces
  useEffect(() => {
    if (spaces.length === 0 && roomId && isOwner) {
      setCreateOpen(true);
    }
  }, [spaces.length, roomId, isOwner]);

  // Auto-select first space
  useEffect(() => {
    if (spaces.length > 0 && !activeSpaceId) {
      onSpaceSelect(spaces[0].id);
    }
  }, [spaces, activeSpaceId, onSpaceSelect]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !roomId) return;

    const oldIndex = spaces.findIndex((s) => s.id === active.id);
    const newIndex = spaces.findIndex((s) => s.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = [...spaces];
    const [moved] = reordered.splice(oldIndex, 1);
    reordered.splice(newIndex, 0, moved);

    reorderSpaces.mutate({
      roomId,
      orderedIds: reordered.map((s) => s.id),
    });
  };

  return (
    <>
      <div className="border-b border-border/40 px-4 bg-[hsl(var(--background))] flex items-center gap-1 overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={spaces.map((s) => s.id)}
            strategy={horizontalListSortingStrategy}
          >
            {spaces.map((space) => (
              <SortableTab
                key={space.id}
                space={space}
                isActive={activeSpaceId === space.id}
                isOwner={isOwner}
                onSelect={() => onSpaceSelect(space.id)}
                onRename={(name) =>
                  updateSpace.mutate({ id: space.id, name })
                }
              />
            ))}
          </SortableContext>
        </DndContext>

        {isOwner && spaces.length < 10 && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setCreateOpen(true)}
            className="h-8 gap-1 text-muted-foreground hover:text-foreground shrink-0"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="text-xs">
              {language === "ko" ? "새 공간" : "New Space"}
            </span>
          </Button>
        )}
      </div>

      <SpaceCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        roomId={roomId}
        existingCount={spaces.length}
        onCreated={(id) => onSpaceSelect(id)}
      />
    </>
  );
}

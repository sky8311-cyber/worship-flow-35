import { useState, useEffect, useRef } from "react";
import { useStudioSpaces, useUpdateSpace, useReorderSpaces } from "@/hooks/useStudioSpaces";
import { useGuestbook } from "@/hooks/useGuestbook";
import { useTranslation } from "@/hooks/useTranslation";
import { Plus, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { SpaceCreateDialog } from "./SpaceCreateDialog";
import { GuestbookPanel } from "./GuestbookPanel";
import { SpaceSettingsDialog } from "./SpaceSettingsDialog";
import {
  ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, horizontalListSortingStrategy, useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { StudioSpace } from "@/hooks/useStudioSpaces";

interface SpaceTabBarProps {
  roomId: string | undefined;
  activeSpaceId: string | null;
  onSpaceSelect: (spaceId: string) => void;
  isOwner: boolean;
  roomOwnerId?: string;
}

function SortableTab({
  space,
  isActive,
  isOwner,
  onSelect,
  onRename,
  onOpenSettings,
}: {
  space: StudioSpace;
  isActive: boolean;
  isOwner: boolean;
  onSelect: () => void;
  onRename: (name: string) => void;
  onOpenSettings: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(space.name);
  const inputRef = useRef<HTMLInputElement>(null);
  const { language } = useTranslation();

  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: space.id, disabled: !isOwner });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
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
    if (trimmed && trimmed !== space.name) onRename(trimmed);
    else setEditName(space.name);
  };

  const tab = (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...(isOwner ? listeners : {})}
      onClick={onSelect}
      onDoubleClick={() => {
        if (isOwner) { setEditName(space.name); setEditing(true); }
      }}
      className={cn(
        "px-3 text-[12px] flex items-center gap-1 cursor-pointer select-none whitespace-nowrap shrink-0 rounded-t-md border transition-colors",
        isDragging && "opacity-50",
        isActive
          ? "bg-white border-[#d0c8bc] border-b-0 -mb-px z-10 font-semibold text-foreground py-2"
          : "bg-[#e8e0d5] border-[#d0c8bc] text-muted-foreground hover:bg-[#f0e8dd] py-1.5"
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
            if (e.key === "Escape") { setEditName(space.name); setEditing(false); }
          }}
          onClick={(e) => e.stopPropagation()}
          className="h-6 w-24 text-sm px-1 py-0"
        />
      ) : (
        <span>{space.name}</span>
      )}
    </div>
  );

  if (!isOwner) return tab;

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{tab}</ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => { setEditName(space.name); setEditing(true); }}>
          {language === "ko" ? "이름 바꾸기" : "Rename"}
        </ContextMenuItem>
        <ContextMenuItem onClick={onOpenSettings}>
          {language === "ko" ? "설정" : "Settings"}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}

export function SpaceTabBar({ roomId, activeSpaceId, onSpaceSelect, isOwner, roomOwnerId }: SpaceTabBarProps) {
  const { language } = useTranslation();
  const { data: spaces = [], isLoading: isSpacesLoading } = useStudioSpaces(roomId);
  const updateSpace = useUpdateSpace();
  const reorderSpaces = useReorderSpaces();
  const [createOpen, setCreateOpen] = useState(false);
  const [guestbookOpen, setGuestbookOpen] = useState(false);
  const [settingsSpace, setSettingsSpace] = useState<StudioSpace | null>(null);

  const activeSpace = spaces.find(s => s.id === activeSpaceId);
  const { data: guestbookEntries = [] } = useGuestbook(
    activeSpace?.guestbook_enabled ? activeSpaceId || undefined : undefined
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  useEffect(() => {
    if (isSpacesLoading || !roomId || !isOwner) return;
    if (spaces.length > 0) return;
    const key = `kworship-studio-setup-seen-${roomId}`;
    if (!localStorage.getItem(key)) {
      setCreateOpen(true);
      localStorage.setItem(key, 'true');
    }
  }, [spaces.length, roomId, isOwner, isSpacesLoading]);

  useEffect(() => {
    if (spaces.length > 0 && !activeSpaceId) onSpaceSelect(spaces[0].id);
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
    reorderSpaces.mutate({ roomId, orderedIds: reordered.map((s) => s.id) });
  };

  return (
    <>
      {/* Tab bar with folder-tab style */}
      <div className="relative px-4 pt-1 bg-[hsl(var(--background))] flex items-end gap-0.5 overflow-x-auto border-b border-[#d0c8bc]">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={spaces.map((s) => s.id)} strategy={horizontalListSortingStrategy}>
            {spaces.map((space) => (
              <SortableTab
                key={space.id}
                space={space}
                isActive={activeSpaceId === space.id}
                isOwner={isOwner}
                onSelect={() => onSpaceSelect(space.id)}
                onRename={(name) => updateSpace.mutate({ id: space.id, name })}
                onOpenSettings={() => setSettingsSpace(space)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {isOwner && spaces.length < 10 && (
          <Button
            size="sm" variant="ghost"
            onClick={() => setCreateOpen(true)}
            className="h-7 gap-1 text-muted-foreground hover:text-foreground shrink-0 mb-px"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="text-xs">{language === "ko" ? "새 공간" : "New Space"}</span>
          </Button>
        )}

        {/* Guestbook button — right aligned */}
        {activeSpace?.guestbook_enabled && (
          <>
            <div className="flex-1" />
            <Button
              size="sm" variant="ghost"
              onClick={() => setGuestbookOpen(true)}
              className="h-7 gap-1 text-muted-foreground hover:text-foreground shrink-0 mb-px"
            >
              <Mail className="h-3.5 w-3.5" />
              <span className="text-xs">
                {language === "ko" ? "방명록" : "Guestbook"}
                {guestbookEntries.length > 0 && ` (${guestbookEntries.length})`}
              </span>
            </Button>
          </>
        )}
      </div>

      <SpaceCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        roomId={roomId}
        existingCount={spaces.length}
        onCreated={(id) => onSpaceSelect(id)}
      />

      {activeSpaceId && (
        <GuestbookPanel
          open={guestbookOpen}
          onOpenChange={setGuestbookOpen}
          spaceId={activeSpaceId}
          roomOwnerId={roomOwnerId}
        />
      )}

      {settingsSpace && (
        <SpaceSettingsDialog
          open={!!settingsSpace}
          onOpenChange={(open) => { if (!open) setSettingsSpace(null); }}
          space={settingsSpace}
          isFirstSpace={spaces[0]?.id === settingsSpace.id}
        />
      )}
    </>
  );
}

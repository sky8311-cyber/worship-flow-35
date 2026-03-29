import { useState, useEffect, useRef, useCallback } from "react";
import { useStudioSpaces } from "@/hooks/useStudioSpaces";
import { useGuestbook } from "@/hooks/useGuestbook";
import { useTranslation } from "@/hooks/useTranslation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { SpaceCreateDialog } from "./SpaceCreateDialog";
import { GuestbookPanel } from "./GuestbookPanel";
import type { StudioSpace } from "@/hooks/useStudioSpaces";

interface SpaceTabBarProps {
  roomId: string | undefined;
  activeSpaceId: string | null;
  onSpaceSelect: (spaceId: string) => void;
  isOwner: boolean;
  roomOwnerId?: string;
}

export function SpaceTabBar({ roomId, activeSpaceId, onSpaceSelect, isOwner, roomOwnerId }: SpaceTabBarProps) {
  const { language } = useTranslation();
  const { data: spaces = [], isLoading: isSpacesLoading } = useStudioSpaces(roomId);
  const [createOpen, setCreateOpen] = useState(false);
  const [guestbookOpen, setGuestbookOpen] = useState(false);

  // Swipe/drag scroll refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDraggingScroll = useRef(false);
  const startX = useRef(0);
  const scrollStart = useRef(0);

  const activeSpace = spaces.find(s => s.id === activeSpaceId);
  const { data: guestbookEntries = [] } = useGuestbook(
    activeSpace?.guestbook_enabled ? activeSpaceId || undefined : undefined
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

  // Touch swipe handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    isDraggingScroll.current = true;
    startX.current = e.touches[0].clientX;
    scrollStart.current = scrollRef.current?.scrollLeft ?? 0;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDraggingScroll.current || !scrollRef.current) return;
    const dx = startX.current - e.touches[0].clientX;
    scrollRef.current.scrollLeft = scrollStart.current + dx;
  }, []);

  const handleTouchEnd = useCallback(() => {
    isDraggingScroll.current = false;
  }, []);

  // Mouse drag handlers (desktop)
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-tab]')) return;
    isDraggingScroll.current = true;
    startX.current = e.clientX;
    scrollStart.current = scrollRef.current?.scrollLeft ?? 0;
    e.preventDefault();
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDraggingScroll.current || !scrollRef.current) return;
    const dx = startX.current - e.clientX;
    scrollRef.current.scrollLeft = scrollStart.current + dx;
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingScroll.current = false;
  }, []);

  return (
    <>
      {/* Tab bar — no DnD, no context menu, horizontal swipe only */}
      <div
        ref={scrollRef}
        className="relative px-4 pt-1 bg-[hsl(var(--background))] flex items-end gap-0.5 border-b border-[#d0c8bc] overflow-hidden"
        style={{ overflowX: 'hidden', overflowY: 'hidden', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="flex items-end gap-0.5 min-w-max">
          {spaces.map((space) => (
            <div
              key={space.id}
              data-tab
              onClick={() => onSpaceSelect(space.id)}
              className={cn(
                "px-3 text-[12px] flex items-center gap-1 cursor-pointer select-none whitespace-nowrap shrink-0 rounded-t-md border transition-colors",
                activeSpaceId === space.id
                  ? "bg-white border-[#d0c8bc] border-b-0 -mb-px z-10 font-semibold text-foreground py-2"
                  : "bg-[#e8e0d5] border-[#d0c8bc] text-muted-foreground hover:bg-[#f0e8dd] py-1.5"
              )}
            >
              <span>{space.icon}</span>
              <span>{space.name}</span>
            </div>
          ))}

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
        </div>
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
    </>
  );
}

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useSpaceBlocks, useUpdateBlock } from "@/hooks/useSpaceBlocks";
import { SpaceBlock } from "./SpaceBlock";
import { MujiGridBackground } from "./MujiGridBackground";
import { useTranslation } from "@/hooks/useTranslation";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { ZoomIn, ZoomOut, Maximize2, Music, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SpaceBlock as SpaceBlockType } from "@/hooks/useSpaceBlocks";

const CANVAS_WIDTH = 430;

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
  bgmSongTitle?: string | null;
  bgmSongArtist?: string | null;
  bgmVideoId?: string | null;
  bgmRoomId?: string | null;
  bgmOwnerName?: string | null;
}

export function SpaceCanvas({
  spaceId, isOwner, selectedBlockId, onSelectBlock,
  isEditMode, onToggleEditMode, onSaveEdits, onCancelEdits,
  pendingUpdates, onPendingUpdate,
  bgmSongTitle, bgmSongArtist, bgmVideoId, bgmRoomId, bgmOwnerName,
}: SpaceCanvasProps) {
  const { language } = useTranslation();
  const isMobile = useIsMobile();
  const { data: blocks = [] } = useSpaceBlocks(spaceId);
  const updateBlock = useUpdateBlock();
  const containerRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(1.0);

  // Auto-fit zoom on mount / resize (desktop only)
  const fitZoom = useCallback(() => {
    if (!containerRef.current || isMobile) return;
    const available = containerRef.current.clientWidth - 32;
    const fit = Math.min(Math.max(available / CANVAS_WIDTH, 0.5), 2.0);
    setZoom(Math.round(fit * 100) / 100);
  }, [isMobile]);

  useEffect(() => {
    if (isMobile) { setZoom(1.0); return; }
    fitZoom();
    const ro = new ResizeObserver(fitZoom);
    if (containerRef.current) ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [isMobile, fitZoom]);

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
      const isLayoutChange = 'pos_x' in updates || 'pos_y' in updates || 'size_w' in updates || 'size_h' in updates;
      if (isLayoutChange) {
        onPendingUpdate(id, updates);
        return;
      }
    }
    updateBlock.mutate({ id, spaceId, ...updates });
  }, [spaceId, updateBlock, isEditMode, onPendingUpdate]);

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 relative">
      {/* Desktop toolbar: zoom + edit controls */}
      {isOwner && !isMobile && (
        <div className="sticky top-0 z-30 flex items-center justify-between px-3 py-2 bg-[hsl(var(--background))]/90 backdrop-blur-sm border-b border-border/30">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setZoom(z => Math.max(0.5, Math.round((z - 0.1) * 10) / 10))}
              className="p-1.5 rounded-md hover:bg-accent transition"
              title="Zoom out"
            >
              <ZoomOut className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <span className="text-[10px] text-muted-foreground font-mono w-10 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom(z => Math.min(2.0, Math.round((z + 0.1) * 10) / 10))}
              className="p-1.5 rounded-md hover:bg-accent transition"
              title="Zoom in"
            >
              <ZoomIn className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
            <button
              onClick={fitZoom}
              className="p-1.5 rounded-md hover:bg-accent transition"
              title="Fit to width"
            >
              <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>

          <div className="flex items-center gap-2">
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
        </div>
      )}

      {/* Mobile sticky toolbar */}
      {isOwner && isMobile && (
        <div className="sticky top-0 z-30 flex items-center gap-2 px-3 py-2 bg-[hsl(var(--background))]/90 backdrop-blur-sm border-b border-border/30">
          {isEditMode ? (
            <>
              <button
                onClick={onSaveEdits}
                className="flex-1 py-1.5 rounded-full bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] text-[11px] font-medium shadow"
              >
                💾 {language === "ko" ? "저장" : "Save"}
              </button>
              <button
                onClick={onCancelEdits}
                className="flex-1 py-1.5 rounded-full bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] text-[11px] font-medium shadow"
              >
                {language === "ko" ? "취소" : "Cancel"}
              </button>
            </>
          ) : (
            <button
              onClick={onToggleEditMode}
              className="ml-auto px-3 py-1.5 rounded-full bg-[hsl(var(--background))]/80 border border-border text-[hsl(var(--primary))] text-[11px] font-medium shadow"
            >
              ✏️ {language === "ko" ? "편집" : "Edit"}
            </button>
          )}
        </div>
      )}

      {/* Always use absolute-positioned canvas */}
      <div className="flex justify-center py-4">
        <div
          className="relative"
          style={{
            width: `${CANVAS_WIDTH}px`,
            height: canvasHeight,
            transform: isMobile ? undefined : `scale(${zoom})`,
            transformOrigin: 'top center',
          }}
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
    </div>
  );
}

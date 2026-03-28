import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useSpaceBlocks, useUpdateBlock } from "@/hooks/useSpaceBlocks";
import { SpaceBlock } from "./SpaceBlock";
import { MujiGridBackground } from "./MujiGridBackground";
import { useTranslation } from "@/hooks/useTranslation";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { ZoomIn, ZoomOut, Maximize2, Music, Play, Pause, UserPlus, Settings } from "lucide-react";
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
  // Marquee
  marqueeText?: string | null;
  marqueeTextColor?: string | null;
  marqueeBgColor?: string | null;
  marqueeSpeed?: number | null;
  // Settings
  onOpenSettings?: () => void;
  // Neighbor
  onAddNeighbor?: () => void;
  neighborStatus?: "none" | "pending" | "accepted" | null;
}

export function SpaceCanvas({
  spaceId, isOwner, selectedBlockId, onSelectBlock,
  isEditMode, onToggleEditMode, onSaveEdits, onCancelEdits,
  pendingUpdates, onPendingUpdate,
  bgmSongTitle, bgmSongArtist, bgmVideoId, bgmRoomId, bgmOwnerName,
  marqueeText, marqueeTextColor, marqueeBgColor, marqueeSpeed,
  onOpenSettings, onAddNeighbor, neighborStatus,
}: SpaceCanvasProps) {
  const { language } = useTranslation();
  const isMobile = useIsMobile();
  const { data: blocks = [] } = useSpaceBlocks(spaceId);
  const updateBlock = useUpdateBlock();
  const containerRef = useRef<HTMLDivElement>(null);

  const [zoom, setZoom] = useState(1.0);

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

  const showMarquee = !!marqueeText;

  // Toolbar content (shared between mobile/desktop)
  const marqueeBar = showMarquee ? (
    <MarqueeBar
      text={marqueeText!}
      textColor={marqueeTextColor || "#333333"}
      bgColor={marqueeBgColor || "#f5f0e8"}
      speed={marqueeSpeed || 50}
    />
  ) : null;

  const actionButtons = (
    <div className="flex items-center gap-1.5">
      <BGMButton
        bgmSongTitle={bgmSongTitle}
        bgmVideoId={bgmVideoId}
        bgmRoomId={bgmRoomId}
        bgmOwnerName={bgmOwnerName}
        bgmSongArtist={bgmSongArtist}
      />
      {!isOwner && onAddNeighbor && (
        <NeighborButton status={neighborStatus} onClick={onAddNeighbor} />
      )}
      {isOwner && (
        isEditMode ? (
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
        )
      )}
      {isOwner && onOpenSettings && (
        <button
          onClick={onOpenSettings}
          className="p-1.5 rounded-md hover:bg-accent transition"
          title={language === "ko" ? "스튜디오 설정" : "Studio Settings"}
        >
          <Settings className="h-4 w-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );

  return (
    <div ref={containerRef} className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 relative">
      {/* Desktop toolbar */}
      {!isMobile && (
        <div className="sticky top-0 z-30 flex items-center justify-between px-3 py-2 bg-[hsl(var(--background))]/90 backdrop-blur-sm border-b border-border/30 gap-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {isOwner && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => setZoom(z => Math.max(0.5, Math.round((z - 0.1) * 10) / 10))}
                  className="p-1.5 rounded-md hover:bg-accent transition"
                >
                  <ZoomOut className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <span className="text-[10px] text-muted-foreground font-mono w-10 text-center">
                  {Math.round(zoom * 100)}%
                </span>
                <button
                  onClick={() => setZoom(z => Math.min(2.0, Math.round((z + 0.1) * 10) / 10))}
                  className="p-1.5 rounded-md hover:bg-accent transition"
                >
                  <ZoomIn className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <button onClick={fitZoom} className="p-1.5 rounded-md hover:bg-accent transition">
                  <Maximize2 className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              </div>
            )}
            {marqueeBar && <div className="min-w-0 flex-1 mx-2">{marqueeBar}</div>}
          </div>
          {actionButtons}
        </div>
      )}

      {/* Mobile toolbar */}
      {isMobile && (
        <div className="sticky top-0 z-30 flex flex-col bg-[hsl(var(--background))]/90 backdrop-blur-sm border-b border-border/30">
          {marqueeBar && <div className="px-3 pt-2">{marqueeBar}</div>}
          <div className="flex items-center justify-end gap-1.5 px-3 py-2">
            {actionButtons}
          </div>
        </div>
      )}

      {/* Canvas */}
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

// --- Marquee Text Bar ---
function MarqueeBar({ text, textColor, bgColor, speed }: {
  text: string; textColor: string; bgColor: string; speed: number;
}) {
  const duration = Math.max(3, 200 / speed);
  return (
    <div
      className="rounded-full overflow-hidden h-7 flex items-center"
      style={{ backgroundColor: bgColor }}
    >
      <div
        className="whitespace-nowrap text-[11px] font-medium animate-marquee px-4"
        style={{ color: textColor, animationDuration: `${duration}s` }}
      >
        {text}
      </div>
    </div>
  );
}

// --- Neighbor Button ---
function NeighborButton({ status, onClick }: { status?: "none" | "pending" | "accepted" | null; onClick: () => void }) {
  const { language } = useTranslation();
  
  if (status === "accepted") {
    return (
      <button
        className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))] text-[11px] font-medium"
        onClick={onClick}
      >
        <UserPlus className="h-3 w-3" />
        {language === "ko" ? "이웃 ✓" : "Neighbor ✓"}
      </button>
    );
  }
  
  if (status === "pending") {
    return (
      <button
        className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[hsl(var(--muted))] text-muted-foreground text-[11px] font-medium"
        onClick={onClick}
      >
        <UserPlus className="h-3 w-3" />
        {language === "ko" ? "신청 중..." : "Pending..."}
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[hsl(var(--muted))]/60 hover:bg-[hsl(var(--muted))] text-foreground text-[11px] font-medium transition-colors"
    >
      <UserPlus className="h-3 w-3" />
      {language === "ko" ? "이웃추가" : "Add Neighbor"}
    </button>
  );
}

// --- Cyworld-style BGM Button ---
interface BGMButtonProps {
  bgmSongTitle?: string | null;
  bgmSongArtist?: string | null;
  bgmVideoId?: string | null;
  bgmRoomId?: string | null;
  bgmOwnerName?: string | null;
}

function BGMButton({ bgmSongTitle, bgmVideoId, bgmRoomId, bgmOwnerName, bgmSongArtist }: BGMButtonProps) {
  const { startPlaylist, closePlayer, isPlaying, setPlayerState, playlist } = useMusicPlayer();
  const [hasStarted, setHasStarted] = useState(false);

  if (!bgmSongTitle || !bgmVideoId || !bgmRoomId) return null;

  const isBGMPlaying = hasStarted && isPlaying && playlist.some(t => t.videoId === bgmVideoId);
  const needsMarquee = bgmSongTitle.length > 12;

  const handleToggle = () => {
    if (!hasStarted || !isBGMPlaying) {
      startPlaylist(
        [{
          videoId: bgmVideoId,
          title: bgmSongTitle,
          artist: bgmSongArtist || "",
          position: 0,
        }],
        `${bgmOwnerName || "Studio"} BGM`,
        bgmRoomId
      );
      setPlayerState("hidden");
      setHasStarted(true);
    } else {
      closePlayer();
      setHasStarted(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      className="flex items-center gap-1.5 bg-[hsl(var(--muted))]/60 hover:bg-[hsl(var(--muted))] rounded-full px-2.5 py-1 max-w-[180px] transition-colors"
    >
      <Music className="h-3.5 w-3.5 shrink-0 text-[#b8902a]" />
      <div className="overflow-hidden max-w-[100px]">
        <span
          className={cn(
            "text-[11px] whitespace-nowrap block text-foreground",
            needsMarquee && "animate-marquee"
          )}
        >
          {bgmSongTitle}
        </span>
      </div>
      {isBGMPlaying ? (
        <Pause className="h-3 w-3 shrink-0 text-foreground" />
      ) : (
        <Play className="h-3 w-3 shrink-0 text-foreground" />
      )}
    </button>
  );
}

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useSpaceBlocks, useUpdateBlock, useDeleteBlock } from "@/hooks/useSpaceBlocks";
import { SpaceBlock } from "./SpaceBlock";
import { MujiGridBackground } from "./MujiGridBackground";
import { useTranslation } from "@/hooks/useTranslation";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { Music, Play, Pause, UserPlus, Settings, Mail, Trash2 } from "lucide-react";
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
  onOpenSettings?: () => void;
  onAddNeighbor?: () => void;
  neighborStatus?: "none" | "pending" | "accepted" | null;
  currentPage: number;
  onPageChange: (page: number) => void;
  pageCount: number;
  onPageNavInfo?: (info: { pageCount: number; canGoNext: boolean; canGoPrev: boolean; pageIndicator: string; navigatePage: (dir: "left" | "right") => void }) => void;
  guestbookEnabled?: boolean;
  guestbookCount?: number;
  onOpenGuestbook?: () => void;
  onDeletePage?: (pageNum: number) => void;
}

export function SpaceCanvas({
  spaceId, isOwner, selectedBlockId, onSelectBlock,
  isEditMode, onToggleEditMode, onSaveEdits, onCancelEdits,
  pendingUpdates, onPendingUpdate,
  bgmSongTitle, bgmSongArtist, bgmVideoId, bgmRoomId, bgmOwnerName,
  onOpenSettings, onAddNeighbor, neighborStatus,
  currentPage, onPageChange, pageCount, onPageNavInfo,
  guestbookEnabled, guestbookCount, onOpenGuestbook,
  onDeletePage,
}: SpaceCanvasProps) {
  const { language } = useTranslation();
  const isMobile = useIsMobile();
  const { data: blocks = [] } = useSpaceBlocks(spaceId);
  const updateBlock = useUpdateBlock();
  const deleteBlockMut = useDeleteBlock();
  const containerRef = useRef<HTMLDivElement>(null);

  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);

  const pagesPerView = isMobile ? 1 : 2;
  const startPage = isMobile ? currentPage : Math.floor(currentPage / 2) * 2;

  const visiblePages = useMemo(() => {
    const pages: number[] = [];
    for (let i = 0; i < pagesPerView; i++) {
      const p = startPage + i;
      if (p < pageCount) pages.push(p);
    }
    return pages;
  }, [startPage, pagesPerView, pageCount]);

  const getPageBlocks = useCallback((pageNum: number) => {
    return blocks.filter(b => (b.page_number ?? 0) === pageNum);
  }, [blocks]);

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onSelectBlock(null);
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

  const handleDeleteBlock = useCallback((blockId: string) => {
    deleteBlockMut.mutate({ id: blockId, spaceId });
    if (selectedBlockId === blockId) onSelectBlock(null);
  }, [deleteBlockMut, spaceId, selectedBlockId, onSelectBlock]);

  const canGoNext = startPage + pagesPerView < pageCount;
  const canGoPrev = startPage > 0;

  const navigatePage = useCallback((direction: "left" | "right") => {
    if (isAnimating) return;
    if (direction === "right" && !canGoNext) return;
    if (direction === "left" && !canGoPrev) return;

    setSlideDirection(direction);
    setIsAnimating(true);

    setTimeout(() => {
      if (direction === "right") {
        onPageChange(startPage + pagesPerView);
      } else {
        onPageChange(Math.max(0, startPage - pagesPerView));
      }
      setSlideDirection(null);
      setIsAnimating(false);
    }, 400);
  }, [isAnimating, canGoNext, canGoPrev, startPage, pagesPerView, onPageChange]);

  const pageIndicator = isMobile
    ? `${currentPage + 1}/${pageCount}`
    : pageCount > 0
      ? `${startPage + 1}-${Math.min(startPage + 2, pageCount)}/${pageCount}`
      : "0/0";

  // Report nav info to parent for floating bar
  useEffect(() => {
    onPageNavInfo?.({ pageCount, canGoNext, canGoPrev, pageIndicator, navigatePage });
  }, [pageCount, canGoNext, canGoPrev, pageIndicator, navigatePage, onPageNavInfo]);

  const pillBtn = "flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors";

  // Render a single page
  const renderPage = (pageNum: number, side?: "left" | "right") => {
    const pageBlocks = getPageBlocks(pageNum);
    return (
      <div
        key={pageNum}
        className={cn(
          "relative shrink-0 overflow-hidden h-full",
          !isMobile && side === "left" && "border-r-0",
          !isMobile && side === "right" && "border-l-0",
        )}
        style={{
          width: `${CANVAS_WIDTH}px`,
        }}
        onClick={handleCanvasClick}
      >
        <MujiGridBackground />

        {/* Page delete button — edit mode only */}
        {isEditMode && isOwner && onDeletePage && pageCount > 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); onDeletePage(pageNum); }}
            className="absolute top-2 right-2 z-20 flex items-center gap-1 px-2 py-1 rounded-full bg-destructive/90 text-destructive-foreground text-[10px] font-medium shadow hover:bg-destructive transition"
          >
            <Trash2 className="h-3 w-3" />
            {language === "ko" ? "삭제" : "Delete"}
          </button>
        )}

        {pageBlocks.map(block => {
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
              onDelete={() => handleDeleteBlock(block.id)}
              spaceId={spaceId}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div ref={containerRef} className="flex flex-col overflow-hidden relative" style={{ height: 'calc(100dvh - 48px)' }}>
      {/* Top action buttons — unified pill style, settings far right */}
      <div className="absolute top-2 left-3 right-3 z-30 flex items-center gap-1.5">
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
                className={cn(pillBtn, "bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] shadow hover:opacity-90")}
              >
                💾 {language === "ko" ? "저장" : "Save"}
              </button>
              <button
                onClick={onCancelEdits}
                className={cn(pillBtn, "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))] shadow hover:opacity-90")}
              >
                {language === "ko" ? "취소" : "Cancel"}
              </button>
            </>
          ) : (
            <button
              onClick={onToggleEditMode}
              className={cn(pillBtn, "bg-[hsl(var(--background))]/80 border border-border text-[hsl(var(--primary))] shadow hover:bg-accent backdrop-blur-sm")}
            >
              ✏️ {language === "ko" ? "편집" : "Edit"}
            </button>
          )
        )}
        {guestbookEnabled && onOpenGuestbook && (
          <button
            onClick={onOpenGuestbook}
            className={cn(pillBtn, "bg-[hsl(var(--muted))]/60 hover:bg-[hsl(var(--muted))] text-foreground")}
          >
            <Mail className="h-3 w-3" />
            {language === "ko" ? "방명록" : "Guestbook"}
            {(guestbookCount ?? 0) > 0 && ` (${guestbookCount})`}
          </button>
        )}

        {/* Spacer to push settings to far right */}
        <div className="flex-1" />

        {isOwner && onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className={cn(pillBtn, "bg-[hsl(var(--muted))]/60 hover:bg-[hsl(var(--muted))] text-muted-foreground px-1.5")}
            title={language === "ko" ? "아틀리에 설정" : "Atelier Settings"}
          >
            <Settings className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Page area */}
      <div className="flex-1 flex items-center justify-center overflow-hidden relative min-h-0" style={{ perspective: "1200px" }}>
        <div
          className="flex items-stretch h-full"
          style={{
            transition: isAnimating ? "transform 0.4s ease-in-out, opacity 0.4s ease-in-out" : "none",
            transform: slideDirection === "right"
              ? "perspective(1200px) rotateY(-3deg) translateX(-20px)"
              : slideDirection === "left"
                ? "perspective(1200px) rotateY(3deg) translateX(20px)"
                : "perspective(1200px) rotateY(0deg)",
            opacity: isAnimating ? 0.85 : 1,
            transformOrigin: slideDirection === "right" ? "left center" : "right center",
          }}
        >
          {isMobile ? (
            visiblePages.map(p => renderPage(p))
          ) : (
            <div className="flex items-stretch relative h-full">
              {visiblePages[0] !== undefined && renderPage(visiblePages[0], "left")}
              {visiblePages.length === 2 && (
                <div className="w-4 shrink-0 relative z-10"
                  style={{
                    background: "linear-gradient(to right, rgba(0,0,0,0.07), rgba(0,0,0,0.03) 20%, rgba(0,0,0,0.01) 40%, rgba(255,255,255,0.15) 50%, rgba(0,0,0,0.01) 60%, rgba(0,0,0,0.03) 80%, rgba(0,0,0,0.07))",
                    boxShadow: "inset 2px 0 4px rgba(0,0,0,0.06), inset -2px 0 4px rgba(0,0,0,0.06), inset 0 0 12px rgba(0,0,0,0.04)",
                  }}
                >
                  {/* Center spine line */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-px -translate-x-1/2" style={{ background: "rgba(0,0,0,0.12)" }} />
                </div>
              )}
              {visiblePages[1] !== undefined && renderPage(visiblePages[1], "right")}
            </div>
          )}
        </div>
      </div>

    </div>
  );
}

// --- Neighbor Button ---
function NeighborButton({ status, onClick }: { status?: "none" | "pending" | "accepted" | null; onClick: () => void }) {
  const { language } = useTranslation();
  const pillBtn = "flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors";
  
  if (status === "accepted") {
    return (
      <button
        className={cn(pillBtn, "bg-[hsl(var(--primary))]/10 text-[hsl(var(--primary))]")}
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
        className={cn(pillBtn, "bg-[hsl(var(--muted))] text-muted-foreground")}
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
      className={cn(pillBtn, "bg-[hsl(var(--muted))]/60 hover:bg-[hsl(var(--muted))] text-foreground")}
    >
      <UserPlus className="h-3 w-3" />
      {language === "ko" ? "이웃추가" : "Add Neighbor"}
    </button>
  );
}

// --- Cyworld-style BGM Button with play fix ---
interface BGMButtonProps {
  bgmSongTitle?: string | null;
  bgmSongArtist?: string | null;
  bgmVideoId?: string | null;
  bgmRoomId?: string | null;
  bgmOwnerName?: string | null;
}

function BGMButton({ bgmSongTitle, bgmVideoId, bgmRoomId, bgmOwnerName, bgmSongArtist }: BGMButtonProps) {
  const {
    startPlaylist,
    isPlaying,
    setPlayerState,
    setIsPlaying,
    sendCommand,
    playlist,
    setId,
    pendingPlayIntent,
    setPendingPlayIntent,
  } = useMusicPlayer();

  if (!bgmSongTitle || !bgmVideoId || !bgmRoomId) return null;

  const isCurrentBGMLoaded = setId === bgmRoomId || playlist.some((track) => track.videoId === bgmVideoId);
  const isBGMPlaying = isCurrentBGMLoaded && isPlaying;
  const needsMarquee = bgmSongTitle.length > 12;

  const handleToggle = () => {
    if (!isCurrentBGMLoaded) {
      setPendingPlayIntent(true);
      startPlaylist(
        [{
          videoId: bgmVideoId,
          title: bgmSongTitle,
          artist: bgmSongArtist || "",
          position: 0,
        }],
        `${bgmOwnerName || "Atelier"} BGM`,
        bgmRoomId
      );
      setPlayerState("hidden");
      return;
    }

    if (isBGMPlaying) {
      sendCommand('pause');
      setIsPlaying(false);
      setPendingPlayIntent(false);
      return;
    }

    setPendingPlayIntent(true);
    sendCommand('play');
    setIsPlaying(true);
  };

  return (
    <button
      onClick={handleToggle}
      className="flex items-center gap-1.5 bg-[hsl(var(--muted))]/60 hover:bg-[hsl(var(--muted))] rounded-full px-2.5 py-1 max-w-[180px] transition-colors"
    >
      <Music className="h-3.5 w-3.5 shrink-0 text-primary" />
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

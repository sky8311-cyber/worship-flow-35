import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/useTranslation";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScoreItem {
  songTitle: string;
  songKey: string;
  imageUrl: string;
  position: number;
  pageNumber: number;
}

interface FullscreenScoreViewerProps {
  open: boolean;
  onClose: () => void;
  scores: ScoreItem[];
}

export function FullscreenScoreViewer({
  open,
  onClose,
  scores,
}: FullscreenScoreViewerProps) {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = useState(0);
  const [showUI, setShowUI] = useState(true);
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const hideUITimeout = useRef<NodeJS.Timeout | null>(null);
  const lastTapTime = useRef<number>(0);
  const wakeLockSentinel = useRef<WakeLockSentinel | null>(null);
  const noSleepVideoRef = useRef<HTMLVideoElement | null>(null);

  // Wake Lock management
  const requestWakeLock = useCallback(async () => {
    // Try native Wake Lock API first
    if ('wakeLock' in navigator) {
      try {
        wakeLockSentinel.current = await navigator.wakeLock.request('screen');
        console.log('Wake Lock acquired');
        
        wakeLockSentinel.current.addEventListener('release', () => {
          console.log('Wake Lock was released');
        });
        return true;
      } catch (err) {
        console.log('Wake Lock error:', err);
      }
    }
    return false;
  }, []);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockSentinel.current) {
      try {
        await wakeLockSentinel.current.release();
        wakeLockSentinel.current = null;
        console.log('Wake Lock released manually');
      } catch (err) {
        console.log('Wake Lock release error:', err);
      }
    }
  }, []);

  // NoSleep fallback for iOS Safari (using video element)
  const enableNoSleep = useCallback(() => {
    if (noSleepVideoRef.current) return; // Already enabled
    
    // Create a tiny video element that plays in loop to prevent sleep
    const video = document.createElement('video');
    video.setAttribute('loop', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('muted', '');
    video.style.position = 'absolute';
    video.style.left = '-9999px';
    video.style.width = '1px';
    video.style.height = '1px';
    
    // Minimal valid mp4 video (1 frame, transparent)
    video.src = 'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAA8htZGF0AAACrgYF//+q3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE0MiByMjQ3OSBkZDc5YTYxIC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAxNCAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTMgZGVibG9jaz0xOjA6MCBhbmFseXNlPTB4MzoweDExMyBtZT1oZXggc3VibWU9NyBwc3k9MSBwc3lfcmQ9MS4wMDowLjAwIG1peGVkX3JlZj0xIG1lX3JhbmdlPTE2IGNocm9tYV9tZT0xIHRyZWxsaXM9MSA4eDhkY3Q9MSBjcW09MCBkZWFkem9uZT0yMSwxMSBmYXN0X3Bza2lwPTEgY2hyb21hX3FwX29mZnNldD0tMiB0aHJlYWRzPTEyIGxvb2thaGVhZF90aHJlYWRzPTIgc2xpY2VkX3RocmVhZHM9MCBucj0wIGRlY2ltYXRlPTEgaW50ZXJsYWNlZD0wIGJsdXJheV9jb21wYXQ9MCBjb25zdHJhaW5lZF9pbnRyYT0wIGJmcmFtZXM9MyBiX3B5cmFtaWQ9MiBiX2FkYXB0PTEgYl9iaWFzPTAgZGlyZWN0PTEgd2VpZ2h0Yj0xIG9wZW5fZ29wPTAgd2VpZ2h0cD0yIGtleWludD0yNTAga2V5aW50X21pbj0xMCBzY2VuZWN1dD00MCBpbnRyYV9yZWZyZXNoPTAgcmNfbG9va2FoZWFkPTQwIHJjPWNyZiBtYnRyZWU9MSBjcmY9MjMuMCBxY29tcD0wLjYwIHFwbWluPTAgcXBtYXg9NjkgcXBzdGVwPTQgaXBfcmF0aW89MS40MCBhcT0xOjEuMDAAgAAAAA9liIQAM//+9uy+BTX9n9CXESzSfFlqfnrORPkpJAAADAAADAAADAAADAAADAMAYKDgkJqSxIQAAAQZBmiRsQ/8AAADAAAAAAAAAMAAADAAADAAMAUQAAAA5BnkJ4hH8AAADAAAADAAADAE0AAAAOQZpEeIR/AAADAAADAAADAE0AAAAJAZpiRBX/AAADAAAAAAAAAQAAAAAAAAMAAAADAAMAUQ==';
    
    document.body.appendChild(video);
    video.play().catch(() => {
      console.log('NoSleep video play failed');
    });
    noSleepVideoRef.current = video;
    console.log('NoSleep fallback enabled');
  }, []);

  const disableNoSleep = useCallback(() => {
    if (noSleepVideoRef.current) {
      noSleepVideoRef.current.pause();
      noSleepVideoRef.current.remove();
      noSleepVideoRef.current = null;
      console.log('NoSleep fallback disabled');
    }
  }, []);

  // Request fullscreen and lock orientation to portrait on open
  useEffect(() => {
    if (open && containerRef.current) {
      // Try to request fullscreen
      containerRef.current.requestFullscreen?.().catch(() => {
        // Fullscreen not supported, continue anyway
      });

      // Lock orientation to portrait (for consistent iPad experience)
      if ('orientation' in screen && (screen.orientation as any)?.lock) {
        (screen.orientation as any).lock('portrait').catch(() => {
          // Orientation lock not supported or denied (common on iOS Safari)
        });
      }

      // Request wake lock and set up visibility change handler
      const initWakeLock = async () => {
        const success = await requestWakeLock();
        if (!success) {
          // Fallback for iOS Safari
          enableNoSleep();
        }
      };
      
      initWakeLock();
      
      // Re-request wake lock when tab becomes visible again
      const handleVisibilityChange = async () => {
        if (document.visibilityState === 'visible' && open) {
          const success = await requestWakeLock();
          if (!success) {
            enableNoSleep();
          }
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);

      return () => {
        if (document.fullscreenElement) {
          document.exitFullscreen?.();
        }
        // Unlock orientation when exiting
        if ('orientation' in screen && (screen.orientation as any)?.unlock) {
          (screen.orientation as any).unlock();
        }
        releaseWakeLock();
        disableNoSleep();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      };
    }
  }, [open, requestWakeLock, releaseWakeLock, enableNoSleep, disableNoSleep]);

  // Handle fullscreen change - DON'T auto-close, just try to re-enter fullscreen
  useEffect(() => {
    const handleFullscreenChange = () => {
      // If fullscreen exited but viewer is still open, try to re-enter fullscreen
      // but don't close the viewer - user must explicitly close it
      if (!document.fullscreenElement && open && containerRef.current) {
        containerRef.current.requestFullscreen?.().catch(() => {
          // Fullscreen re-request failed (iOS Safari), continue without fullscreen
          console.log('Fullscreen re-request failed, continuing without fullscreen');
        });
      }
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [open]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          goToPrevious();
          break;
        case "ArrowRight":
          goToNext();
          break;
        case "Escape":
          onClose();
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, currentPage, scores.length]);

  // Auto-hide UI
  const resetHideUITimer = useCallback(() => {
    if (hideUITimeout.current) {
      clearTimeout(hideUITimeout.current);
    }
    setShowUI(true);
    hideUITimeout.current = setTimeout(() => {
      setShowUI(false);
    }, 3000);
  }, []);

  useEffect(() => {
    if (open) {
      resetHideUITimer();
    }
    return () => {
      if (hideUITimeout.current) {
        clearTimeout(hideUITimeout.current);
      }
    };
  }, [open, resetHideUITimer]);

  const goToPrevious = () => {
    setCurrentPage((prev) => Math.max(0, prev - 1));
    setZoom(1);
    resetHideUITimer();
  };

  const goToNext = () => {
    setCurrentPage((prev) => Math.min(scores.length - 1, prev + 1));
    setZoom(1);
    resetHideUITimer();
  };

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    if (zoom > 1) return; // Disable swipe when zoomed
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    if (zoom > 1) return;

    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    const deltaY = e.changedTouches[0].clientY - touchStartY.current;

    // Only trigger if horizontal movement is dominant
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        goToPrevious();
      } else {
        goToNext();
      }
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  // Double tap to zoom
  const handleTap = () => {
    const now = Date.now();
    if (now - lastTapTime.current < 300) {
      // Double tap
      setZoom((prev) => (prev === 1 ? 2 : 1));
    } else {
      // Single tap - toggle UI
      setShowUI((prev) => !prev);
      if (!showUI) {
        resetHideUITimer();
      }
    }
    lastTapTime.current = now;
  };

  if (!open) return null;

  const currentScore = scores[currentPage];

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onClick={handleTap}
    >
      {/* Top Bar */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4 transition-opacity duration-300",
          showUI ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
          >
            <X className="w-6 h-6" />
          </Button>

          <div className="text-center">
            <p className="text-white text-sm font-medium truncate max-w-[200px]">
              {currentScore?.songTitle}
            </p>
            <p className="text-white/70 text-xs">
              {t("bandView.fullscreenViewer.pageOf", {
                current: String(currentPage + 1),
                total: String(scores.length),
              })}
              {currentScore?.songKey && ` · ${currentScore.songKey}`}
            </p>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                setZoom((prev) => Math.max(0.5, prev - 0.5));
              }}
            >
              <ZoomOut className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-white/20"
              onClick={(e) => {
                e.stopPropagation();
                setZoom((prev) => Math.min(3, prev + 0.5));
              }}
            >
              <ZoomIn className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Score Image - iPad Photos style fill-to-screen */}
      <div className="flex-1 flex items-center justify-center overflow-hidden bg-black">
        {scores.length > 0 ? (
          <img
            src={currentScore?.imageUrl}
            alt={`${currentScore?.songTitle} - Page ${currentScore?.pageNumber}`}
            className="w-full h-full object-contain transition-transform duration-200"
            style={{ transform: `scale(${zoom})` }}
            draggable={false}
          />
        ) : (
          <p className="text-white/70 text-center">
            {t("bandView.fullscreenViewer.noScores")}
          </p>
        )}
      </div>

      {/* Bottom Navigation */}
      <div
        className={cn(
          "absolute bottom-0 left-0 right-0 z-10 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300",
          showUI ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
      >
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 disabled:opacity-30"
            disabled={currentPage === 0}
            onClick={(e) => {
              e.stopPropagation();
              goToPrevious();
            }}
          >
            <ChevronLeft className="w-8 h-8" />
          </Button>

          {/* Page Indicators */}
          <div className="flex items-center gap-1.5 max-w-[200px] overflow-x-auto">
            {scores.map((_, idx) => (
              <button
                key={idx}
                className={cn(
                  "w-2 h-2 rounded-full transition-all flex-shrink-0",
                  idx === currentPage
                    ? "bg-white w-4"
                    : "bg-white/40 hover:bg-white/60"
                )}
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentPage(idx);
                  setZoom(1);
                  resetHideUITimer();
                }}
              />
            ))}
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20 disabled:opacity-30"
            disabled={currentPage === scores.length - 1}
            onClick={(e) => {
              e.stopPropagation();
              goToNext();
            }}
          >
            <ChevronRight className="w-8 h-8" />
          </Button>
        </div>

        <p className="text-center text-white/50 text-xs mt-2">
          {t("bandView.fullscreenViewer.swipeHint")}
        </p>
      </div>
    </div>
  );
}

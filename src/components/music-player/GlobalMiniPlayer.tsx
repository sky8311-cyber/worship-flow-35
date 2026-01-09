import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { 
  Play, Pause, SkipBack, SkipForward, X, Music, Volume2, Maximize2, ChevronsLeft 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";

export const GlobalMiniPlayer = () => {
  const { t, language } = useTranslation();
  const {
    playlist,
    currentIndex,
    setCurrentIndex,
    isPlaying,
    setIsPlaying,
    playerState,
    setPlayerState,
    closePlayer,
    hidePlayer,
    sendCommand,
  } = useMusicPlayer();

  const currentTrack = playlist[currentIndex];

  const playTrack = useCallback((index: number) => {
    setCurrentIndex(index);
    sendCommand('loadVideo', { videoId: playlist[index]?.videoId });
    setTimeout(() => {
      sendCommand('play');
    }, 150);
    setIsPlaying(true);
  }, [playlist, setCurrentIndex, sendCommand, setIsPlaying]);

  const playNext = () => {
    const nextIndex = (currentIndex + 1) % playlist.length;
    playTrack(nextIndex);
  };

  const playPrevious = () => {
    const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    playTrack(prevIndex);
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      sendCommand('pause');
      setIsPlaying(false);
    } else {
      sendCommand('play');
      setIsPlaying(true);
    }
  };

  const handleClose = () => {
    closePlayer();
  };

  const handleExpand = () => {
    setPlayerState('full');
  };

  const handleHide = () => {
    hidePlayer();
  };

  // Only show when playerState is 'mini'
  if (playerState !== 'mini' || !currentTrack) return null;

  return (
    <div 
      className={cn(
        "fixed left-0 right-0 z-40 bg-background border-t shadow-lg",
        "bottom-14", // Above mobile nav (nav hidden on desktop)
        "animate-in slide-in-from-bottom-2 duration-300"
      )}
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="container max-w-5xl mx-auto">
        <div className="flex items-center gap-2 p-2 sm:p-3">
          {/* Hide button - far left */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleHide}
            className="flex-shrink-0"
            title={language === "ko" ? "숨기기" : "Hide"}
          >
            <ChevronsLeft className="w-5 h-5" />
          </Button>

          {/* Current track info */}
          <button 
            onClick={handleExpand}
            className="flex items-center gap-2 flex-1 min-w-0 text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
              {isPlaying ? (
                <Volume2 className="w-5 h-5 text-white animate-pulse" />
              ) : (
                <Music className="w-5 h-5 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate text-sm">
                {currentTrack.title}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {currentTrack.artist} • {currentIndex + 1}/{playlist.length}
              </p>
            </div>
          </button>

          {/* Controls */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={playPrevious}
              className="hidden sm:flex"
              title={language === "ko" ? "이전" : "Previous"}
            >
              <SkipBack className="w-5 h-5" />
            </Button>
            <Button 
              variant="default" 
              size="icon" 
              className="rounded-full w-10 h-10"
              onClick={togglePlayPause}
              title={isPlaying ? (language === "ko" ? "일시정지" : "Pause") : (language === "ko" ? "재생" : "Play")}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5" />
              ) : (
                <Play className="w-5 h-5 ml-0.5" />
              )}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={playNext}
              className="hidden sm:flex"
              title={language === "ko" ? "다음" : "Next"}
            >
              <SkipForward className="w-5 h-5" />
            </Button>
          </div>

          {/* Expand button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleExpand}
            className="flex-shrink-0"
            title={language === "ko" ? "전체화면" : "Expand"}
          >
            <Maximize2 className="w-5 h-5" />
          </Button>

          {/* Close button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleClose}
            className="flex-shrink-0"
            title={language === "ko" ? "닫기" : "Close"}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

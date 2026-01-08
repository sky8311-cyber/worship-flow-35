import { Button } from "@/components/ui/button";
import { 
  ChevronUp, Play, Pause, SkipBack, SkipForward, X, Music, Volume2 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { PlaylistItem } from "./MusicPlayerMode";

interface MiniPlayerBarProps {
  playlist: PlaylistItem[];
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  onExpand: () => void;
  onClose: () => void;
  playerRef: React.MutableRefObject<any | null>;
}

export const MiniPlayerBar = ({
  playlist,
  currentIndex,
  setCurrentIndex,
  isPlaying,
  setIsPlaying,
  onExpand,
  onClose,
  playerRef,
}: MiniPlayerBarProps) => {
  const { t } = useTranslation();

  const currentTrack = playlist[currentIndex];

  const playTrack = (index: number) => {
    setCurrentIndex(index);
    if (playerRef.current && playlist[index]) {
      playerRef.current.loadVideoById(playlist[index].videoId);
      setIsPlaying(true);
    }
  };

  const playNext = () => {
    const nextIndex = (currentIndex + 1) % playlist.length;
    playTrack(nextIndex);
  };

  const playPrevious = () => {
    const prevIndex = currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
    playTrack(prevIndex);
  };

  const togglePlayPause = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
    } else {
      playerRef.current.playVideo();
      setIsPlaying(true);
    }
  };

  const handleClose = () => {
    if (playerRef.current) {
      try {
        playerRef.current.pauseVideo();
        playerRef.current.destroy();
      } catch (e) {}
      playerRef.current = null;
    }
    setIsPlaying(false);
    onClose();
  };

  if (!currentTrack) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t shadow-lg safe-area-inset-bottom">
      <div className="container max-w-5xl mx-auto">
        <div className="flex items-center gap-2 p-2 sm:p-3">
          {/* Expand button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onExpand}
            className="flex-shrink-0"
          >
            <ChevronUp className="w-5 h-5" />
          </Button>

          {/* Current track info */}
          <button 
            onClick={onExpand}
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
            >
              <SkipBack className="w-5 h-5" />
            </Button>
            <Button 
              variant="default" 
              size="icon" 
              className="rounded-full w-10 h-10"
              onClick={togglePlayPause}
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
            >
              <SkipForward className="w-5 h-5" />
            </Button>
          </div>

          {/* Close button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleClose}
            className="flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Hidden player container for audio continuity */}
      <div 
        id="mini-player-container" 
        className="hidden"
      />
    </div>
  );
};

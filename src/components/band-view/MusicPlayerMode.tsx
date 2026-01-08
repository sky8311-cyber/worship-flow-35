import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  X, ChevronDown, Play, Pause, SkipBack, SkipForward, 
  Repeat, Shuffle, Music, Volume2 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export interface PlaylistItem {
  videoId: string;
  title: string;
  artist: string;
  position: number;
}

interface MusicPlayerModeProps {
  open: boolean;
  onClose: () => void;
  onMinimize: () => void;
  playlist: PlaylistItem[];
  currentIndex: number;
  setCurrentIndex: (index: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  playerRef: React.MutableRefObject<any | null>;
  isRepeat: boolean;
  setIsRepeat: (repeat: boolean) => void;
  isShuffle: boolean;
  setIsShuffle: (shuffle: boolean) => void;
}

export const MusicPlayerMode = ({
  open,
  onClose,
  onMinimize,
  playlist,
  currentIndex,
  setCurrentIndex,
  isPlaying,
  setIsPlaying,
  playerRef,
  isRepeat,
  setIsRepeat,
  isShuffle,
  setIsShuffle,
}: MusicPlayerModeProps) => {
  const { t, language } = useTranslation();
  const [apiReady, setApiReady] = useState(false);
  const playerContainerRef = useRef<HTMLDivElement>(null);
  const shuffleOrderRef = useRef<number[]>([]);

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setApiReady(true);
      return;
    }

    const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
    if (!existingScript) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }

    window.onYouTubeIframeAPIReady = () => {
      setApiReady(true);
    };
  }, []);

  // Initialize player when API is ready and dialog is open
  useEffect(() => {
    if (!apiReady || !open || !playerContainerRef.current || playlist.length === 0) return;
    
    // Destroy existing player if any
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch (e) {}
      playerRef.current = null;
    }

    // Create player container element
    const playerId = "music-player-iframe";
    let playerDiv = document.getElementById(playerId);
    if (!playerDiv) {
      playerDiv = document.createElement("div");
      playerDiv.id = playerId;
      playerContainerRef.current.appendChild(playerDiv);
    }

    const createPlayer = () => {
      playerRef.current = new window.YT.Player(playerId, {
        height: "100%",
        width: "100%",
        videoId: playlist[currentIndex]?.videoId,
        playerVars: {
          autoplay: 0, // iOS Safari doesn't allow autoplay without user gesture
          controls: 1,
          modestbranding: 1,
          rel: 0,
          playsinline: 1, // Required for inline playback on iOS
        },
        events: {
          onReady: () => {
            // Don't auto-play - let user tap video or use play button
            console.log('YouTube player ready');
          },
          onStateChange: handleStateChange,
        },
      });
    };

    // Small delay to ensure container is mounted
    const timer = setTimeout(createPlayer, 100);
    return () => clearTimeout(timer);
  }, [apiReady, open, playlist.length]);

  // Generate shuffle order
  useEffect(() => {
    if (isShuffle && playlist.length > 0) {
      const order = [...Array(playlist.length).keys()];
      // Fisher-Yates shuffle
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      shuffleOrderRef.current = order;
    }
  }, [isShuffle, playlist.length]);

  const handleStateChange = (event: any) => {
    // YT.PlayerState.ENDED = 0
    if (event.data === 0) {
      playNext();
    }
    // YT.PlayerState.PLAYING = 1
    if (event.data === 1) {
      setIsPlaying(true);
    }
    // YT.PlayerState.PAUSED = 2
    if (event.data === 2) {
      setIsPlaying(false);
    }
  };

  const getNextIndex = () => {
    if (isShuffle) {
      const currentShufflePos = shuffleOrderRef.current.indexOf(currentIndex);
      const nextShufflePos = (currentShufflePos + 1) % playlist.length;
      return shuffleOrderRef.current[nextShufflePos];
    }
    return (currentIndex + 1) % playlist.length;
  };

  const getPrevIndex = () => {
    if (isShuffle) {
      const currentShufflePos = shuffleOrderRef.current.indexOf(currentIndex);
      const prevShufflePos = currentShufflePos === 0 ? playlist.length - 1 : currentShufflePos - 1;
      return shuffleOrderRef.current[prevShufflePos];
    }
    return currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
  };

  const playTrack = (index: number) => {
    setCurrentIndex(index);
    if (playerRef.current && playlist[index]) {
      playerRef.current.loadVideoById(playlist[index].videoId);
      setIsPlaying(true);
    }
  };

  const playNext = () => {
    const nextIndex = getNextIndex();
    // If we're at the end and repeat is off, stop
    if (!isRepeat && currentIndex === playlist.length - 1 && !isShuffle) {
      setIsPlaying(false);
      return;
    }
    playTrack(nextIndex);
  };

  const playPrevious = () => {
    const prevIndex = getPrevIndex();
    playTrack(prevIndex);
  };

  const togglePlayPause = () => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  };

  const handleClose = () => {
    if (playerRef.current) {
      try {
        playerRef.current.pauseVideo();
      } catch (e) {}
    }
    setIsPlaying(false);
    onClose();
  };

  const currentTrack = playlist[currentIndex];

  if (playlist.length === 0) {
    return (
      <Dialog open={open} onOpenChange={() => onClose()}>
        <DialogContent className="max-w-md">
          <div className="text-center py-8">
            <Music className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">{t("bandView.musicPlayer.noYoutubeLinks")}</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <DialogContent 
        className="max-w-2xl w-[95vw] h-[90vh] max-h-[90vh] p-0 flex flex-col overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={handleClose}
        hideCloseButton={true}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={onMinimize} className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
            <ChevronDown className="w-4 h-4" />
            <span className="hidden sm:inline">{t("bandView.musicPlayer.minimize")}</span>
          </Button>
          <span className="font-semibold text-sm sm:text-base">{t("bandView.musicPlayer.title")}</span>
          <Button variant="ghost" size="icon" onClick={handleClose} className="w-8 h-8 sm:w-10 sm:h-10">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Video Player - constrained height to leave room for playlist */}
        <div className="flex-shrink-0 bg-black max-h-[35vh]">
          <div 
            ref={playerContainerRef}
            className="aspect-video w-full max-h-[35vh]"
          />
        </div>

        {/* Now Playing Info */}
        <div className="p-3 sm:p-4 border-b flex-shrink-0">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg bg-gradient-primary flex items-center justify-center flex-shrink-0">
              <Music className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-foreground truncate text-sm sm:text-base">
                {currentTrack?.title || t("bandView.noTitle")}
              </h3>
              <p className="text-xs sm:text-sm text-muted-foreground truncate">
                {currentTrack?.artist || ""}
              </p>
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground flex-shrink-0">
              {currentIndex + 1} / {playlist.length}
            </div>
          </div>

          {/* Controls - Responsive sizing */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 mt-3 sm:mt-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsShuffle(!isShuffle)}
              className={cn("w-8 h-8 sm:w-10 sm:h-10", isShuffle && "text-primary")}
            >
              <Shuffle className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={playPrevious} className="w-8 h-8 sm:w-10 sm:h-10">
              <SkipBack className="w-5 h-5 sm:w-6 sm:h-6" />
            </Button>
            <Button 
              variant="default" 
              size="icon" 
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full"
              onClick={togglePlayPause}
            >
              {isPlaying ? <Pause className="w-5 h-5 sm:w-6 sm:h-6" /> : <Play className="w-5 h-5 sm:w-6 sm:h-6 ml-0.5" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={playNext} className="w-8 h-8 sm:w-10 sm:h-10">
              <SkipForward className="w-5 h-5 sm:w-6 sm:h-6" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsRepeat(!isRepeat)}
              className={cn("w-8 h-8 sm:w-10 sm:h-10", isRepeat && "text-primary")}
            >
              <Repeat className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>
        </div>

        {/* Playlist - minimum height to show at least 3 songs */}
        <div className="flex-1 min-h-[180px] flex flex-col overflow-hidden">
          <div className="px-3 sm:px-4 py-2 border-b bg-muted/30 flex-shrink-0">
            <span className="text-xs sm:text-sm font-medium">
              {t("bandView.musicPlayer.playlist")} ({playlist.length}{language === "ko" ? "곡" : " songs"})
            </span>
          </div>
          <ScrollArea className="flex-1">
            <div className="p-2">
              {playlist.map((item, index) => (
                <button
                  key={`${item.videoId}-${index}`}
                  onClick={() => playTrack(index)}
                  className={cn(
                    "w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg text-left transition-colors",
                    index === currentIndex 
                      ? "bg-primary/10 text-primary" 
                      : "hover:bg-muted"
                  )}
                >
                  <span className={cn(
                    "w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center text-xs sm:text-sm font-medium rounded flex-shrink-0",
                    index === currentIndex ? "bg-primary text-primary-foreground" : "bg-muted"
                  )}>
                    {index === currentIndex && isPlaying ? (
                      <Volume2 className="w-3 h-3 sm:w-4 sm:h-4 animate-pulse" />
                    ) : (
                      item.position
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "truncate font-medium text-sm",
                      index === currentIndex ? "text-primary" : "text-foreground"
                    )}>
                      {item.title}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {item.artist}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};

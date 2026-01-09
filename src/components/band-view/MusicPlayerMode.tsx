import { useEffect, useRef, useState, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { 
  X, ChevronDown, Play, Pause, SkipBack, SkipForward, 
  Repeat, Shuffle, Music, Volume2 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { toast } from "sonner";

// Format seconds to mm:ss
const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

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
  iframeRef: React.RefObject<HTMLIFrameElement>;
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
  iframeRef,
  isRepeat,
  setIsRepeat,
  isShuffle,
  setIsShuffle,
}: MusicPlayerModeProps) => {
  const { t, language } = useTranslation();
  const [playerReady, setPlayerReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const shuffleOrderRef = useRef<number[]>([]);

  // Send command to proxy iframe via postMessage
  const sendCommand = useCallback((command: string, args?: any) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'command', command, args },
        '*'
      );
    }
  }, [iframeRef]);

  // Listen for messages from proxy iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || event.data.source !== 'youtube-proxy') return;
      
      const { type, state } = event.data;
      
      switch (type) {
        case 'ready':
          console.log('[MusicPlayer] Proxy player ready');
          setPlayerReady(true);
          break;
          
        case 'stateChange':
          console.log('[MusicPlayer] State change:', state);
          // Update time info if available
          if (event.data.currentTime !== undefined) setCurrentTime(event.data.currentTime);
          if (event.data.duration !== undefined) setDuration(event.data.duration);
          // YT.PlayerState: ENDED=0, PLAYING=1, PAUSED=2
          if (state === 0) {
            // Video ended - play next
            handleVideoEnded();
          } else if (state === 1) {
            setIsPlaying(true);
          } else if (state === 2) {
            setIsPlaying(false);
          }
          break;
          
        case 'currentState':
          if (event.data.currentTime !== undefined) setCurrentTime(event.data.currentTime);
          if (event.data.duration !== undefined) setDuration(event.data.duration);
          break;
          
        case 'error':
          console.error('[MusicPlayer] Proxy error:', event.data);
          const errorMessages: Record<number, string> = {
            2: 'Invalid video ID',
            5: 'HTML5 player error',
            100: 'Video not found',
            101: 'Embedding not allowed',
            150: 'Embedding not allowed',
          };
          const code = event.data.code;
          const msg = errorMessages[code] || `Error code: ${code}`;
          toast.error(language === "ko" ? `재생 오류: ${msg}` : `Playback error: ${msg}`);
          break;
          
        case 'proxyLoaded':
          console.log('[MusicPlayer] Proxy page loaded');
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [language, setIsPlaying]);

  // No iframe DOM manipulation - iframe is managed by parent with CSS positioning

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

  const getNextIndex = useCallback(() => {
    if (isShuffle) {
      const currentShufflePos = shuffleOrderRef.current.indexOf(currentIndex);
      const nextShufflePos = (currentShufflePos + 1) % playlist.length;
      return shuffleOrderRef.current[nextShufflePos];
    }
    return (currentIndex + 1) % playlist.length;
  }, [isShuffle, currentIndex, playlist.length]);

  const getPrevIndex = useCallback(() => {
    if (isShuffle) {
      const currentShufflePos = shuffleOrderRef.current.indexOf(currentIndex);
      const prevShufflePos = currentShufflePos === 0 ? playlist.length - 1 : currentShufflePos - 1;
      return shuffleOrderRef.current[prevShufflePos];
    }
    return currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
  }, [isShuffle, currentIndex, playlist.length]);

  const handleVideoEnded = useCallback(() => {
    // If repeat is ON, replay the same song from beginning
    if (isRepeat) {
      sendCommand('seekTo', { seconds: 0 });
      sendCommand('play');
      return;
    }
    
    // If we're at the end with no shuffle, stop playback
    if (currentIndex === playlist.length - 1 && !isShuffle) {
      setIsPlaying(false);
      return;
    }
    
    // Play next track
    const nextIndex = getNextIndex();
    setCurrentIndex(nextIndex);
    sendCommand('loadVideo', { videoId: playlist[nextIndex]?.videoId });
  }, [isRepeat, isShuffle, currentIndex, playlist, getNextIndex, setCurrentIndex, setIsPlaying, sendCommand]);

  const playTrack = useCallback((index: number) => {
    setCurrentIndex(index);
    setCurrentTime(0);
    sendCommand('loadVideo', { videoId: playlist[index]?.videoId });
    // Ensure autoplay by sending play command after a short delay
    setTimeout(() => {
      sendCommand('play');
    }, 100);
    setIsPlaying(true);
  }, [playlist, setCurrentIndex, sendCommand, setIsPlaying]);

  const playNext = useCallback(() => {
    const nextIndex = getNextIndex();
    if (!isRepeat && currentIndex === playlist.length - 1 && !isShuffle) {
      setIsPlaying(false);
      return;
    }
    playTrack(nextIndex);
  }, [getNextIndex, isRepeat, currentIndex, playlist.length, isShuffle, setIsPlaying, playTrack]);

  const playPrevious = useCallback(() => {
    const prevIndex = getPrevIndex();
    playTrack(prevIndex);
  }, [getPrevIndex, playTrack]);

  const togglePlayPause = useCallback(() => {
    if (!playerReady) {
      toast.info(language === "ko" ? "플레이어 로딩 중..." : "Loading player...");
      return;
    }
    if (isPlaying) {
      sendCommand('pause');
    } else {
      sendCommand('play');
    }
  }, [playerReady, isPlaying, sendCommand, language]);

  // Periodically get current time while playing
  useEffect(() => {
    if (!isPlaying || !open) return;
    
    const interval = setInterval(() => {
      sendCommand('getState');
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isPlaying, open, sendCommand]);

  const handleSeek = useCallback((value: number) => {
    setCurrentTime(value);
    sendCommand('seekTo', { seconds: value });
  }, [sendCommand]);

  const handleClose = () => {
    sendCommand('pause');
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
        className="fixed inset-0 translate-x-0 translate-y-0 left-0 top-0 max-w-none w-full h-[100dvh] max-h-[100dvh] p-0 flex flex-col overflow-hidden rounded-none border-0 z-[50] bg-background"
        style={{
          paddingTop: 'env(safe-area-inset-top, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={handleClose}
        hideCloseButton={true}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b flex-shrink-0 bg-background">
          <Button variant="ghost" size="sm" onClick={onMinimize} className="gap-1 sm:gap-2 text-xs sm:text-sm px-2 sm:px-3">
            <ChevronDown className="w-4 h-4" />
            <span className="hidden sm:inline">{t("bandView.musicPlayer.minimize")}</span>
          </Button>
          <span className="font-semibold text-sm sm:text-base">{t("bandView.musicPlayer.title")}</span>
          <Button variant="ghost" size="icon" onClick={handleClose} className="w-8 h-8 sm:w-10 sm:h-10">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Album Art Style Audio Visualization */}
        <div className="flex-shrink-0 py-8 flex justify-center items-center bg-muted/30">
          <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-lg">
            <Music className="w-16 h-16 sm:w-20 sm:h-20 text-white" />
            {isPlaying && (
              <div className="absolute inset-0 rounded-2xl animate-pulse bg-white/10" />
            )}
          </div>
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

          {/* Controls */}
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

          {/* Seek Bar */}
          <div className="flex items-center gap-3 mt-4 px-2">
            <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={1}
              onValueChange={([value]) => handleSeek(value)}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-10 tabular-nums">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Playlist */}
        <div className="flex-1 min-h-[200px] flex flex-col overflow-hidden">
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

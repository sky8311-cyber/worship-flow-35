import { useEffect, useRef, useState, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  X, ChevronDown, Play, Pause, SkipBack, SkipForward, 
  Music, Volume2, RotateCcw, RotateCw 
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
  lyrics?: string;
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
}: MusicPlayerModeProps) => {
  const { t, language } = useTranslation();
  const [playerReady, setPlayerReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [seekValue, setSeekValue] = useState<number | null>(null);
  const handleVideoEndedRef = useRef<() => void>(() => {});
  const isSeekingRef = useRef(false);
  const lastStateRef = useRef<number | null>(null);
  const wasPlayingBeforeSeekRef = useRef(false);
  const isPlayingRef = useRef(isPlaying);

  // Keep isPlayingRef in sync
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Compute displayed slider value
  const sliderTime = seekValue ?? currentTime;

  // Send command to proxy iframe via postMessage
  const sendCommand = useCallback((command: string, args?: any) => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage(
        { type: 'command', command, args },
        '*'
      );
    }
  }, [iframeRef]);

  // Centralized state handler for both stateChange and currentState
  const applyPlayerState = useCallback((state: number | undefined, time: number | undefined, dur: number | undefined) => {
    // Only update time if not seeking (prevents rubber-banding)
    if (!isSeekingRef.current) {
      if (time !== undefined) setCurrentTime(time);
      if (dur !== undefined) setDuration(dur);
    }

    if (state === undefined) return;

    // YT.PlayerState: ENDED=0, PLAYING=1, PAUSED=2, BUFFERING=3, CUED=5
    // Guard all isPlaying updates during seeking to prevent visual flicker
    if (state === 1) {
      if (!isSeekingRef.current) {
        setIsPlaying(true);
      }
    } else if (state === 2) {
      if (!isSeekingRef.current) {
        setIsPlaying(false);
      }
    }

    // Handle ENDED - use guard to prevent double-firing
    if (state === 0 && lastStateRef.current !== 0) {
      handleVideoEndedRef.current();
    }
    lastStateRef.current = state;
  }, [setIsPlaying]);

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
          applyPlayerState(state, event.data.currentTime, event.data.duration);
          break;
          
        case 'currentState':
          // Also check for ENDED state here (polling backup)
          applyPlayerState(event.data.state, event.data.currentTime, event.data.duration);
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
  }, [language, applyPlayerState]);

  // No iframe DOM manipulation - iframe is managed by parent with CSS positioning

  const getNextIndex = useCallback(() => {
    return (currentIndex + 1) % playlist.length;
  }, [currentIndex, playlist.length]);

  const getPrevIndex = useCallback(() => {
    return currentIndex === 0 ? playlist.length - 1 : currentIndex - 1;
  }, [currentIndex, playlist.length]);

  const handleVideoEnded = useCallback(() => {
    console.log('[MusicPlayer] handleVideoEnded - currentIndex:', currentIndex);
    
    // If we're at the last song, stop playback
    if (currentIndex === playlist.length - 1) {
      console.log('[MusicPlayer] Last track, stopping');
      setIsPlaying(false);
      return;
    }
    
    // Play next track
    const nextIndex = getNextIndex();
    console.log('[MusicPlayer] Advancing to track:', nextIndex);
    setCurrentIndex(nextIndex);
    setCurrentTime(0);
    
    // loadVideo + multiple play attempts for reliability
    sendCommand('loadVideo', { videoId: playlist[nextIndex]?.videoId });
    setTimeout(() => sendCommand('play'), 200);
    setTimeout(() => sendCommand('play'), 500);
  }, [currentIndex, playlist, getNextIndex, setCurrentIndex, setIsPlaying, sendCommand]);

  // Auto-play when player becomes ready
  useEffect(() => {
    if (open && playerReady && playlist.length > 0) {
      const currentVideoId = playlist[currentIndex]?.videoId;
      if (currentVideoId) {
        console.log('[MusicPlayer] Player ready, loading current track:', currentVideoId);
        setTimeout(() => {
          sendCommand('loadVideo', { videoId: currentVideoId });
          setTimeout(() => sendCommand('play'), 200);
        }, 100);
      }
    }
  }, [open, playerReady]); // Intentionally exclude playlist/currentIndex for initial load only

  // Keep ref in sync with latest handleVideoEnded
  useEffect(() => {
    handleVideoEndedRef.current = handleVideoEnded;
  }, [handleVideoEnded]);

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
    if (currentIndex === playlist.length - 1) {
      setIsPlaying(false);
      return;
    }
    const nextIndex = getNextIndex();
    playTrack(nextIndex);
  }, [getNextIndex, currentIndex, playlist.length, setIsPlaying, playTrack]);

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

  const skipBackward = useCallback(() => {
    const newTime = Math.max(0, currentTime - 10);
    setCurrentTime(newTime);
    sendCommand('seekTo', { seconds: newTime });
  }, [currentTime, sendCommand]);

  const skipForward = useCallback(() => {
    const newTime = Math.min(duration, currentTime + 10);
    setCurrentTime(newTime);
    sendCommand('seekTo', { seconds: newTime });
  }, [currentTime, duration, sendCommand]);

  // Periodically get current time while playing (skip if seeking)
  useEffect(() => {
    if (!isPlaying || !open) return;
    
    const interval = setInterval(() => {
      if (!isSeekingRef.current) {
        sendCommand('getState');
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isPlaying, open, sendCommand]);

  // Handle slider drag start - use ref for stable callback
  const handleSeekStart = useCallback(() => {
    isSeekingRef.current = true;
    wasPlayingBeforeSeekRef.current = isPlayingRef.current;
  }, []); // No dependencies - uses ref

  // Handle slider value change during drag (preview only)
  const handleSeekChange = useCallback((value: number[]) => {
    if (!isSeekingRef.current) {
      isSeekingRef.current = true;
      wasPlayingBeforeSeekRef.current = isPlayingRef.current;
    }
    setSeekValue(value[0]);
  }, []); // No dependencies - uses ref

  // Handle slider commit (actual seek)
  const handleSeekCommit = useCallback((value: number[]) => {
    const seconds = value[0];
    setCurrentTime(seconds);
    setSeekValue(null);
    isSeekingRef.current = false;
    sendCommand('seekTo', { seconds });
    // Resume playback if was playing before seek
    if (wasPlayingBeforeSeekRef.current) {
      setTimeout(() => {
        sendCommand('play');
      }, 100);
    }
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
          <div className="flex items-center justify-center gap-1 sm:gap-3 mt-3 sm:mt-4">
            <Button variant="ghost" size="icon" onClick={skipBackward} className="w-8 h-8 sm:w-10 sm:h-10">
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
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
            <Button variant="ghost" size="icon" onClick={skipForward} className="w-8 h-8 sm:w-10 sm:h-10">
              <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
          </div>

          {/* Seek Bar */}
          <div 
            className="flex items-center gap-3 mt-4 px-2"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            onTouchEnd={(e) => e.stopPropagation()}
          >
            <span className="text-xs text-muted-foreground w-10 text-right tabular-nums">
              {formatTime(sliderTime)}
            </span>
            <Slider
              value={[sliderTime]}
              max={duration || 100}
              step={1}
              onPointerDown={handleSeekStart}
              onValueChange={handleSeekChange}
              onValueCommit={handleSeekCommit}
              className="flex-1"
            />
            <span className="text-xs text-muted-foreground w-10 tabular-nums">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Lyrics / Playlist */}
        <div className="flex-1 min-h-[200px] flex flex-col overflow-hidden">
          <Tabs
            defaultValue="playlist"
            key={currentIndex}
            className="flex flex-col flex-1 min-h-0"
          >
            <TabsList className="w-full rounded-none border-b bg-muted/30 h-9 flex-shrink-0">
              <TabsTrigger value="playlist" className="flex-1 text-xs">
                {t("bandView.musicPlayer.playlist")} ({playlist.length}{language === "ko" ? "곡" : " songs"})
              </TabsTrigger>
              {currentTrack?.lyrics && (
                <TabsTrigger value="lyrics" className="flex-1 text-xs">
                  {language === "ko" ? "가사" : "Lyrics"}
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="playlist" className="mt-0 flex-1 min-h-0">
              <ScrollArea className="flex-1 h-full">
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
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

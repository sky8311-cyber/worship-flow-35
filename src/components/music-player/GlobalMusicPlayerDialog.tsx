import { useCallback, useEffect, useState, useRef } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { 
  X, ChevronDown, Play, Pause, SkipBack, SkipForward, 
  Music, Volume2, RotateCcw, RotateCw 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { toast } from "sonner";

// Format seconds to mm:ss
const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const GlobalMusicPlayerDialog = () => {
  const { t, language } = useTranslation();
  const {
    playlist,
    currentIndex,
    setCurrentIndex,
    isPlaying,
    setIsPlaying,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    playerState,
    setPlayerState,
    closePlayer,
    sendCommand,
    iframeRef,
    playerReady,
    setPlayerReady,
    setTitle,
  } = useMusicPlayer();

  const [isSeeking, setIsSeeking] = useState(false);
  const seekValueRef = useRef<number>(0);
  const currentTrack = playlist[currentIndex];

  // Apply player state from proxy messages
  const applyPlayerState = useCallback((state: number | undefined, time: number | undefined, dur: number | undefined) => {
    if (dur !== undefined && dur > 0) {
      setDuration(dur);
    }
    if (time !== undefined && !isSeeking) {
      setCurrentTime(time);
    }
    if (state !== undefined) {
      // YT.PlayerState: PLAYING = 1, PAUSED = 2, ENDED = 0
      if (state === 1) {
        setIsPlaying(true);
      } else if (state === 2 || state === 0) {
        setIsPlaying(false);
      }
    }
  }, [setDuration, setCurrentTime, setIsPlaying, isSeeking]);

  // Handle video ended
  const handleVideoEnded = useCallback(() => {
    if (currentIndex < playlist.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      sendCommand('loadVideo', { videoId: playlist[nextIndex]?.videoId });
      setTimeout(() => {
        sendCommand('play');
      }, 150);
      setIsPlaying(true);
    } else {
      // End of playlist
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [currentIndex, playlist, setCurrentIndex, sendCommand, setIsPlaying, setCurrentTime]);

  // Listen to messages from the proxy iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Only handle messages from our youtube proxy
      if (event.data?.source !== 'youtube-proxy') return;
      
      const { type, state, currentTime: time, duration: dur, error } = event.data || {};
      
      if (type === 'stateChange' || type === 'currentState') {
        applyPlayerState(state, time, dur);
        // Handle video ended
        if (state === 0) {
          handleVideoEnded();
        }
      } else if (type === 'ready') {
        console.log('[GlobalMusicPlayerDialog] Player ready');
        setPlayerReady(true);
      } else if (type === 'error') {
        console.error('[GlobalMusicPlayerDialog] Player error:', error);
        toast.error(language === 'ko' ? '영상을 재생할 수 없습니다.' : 'Cannot play this video.');
      }
    };
    
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [applyPlayerState, handleVideoEnded, setPlayerReady, language]);

  // Load first video when player becomes ready (but don't auto-play - wait for user tap)
  const hasLoadedFirstVideoRef = useRef(false);
  const currentSetIdRef = useRef<string | null>(null);
  
  useEffect(() => {
    // Reset when playlist changes
    const currentSetId = playlist.length > 0 ? playlist[0]?.videoId : null;
    if (currentSetId !== currentSetIdRef.current) {
      currentSetIdRef.current = currentSetId;
      hasLoadedFirstVideoRef.current = false;
    }
    
    // Load the first video when ready (cued state - not playing)
    if (playerReady && playerState === 'full' && playlist.length > 0 && !hasLoadedFirstVideoRef.current) {
      const videoId = playlist[currentIndex]?.videoId;
      if (videoId) {
        console.log('[GlobalMusicPlayerDialog] Loading first video (waiting for user tap):', videoId);
        hasLoadedFirstVideoRef.current = true;
        sendCommand('loadVideo', { videoId });
      }
    }
    
    // Reset when player closes
    if (playerState === 'closed') {
      hasLoadedFirstVideoRef.current = false;
    }
  }, [playerReady, playerState, playlist, currentIndex, sendCommand]);

  // Periodically get current state while playing
  useEffect(() => {
    if (playerState !== 'full' || isSeeking) return;
    
    const interval = setInterval(() => {
      sendCommand('getState');
    }, 1000);
    
    return () => clearInterval(interval);
  }, [playerState, sendCommand, isSeeking]);

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

  const skipBackward = useCallback(() => {
    const newTime = Math.max(0, currentTime - 10);
    setCurrentTime(newTime);
    sendCommand('seekTo', { seconds: newTime });
  }, [currentTime, sendCommand, setCurrentTime]);

  const skipForward = useCallback(() => {
    const newTime = Math.min(duration, currentTime + 10);
    setCurrentTime(newTime);
    sendCommand('seekTo', { seconds: newTime });
  }, [currentTime, duration, sendCommand, setCurrentTime]);

  const handleSeekStart = () => {
    setIsSeeking(true);
  };

  const handleSeekChange = (value: number[]) => {
    seekValueRef.current = value[0];
    setCurrentTime(value[0]);
  };

  const handleSeekCommit = (value: number[]) => {
    sendCommand('seekTo', { seconds: value[0] });
    setIsSeeking(false);
  };

  const handleClose = () => {
    closePlayer();
  };

  const handleMinimize = () => {
    setPlayerState('mini');
  };

  const isOpen = playerState === 'full';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleMinimize()}>
      <DialogContent 
        className="max-w-lg p-0 gap-0 overflow-hidden bg-background/95 backdrop-blur-xl border-0 shadow-2xl"
        onPointerDownOutside={(e) => e.preventDefault()}
        hideCloseButton
      >
        <DialogTitle className="sr-only">
          {t("bandView.musicPlayer.title")}
        </DialogTitle>
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-primary text-white">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleMinimize}
            className="text-white hover:bg-white/20"
          >
            <ChevronDown className="w-6 h-6" />
          </Button>
          <div className="flex-1 text-center">
            <h3 className="font-semibold text-sm truncate px-2">
              {setTitle || t("bandView.musicPlayer.title")}
            </h3>
            <p className="text-xs text-white/70">
              {currentIndex + 1} / {playlist.length}
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleClose}
            className="text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Current Track Display - with play overlay for first load */}
        <div className="p-6 text-center">
          <div 
            className="w-24 h-24 sm:w-32 sm:h-32 mx-auto mb-4 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-lg relative cursor-pointer"
            onClick={() => !isPlaying && togglePlayPause()}
          >
            {isPlaying ? (
              <Volume2 className="w-12 h-12 sm:w-16 sm:h-16 text-white animate-pulse" />
            ) : (
              <>
                <Music className="w-12 h-12 sm:w-16 sm:h-16 text-white opacity-50" />
                {/* Large play overlay when not playing */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded-2xl">
                  <Play className="w-10 h-10 sm:w-12 sm:h-12 text-white fill-white" />
                </div>
              </>
            )}
          </div>
          <h4 className="font-bold text-lg sm:text-xl text-foreground mb-1 truncate px-4">
            {currentTrack?.title || t("bandView.noTitle")}
          </h4>
          <p className="text-sm text-muted-foreground truncate px-4">
            {currentTrack?.artist || ""}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="px-6 pb-2">
          <Slider
            value={[currentTime]}
            min={0}
            max={duration || 100}
            step={1}
            onPointerDown={handleSeekStart}
            onValueChange={handleSeekChange}
            onValueCommit={handleSeekCommit}
            className="w-full"
            trackClassName="bg-muted/50 h-2"
            rangeClassName="bg-gradient-to-r from-primary to-accent"
            thumbClassName="border-accent bg-background shadow-md"
          />
          <div className="flex justify-between text-xs text-muted-foreground mt-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-1 sm:gap-3 mt-3 sm:mt-4 px-6 pb-4">
          <Button variant="ghost" size="icon" onClick={skipBackward} className="w-8 h-8 sm:w-10 sm:h-10">
            <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={playPrevious} className="w-8 h-8 sm:w-10 sm:h-10">
            <SkipBack className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>
          <Button 
            variant="default" 
            size="icon" 
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-lg"
            onClick={togglePlayPause}
          >
            {isPlaying ? (
              <Pause className="w-7 h-7 sm:w-8 sm:h-8" />
            ) : (
              <Play className="w-7 h-7 sm:w-8 sm:h-8 ml-1" />
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={playNext} className="w-8 h-8 sm:w-10 sm:h-10">
            <SkipForward className="w-5 h-5 sm:w-6 sm:h-6" />
          </Button>
          <Button variant="ghost" size="icon" onClick={skipForward} className="w-8 h-8 sm:w-10 sm:h-10">
            <RotateCw className="w-4 h-4 sm:w-5 sm:h-5" />
          </Button>
        </div>

        {/* Playlist */}
        <div className="border-t">
          <div className="p-3 bg-muted/30">
            <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {t("bandView.musicPlayer.playlist")}
            </h5>
          </div>
          <ScrollArea className="h-48 sm:h-56">
            <div className="divide-y">
              {playlist.map((item, index) => (
                <button
                  key={`${item.videoId}-${index}`}
                  onClick={() => playTrack(index)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 text-left transition-colors hover:bg-accent/50",
                    index === currentIndex && "bg-primary/10"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-sm font-bold",
                    index === currentIndex 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-muted text-muted-foreground"
                  )}>
                    {index === currentIndex && isPlaying ? (
                      <Volume2 className="w-4 h-4 animate-pulse" />
                    ) : (
                      item.position
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn(
                      "font-medium truncate text-sm",
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

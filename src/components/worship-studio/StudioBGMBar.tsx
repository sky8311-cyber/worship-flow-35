import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { Button } from "@/components/ui/button";
import { Play, Pause, X, Music, SkipForward, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface StudioBGMBarProps {
  songTitle: string;
  songArtist?: string | null;
  videoId: string;
  roomId: string;
  ownerName?: string;
}

export function StudioBGMBar({ 
  songTitle, 
  songArtist, 
  videoId, 
  roomId, 
  ownerName 
}: StudioBGMBarProps) {
  const { language } = useTranslation();
  const { startPlaylist, closePlayer, isPlaying, setPlayerState } = useMusicPlayer();
  const [hasStarted, setHasStarted] = useState(false);
  
  const handlePlay = () => {
    if (!hasStarted) {
      startPlaylist(
        [{
          videoId,
          title: songTitle,
          artist: songArtist || "",
          position: 0,
        }],
        `${ownerName || "Studio"} BGM`,
        roomId
      );
      setPlayerState("mini");
      setHasStarted(true);
    }
  };
  
  const handleClose = () => {
    closePlayer();
    setHasStarted(false);
  };
  
  return (
    <div className="bg-background/95 backdrop-blur-sm border-t border-border flex-shrink-0">
      <div className="flex items-center gap-3 px-4 py-3 max-w-3xl mx-auto">
        {/* Music icon */}
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Music className="h-5 w-5 text-primary" />
        </div>
        
        {/* Song info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate">{songTitle}</p>
          {songArtist && (
            <p className="text-xs text-muted-foreground truncate">{songArtist}</p>
          )}
        </div>
        
        {/* Controls */}
        <div className="flex items-center gap-1">
          {!hasStarted ? (
            <Button onClick={handlePlay} size="sm" className="gap-2">
              <Play className="h-4 w-4" />
              {language === "ko" ? "재생" : "Play"}
            </Button>
          ) : (
            <>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => isPlaying ? closePlayer() : handlePlay()}
                className="h-9 w-9"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
            </>
          )}
          
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleClose}
            className="h-9 w-9 text-muted-foreground"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

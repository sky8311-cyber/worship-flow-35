import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Bell, Music, Play, Pause } from "lucide-react";
import { ProfileDropdownMenu } from "./ProfileDropdownMenu";
import { cn } from "@/lib/utils";

interface StudioHeaderProps {
  onBack: () => void;
  onSettings?: () => void;
  onShare?: () => void;
  onBGM?: () => void;
  onVisibility?: () => void;
  onNotifications?: () => void;
  bgmSongTitle?: string | null;
  bgmSongArtist?: string | null;
  bgmVideoId?: string | null;
  bgmRoomId?: string | null;
  bgmOwnerName?: string | null;
}

export function StudioHeader({ 
  onBack, 
  onSettings, 
  onShare,
  onBGM,
  onVisibility,
  onNotifications,
  bgmSongTitle,
  bgmSongArtist,
  bgmVideoId,
  bgmRoomId,
  bgmOwnerName,
}: StudioHeaderProps) {
  const { language } = useTranslation();
  const title = language === "ko" ? "예배공작소" : "Worship Studio";
  
  return (
    <header className="flex items-center justify-between px-3 py-2 border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onBack}
          className="h-9 w-9"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-base font-semibold tracking-tight">{title}</h1>
      </div>
      
      <div className="flex items-center gap-1">
        {/* Mini BGM Player */}
        {bgmSongTitle && bgmVideoId && bgmRoomId && (
          <MiniBGMPlayer
            songTitle={bgmSongTitle}
            songArtist={bgmSongArtist || undefined}
            videoId={bgmVideoId}
            roomId={bgmRoomId}
            ownerName={bgmOwnerName || undefined}
          />
        )}

        {onNotifications && (
          <Button variant="ghost" size="icon" onClick={onNotifications} className="h-9 w-9">
            <Bell className="h-5 w-5" />
          </Button>
        )}
        
        <ProfileDropdownMenu
          onSettings={onSettings}
          onShare={onShare}
          onBGM={onBGM}
          onVisibility={onVisibility}
          onExit={onBack}
        />
      </div>
    </header>
  );
}

// --- Mini BGM Player (Winamp/Cyworld style) ---

interface MiniBGMPlayerProps {
  songTitle: string;
  songArtist?: string;
  videoId: string;
  roomId: string;
  ownerName?: string;
}

function MiniBGMPlayer({ songTitle, songArtist, videoId, roomId, ownerName }: MiniBGMPlayerProps) {
  const { startPlaylist, closePlayer, isPlaying, setPlayerState } = useMusicPlayer();
  const [hasStarted, setHasStarted] = useState(false);
  const needsMarquee = songTitle.length > 15;

  const handleToggle = () => {
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
    } else if (isPlaying) {
      closePlayer();
    } else {
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
    }
  };

  return (
    <button
      onClick={handleToggle}
      className="flex items-center gap-1.5 bg-muted/50 hover:bg-muted rounded-full px-3 py-1 max-w-[200px] transition-colors"
    >
      <Music className="h-3.5 w-3.5 shrink-0 text-[#b8902a]" />
      
      <div className="overflow-hidden max-w-[120px]">
        <span
          className={cn(
            "text-xs whitespace-nowrap block",
            needsMarquee && "animate-marquee"
          )}
        >
          {songTitle}
        </span>
      </div>

      {hasStarted && isPlaying ? (
        <Pause className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <Play className="h-3.5 w-3.5 shrink-0" />
      )}
    </button>
  );
}

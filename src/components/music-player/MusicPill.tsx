import { Music, Volume2 } from "lucide-react";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";
import { cn } from "@/lib/utils";

export const MusicPill = () => {
  const { playlist, currentIndex, isPlaying, showPlayer } = useMusicPlayer();

  const currentTrack = playlist[currentIndex];
  if (!currentTrack) return null;

  return (
    <button
      onClick={showPlayer}
      className={cn(
        "fixed bottom-20 left-4 z-40 flex items-center gap-2 px-3 py-2 rounded-full",
        "bg-primary text-primary-foreground shadow-lg",
        "transition-all duration-300 hover:scale-105 active:scale-95",
        "animate-in slide-in-from-left-4"
      )}
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom, 0px))' }}
    >
      <div className="relative">
        {isPlaying ? (
          <Volume2 className="w-5 h-5 animate-pulse" />
        ) : (
          <Music className="w-5 h-5" />
        )}
      </div>
      <span className="text-xs font-medium max-w-24 truncate hidden sm:inline">
        {currentTrack.title}
      </span>
      <span className="text-xs font-bold bg-primary-foreground/20 px-1.5 py-0.5 rounded-full">
        {currentIndex + 1}/{playlist.length}
      </span>
    </button>
  );
};

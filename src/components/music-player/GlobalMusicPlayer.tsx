import { GlobalMiniPlayer } from "./GlobalMiniPlayer";
import { GlobalMusicPlayerDialog } from "./GlobalMusicPlayerDialog";
import { GlobalYouTubeIframe } from "./GlobalYouTubeIframe";
import { MusicPill } from "./MusicPill";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";

export const GlobalMusicPlayer = () => {
  const { playerState, playlist } = useMusicPlayer();

  // Don't render anything if no playlist and player is closed
  if (playlist.length === 0 && playerState === 'closed') return null;

  return (
    <>
      {/* Mini Player Bar - shown when playerState is 'mini' */}
      <GlobalMiniPlayer />
      
      {/* Music Pill - shown when playerState is 'hidden' */}
      {playerState === 'hidden' && <MusicPill />}
      
      {/* Full Player Dialog - shown when playerState is 'full' */}
      <GlobalMusicPlayerDialog />
      
      {/* Hidden YouTube iframe for audio playback */}
      <GlobalYouTubeIframe />
    </>
  );
};

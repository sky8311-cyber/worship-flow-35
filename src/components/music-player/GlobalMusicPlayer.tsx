import { useLocation } from "react-router-dom";
import { GlobalMiniPlayer } from "./GlobalMiniPlayer";
import { GlobalMusicPlayerDialog } from "./GlobalMusicPlayerDialog";
import { GlobalYouTubeIframe } from "./GlobalYouTubeIframe";
import { MusicPill } from "./MusicPill";
import { useMusicPlayer } from "@/contexts/MusicPlayerContext";

// 공개 페이지 경로 - 뮤직 플레이어를 표시하지 않음
const PUBLIC_ROUTES = [
  '/',
  '/app',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/legal',
  '/app-history',
  '/features',
  '/press',
  '/help',
  '/institute',
];

export const GlobalMusicPlayer = () => {
  const { playerState, playlist } = useMusicPlayer();
  const location = useLocation();

  // 공개 페이지에서는 플레이어 숨김
  const isPublicRoute = PUBLIC_ROUTES.includes(location.pathname) || 
                        location.pathname.startsWith('/r/') ||
                        location.pathname.startsWith('/invite/');

  if (isPublicRoute) return null;

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

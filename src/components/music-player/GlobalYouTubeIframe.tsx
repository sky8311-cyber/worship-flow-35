import { useMusicPlayer } from "@/contexts/MusicPlayerContext";

export const GlobalYouTubeIframe = () => {
  const { playlist, currentIndex, iframeRef, playerState } = useMusicPlayer();

  if (playlist.length === 0 || playerState === 'closed') return null;

  const videoId = playlist[currentIndex]?.videoId;
  if (!videoId) return null;

  const proxyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/youtube-player-proxy?videoId=${videoId}`;
  console.log('[GlobalYouTubeIframe] Loading proxy URL:', proxyUrl);

  return (
    <iframe
      ref={iframeRef}
      id="youtube-proxy-iframe-global"
      src={proxyUrl}
      className="fixed top-[-9999px] left-[-9999px] w-1 h-1 border-0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      referrerPolicy="no-referrer-when-downgrade"
    />
  );
};

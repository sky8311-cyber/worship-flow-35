import { useMusicPlayer } from "@/contexts/MusicPlayerContext";

export const GlobalYouTubeIframe = () => {
  const { playlist, currentIndex, iframeRef, playerState } = useMusicPlayer();

  if (playlist.length === 0 || playerState === 'closed') return null;

  const videoId = playlist[currentIndex]?.videoId;
  if (!videoId) return null;

  // Use real src URL to the proxy function instead of srcDoc.
  // srcDoc has no proper origin, which causes YouTube Error 153 in native apps.
  const proxyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/youtube-player-proxy?videoId=${videoId}`;

  return (
    <iframe
      ref={iframeRef}
      id="youtube-proxy-iframe-global"
      src={proxyUrl}
      sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
      className="fixed top-[-9999px] left-[-9999px] w-1 h-1 border-0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    />
  );
};

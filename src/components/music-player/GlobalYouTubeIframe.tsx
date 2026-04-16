import { useMusicPlayer } from "@/contexts/MusicPlayerContext";

const BRIDGE_HOST = "https://worship-flow-35.lovable.app";

export const GlobalYouTubeIframe = () => {
  const { playlist, currentIndex, iframeRef, playerState } = useMusicPlayer();

  if (playlist.length === 0 || playerState === 'closed') return null;

  const videoId = playlist[currentIndex]?.videoId;
  if (!videoId) return null;

  const src = `${BRIDGE_HOST}/youtube-embed?videoId=${videoId}&mode=player`;

  return (
    <iframe
      ref={iframeRef}
      id="youtube-proxy-iframe-global"
      src={src}
      className="fixed top-[-9999px] left-[-9999px] w-1 h-1 border-0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
      referrerPolicy="strict-origin-when-cross-origin"
    />
  );
};

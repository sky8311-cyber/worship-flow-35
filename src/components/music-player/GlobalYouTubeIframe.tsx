import { useMusicPlayer } from "@/contexts/MusicPlayerContext";

export const GlobalYouTubeIframe = () => {
  const { proxyHtml, playlist, iframeRef } = useMusicPlayer();

  if (!proxyHtml || playlist.length === 0) return null;

  return (
    <iframe
      ref={iframeRef}
      id="youtube-proxy-iframe-global"
      srcDoc={proxyHtml}
      sandbox="allow-scripts allow-same-origin allow-popups allow-forms allow-presentation"
      className="fixed top-[-9999px] left-[-9999px] w-1 h-1 border-0"
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    />
  );
};

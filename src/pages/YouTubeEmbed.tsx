import { useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Standalone YouTube embed page — renders outside the normal app layout.
 * Used by NativeSafeYouTubeEmbed and GlobalYouTubeIframe via an <iframe src="/youtube-embed?...">.
 *
 * Supports two modes:
 *   - embed: simple YouTube iframe (for visible players)
 *   - player: full IFrame API with postMessage control (for the global music player)
 */
export default function YouTubeEmbed() {
  const [params] = useSearchParams();
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const isReadyRef = useRef(false);

  const videoId = params.get("videoId") ?? "";
  const mode = params.get("mode") ?? "player";

  // Validate videoId
  const isValid = /^[a-zA-Z0-9_-]{11}$/.test(videoId);

  useEffect(() => {
    if (!isValid || !containerRef.current) return;

    const pageOrigin = window.location.origin;

    function bp(v: string | null, d: string) {
      return v === "1" ? "1" : v === "0" ? "0" : d;
    }

    if (mode === "embed") {
      // Simple embed mode
      const autoplay = bp(params.get("autoplay"), "0");
      const mute = bp(params.get("mute"), "0");
      const controls = bp(params.get("controls"), "1");
      const loop = bp(params.get("loop"), "0");

      const ytParams = new URLSearchParams({
        rel: "0",
        modestbranding: "1",
        playsinline: "1",
        enablejsapi: "1",
        autoplay,
        mute,
        controls,
        origin: pageOrigin,
      });
      if (loop === "1") {
        ytParams.set("loop", "1");
        ytParams.set("playlist", videoId);
      }

      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube.com/embed/${videoId}?${ytParams.toString()}`;
      iframe.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
      iframe.setAttribute(
        "allow",
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      );
      iframe.setAttribute("allowfullscreen", "");
      iframe.style.cssText = "width:100%;height:100%;border:none;";
      containerRef.current.appendChild(iframe);

      return () => {
        iframe.remove();
      };
    }

    // Full IFrame API player mode
    function sendToParent(type: string, data: Record<string, any> = {}) {
      try {
        window.parent.postMessage({ source: "youtube-proxy", type, ...data }, "*");
      } catch (_) {}
    }

    // Load YouTube IFrame API
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(script);

    (window as any).onYouTubeIframeAPIReady = () => {
      playerRef.current = new (window as any).YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          autoplay: 1,
          playsinline: 1,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          fs: 1,
          enablejsapi: 1,
          origin: pageOrigin,
        },
        events: {
          onReady: () => {
            isReadyRef.current = true;
            sendToParent("ready");
          },
          onStateChange: (event: any) => {
            const p = playerRef.current;
            sendToParent("stateChange", {
              state: event.data,
              currentTime: p ? p.getCurrentTime() : 0,
              duration: p ? p.getDuration() : 0,
            });
          },
          onError: (event: any) => {
            sendToParent("error", { code: event.data });
          },
        },
      });
    };

    const handleMessage = (event: MessageEvent) => {
      if (!event.data || event.data.source === "youtube-proxy") return;
      if (event.data.type !== "command") return;
      const { command, args } = event.data;
      const p = playerRef.current;
      if (!p || !isReadyRef.current) return;
      try {
        switch (command) {
          case "play": p.playVideo(); break;
          case "pause": p.pauseVideo(); break;
          case "stop": p.stopVideo(); break;
          case "loadVideo":
            if (args?.videoId) {
              p.loadVideoById(args.videoId);
              setTimeout(() => { if (p.getPlayerState() !== 1) p.playVideo(); }, 300);
            }
            break;
          case "cueVideo":
            if (args?.videoId) p.cueVideoById(args.videoId);
            break;
          case "seekTo":
            if (typeof args?.seconds === "number") p.seekTo(args.seconds, true);
            break;
          case "setVolume":
            if (typeof args?.volume === "number") p.setVolume(args.volume);
            break;
          case "mute": p.mute(); break;
          case "unMute": p.unMute(); break;
          case "getState":
            sendToParent("currentState", {
              state: p.getPlayerState(),
              currentTime: p.getCurrentTime(),
              duration: p.getDuration(),
              volume: p.getVolume(),
              isMuted: p.isMuted(),
            });
            break;
        }
      } catch (e: any) {
        sendToParent("error", { message: e.message });
      }
    };

    window.addEventListener("message", handleMessage);
    sendToParent("proxyLoaded");

    return () => {
      window.removeEventListener("message", handleMessage);
      script.remove();
    };
  }, [videoId, mode, isValid]);

  if (!isValid) {
    return (
      <div style={{ width: "100vw", height: "100vh", background: "#000", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#fff", textAlign: "center", padding: 20 }}>Invalid video ID</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      id="player"
      style={{ width: "100vw", height: "100vh", background: "#000", overflow: "hidden", margin: 0, padding: 0 }}
    />
  );
}

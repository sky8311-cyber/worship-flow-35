/**
 * Standalone YouTube bridge page.
 * Rendered BEFORE the React app shell when pathname === "/youtube-embed".
 * Supports mode=embed (visible iframe) and mode=player (IFrame API with postMessage).
 * No React providers, router, or global state — completely isolated.
 */
import { useEffect, useRef } from "react";

function bp(v: string | null, d: string): string {
  return v === "1" ? "1" : v === "0" ? "0" : d;
}

export default function YouTubeBridgePage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const qs = new URLSearchParams(window.location.search);
    const videoId = qs.get("videoId") || "";
    const mode = qs.get("mode") || "player";
    const pageOrigin = window.location.origin;

    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      if (containerRef.current) {
        containerRef.current.innerHTML =
          '<p style="color:#fff;text-align:center;padding:20px">Invalid video ID</p>';
      }
      return;
    }

    if (mode === "embed") {
      const autoplay = bp(qs.get("autoplay"), "0");
      const mute = bp(qs.get("mute"), "0");
      const controls = bp(qs.get("controls"), "1");
      const loop = bp(qs.get("loop"), "0");
      const yp = new URLSearchParams({
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
        yp.set("loop", "1");
        yp.set("playlist", videoId);
      }
      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube.com/embed/${videoId}?${yp.toString()}`;
      iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
      iframe.setAttribute(
        "allow",
        "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      );
      iframe.setAttribute("allowfullscreen", "");
      iframe.style.cssText = "width:100%;height:100%;border:none;";
      containerRef.current?.appendChild(iframe);
      return;
    }

    // Player mode — full IFrame API with postMessage control
    let player: any = null;
    let isReady = false;

    function sendToParent(type: string, data?: Record<string, any>) {
      try {
        window.parent.postMessage(
          { source: "youtube-proxy", type, ...(data || {}) },
          "*"
        );
      } catch (_) {}
    }

    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);

    (window as any).onYouTubeIframeAPIReady = function () {
      player = new (window as any).YT.Player(containerRef.current, {
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
            isReady = true;
            sendToParent("ready");
          },
          onStateChange: (e: any) => {
            sendToParent("stateChange", {
              state: e.data,
              currentTime: player ? player.getCurrentTime() : 0,
              duration: player ? player.getDuration() : 0,
            });
          },
          onError: (e: any) => {
            sendToParent("error", { code: e.data });
          },
        },
      });
    };

    const handleMessage = (event: MessageEvent) => {
      if (!event.data || event.data.source === "youtube-proxy") return;
      if (event.data.type !== "command") return;
      const cmd = event.data.command;
      const args = event.data.args;
      if (!player || !isReady) return;
      try {
        switch (cmd) {
          case "play": player.playVideo(); break;
          case "pause": player.pauseVideo(); break;
          case "stop": player.stopVideo(); break;
          case "loadVideo":
            if (args?.videoId) {
              player.loadVideoById(args.videoId);
              setTimeout(() => {
                if (player.getPlayerState() !== 1) player.playVideo();
              }, 300);
            }
            break;
          case "cueVideo":
            if (args?.videoId) player.cueVideoById(args.videoId);
            break;
          case "seekTo":
            if (args && typeof args.seconds === "number")
              player.seekTo(args.seconds, true);
            break;
          case "setVolume":
            if (args && typeof args.volume === "number")
              player.setVolume(args.volume);
            break;
          case "mute": player.mute(); break;
          case "unMute": player.unMute(); break;
          case "getState":
            sendToParent("currentState", {
              state: player.getPlayerState(),
              currentTime: player.getCurrentTime(),
              duration: player.getDuration(),
              volume: player.getVolume(),
              isMuted: player.isMuted(),
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
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="player"
      style={{
        width: "100vw",
        height: "100vh",
        margin: 0,
        padding: 0,
        background: "#000",
        overflow: "hidden",
      }}
    />
  );
}

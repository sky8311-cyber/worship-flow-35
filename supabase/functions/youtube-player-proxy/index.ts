import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Security-Policy': 'frame-ancestors *',
  'X-Frame-Options': 'ALLOWALL',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const videoId = url.searchParams.get('videoId') || '';
  const mode = url.searchParams.get('mode') || 'player';

  // ── Embed mode: simple full-screen YouTube embed (no postMessage) ──
  if (mode === 'embed') {
    const embedHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
    iframe { width: 100%; height: 100%; border: none; }
  </style>
</head>
<body>
  <iframe
    src="https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1&enablejsapi=1"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
    allowfullscreen
  ></iframe>
</body>
</html>`;

    return new Response(embedHtml, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  // ── Player mode (original): full YT IFrame API with postMessage ──
  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { 
      width: 100%; 
      height: 100%; 
      background: #000; 
      overflow: hidden;
    }
    #player { 
      width: 100%; 
      height: 100%; 
    }
    /* Make YouTube iframe fill container */
    iframe {
      width: 100% !important;
      height: 100% !important;
    }
  </style>
</head>
<body>
  <div id="player"></div>
  <script src="https://www.youtube.com/iframe_api"></script>
  <script>
    let player;
    let isReady = false;
    
    // Send message to parent window
    function sendToParent(type, data = {}) {
      try {
        parent.postMessage({ source: 'youtube-proxy', type, ...data }, '*');
      } catch (e) {
        console.error('postMessage error:', e);
      }
    }
    
    function onYouTubeIframeAPIReady() {
      console.log('[Proxy] YouTube IFrame API Ready');
      
      player = new YT.Player('player', {
        videoId: '${videoId}',
        playerVars: {
          autoplay: 1,
          playsinline: 1,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          fs: 1,
          enablejsapi: 1
        },
        events: {
          onReady: onPlayerReady,
          onStateChange: onPlayerStateChange,
          onError: onPlayerError
        }
      });
    }
    
    function onPlayerReady(event) {
      console.log('[Proxy] Player Ready');
      isReady = true;
      sendToParent('ready');
    }
    
    function onPlayerStateChange(event) {
      console.log('[Proxy] State Change:', event.data);
      // YT.PlayerState: ENDED=0, PLAYING=1, PAUSED=2, BUFFERING=3, CUED=5
      sendToParent('stateChange', { 
        state: event.data,
        currentTime: player ? player.getCurrentTime() : 0,
        duration: player ? player.getDuration() : 0
      });
    }
    
    function onPlayerError(event) {
      console.error('[Proxy] Player Error:', event.data);
      sendToParent('error', { code: event.data });
    }
    
    // Listen for commands from parent window
    window.addEventListener('message', function(event) {
      if (!event.data || event.data.source === 'youtube-proxy') return;
      if (event.data.type !== 'command') return;
      
      const { command, args } = event.data;
      console.log('[Proxy] Received command:', command, args);
      
      if (!player || !isReady) {
        console.warn('[Proxy] Player not ready, ignoring command:', command);
        return;
      }
      
      try {
        switch (command) {
          case 'play':
            player.playVideo();
            break;
          case 'pause':
            player.pauseVideo();
            break;
          case 'stop':
            player.stopVideo();
            break;
          case 'loadVideo':
            if (args && args.videoId) {
              console.log('[Proxy] Loading video:', args.videoId);
              player.loadVideoById(args.videoId);
              // YouTube loadVideoById doesn't guarantee autoplay, force it
              setTimeout(() => {
                if (player.getPlayerState() !== 1) { // Not PLAYING
                  console.log('[Proxy] Auto-playing after loadVideo');
                  player.playVideo();
                }
              }, 300);
            }
            break;
          case 'cueVideo':
            if (args && args.videoId) {
              player.cueVideoById(args.videoId);
            }
            break;
          case 'seekTo':
            if (args && typeof args.seconds === 'number') {
              player.seekTo(args.seconds, true);
            }
            break;
          case 'setVolume':
            if (args && typeof args.volume === 'number') {
              player.setVolume(args.volume);
            }
            break;
          case 'mute':
            player.mute();
            break;
          case 'unMute':
            player.unMute();
            break;
          case 'getState':
            sendToParent('currentState', {
              state: player.getPlayerState(),
              currentTime: player.getCurrentTime(),
              duration: player.getDuration(),
              volume: player.getVolume(),
              isMuted: player.isMuted()
            });
            break;
          default:
            console.warn('[Proxy] Unknown command:', command);
        }
      } catch (e) {
        console.error('[Proxy] Command error:', e);
        sendToParent('error', { message: e.message });
      }
    });
    
    // Notify parent that proxy page is loaded
    sendToParent('proxyLoaded');
  </script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      ...corsHeaders,
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
});

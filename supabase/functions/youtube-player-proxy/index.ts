import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Content-Security-Policy': 'frame-ancestors *',
  'X-Frame-Options': 'ALLOWALL',
};

/** Sanitize videoId to prevent injection */
function sanitizeVideoId(id: string): string | null {
  const match = id.match(/^[a-zA-Z0-9_-]{11}$/);
  return match ? id : null;
}

function boolParam(val: string | null, fallback = '0'): string {
  return val === '1' ? '1' : (val === '0' ? '0' : fallback);
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const rawVideoId = url.searchParams.get('videoId') || '';
  const mode = url.searchParams.get('mode') || 'player';

  const videoId = sanitizeVideoId(rawVideoId);
  if (!videoId) {
    console.log('[youtube-player-proxy] Invalid videoId:', rawVideoId);
    return new Response('Invalid videoId', { status: 400, headers: corsHeaders });
  }

  console.log(`[youtube-player-proxy] mode=${mode}, videoId=${videoId}`);

  // ── Embed mode: minimal hosted page for native WKWebView ──
  if (mode === 'embed') {
    const autoplay = boolParam(url.searchParams.get('autoplay'), '0');
    const mute = boolParam(url.searchParams.get('mute'), '0');
    const controls = boolParam(url.searchParams.get('controls'), '1');
    const loop = boolParam(url.searchParams.get('loop'), '0');

    const ytParams = new URLSearchParams({
      rel: '0',
      modestbranding: '1',
      playsinline: '1',
      enablejsapi: '1',
      autoplay,
      mute,
      controls,
    });
    if (loop === '1') {
      ytParams.set('loop', '1');
      ytParams.set('playlist', videoId);
    }

    // The key fix: origin is set to this proxy page's HTTPS origin, which YouTube will accept.
    // Edge functions may report http internally; force https for the public-facing origin.
    const proxyOrigin = url.origin.replace(/^http:/, 'https:');
    ytParams.set('origin', proxyOrigin);

    const embedSrc = `https://www.youtube.com/embed/${videoId}?${ytParams.toString()}`;

    const embedHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="referrer" content="no-referrer-when-downgrade">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
    iframe { width: 100%; height: 100%; border: none; }
  </style>
</head>
<body>
  <iframe
    src="${embedSrc}"
    referrerpolicy="no-referrer-when-downgrade"
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

  // ── Player mode: full YT IFrame API with postMessage for music player ──
  const proxyOrigin = url.origin.replace(/^http:/, 'https:');

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <meta name="referrer" content="no-referrer-when-downgrade">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: 100%; height: 100%; background: #000; overflow: hidden; }
    #player { width: 100%; height: 100%; }
    iframe { width: 100% !important; height: 100% !important; }
  </style>
</head>
<body>
  <div id="player"></div>
  <script src="https://www.youtube.com/iframe_api"></script>
  <script>
    var player;
    var isReady = false;
    
    function sendToParent(type, data) {
      data = data || {};
      try {
        parent.postMessage({ source: 'youtube-proxy', type: type, ...data }, '*');
      } catch (e) {}
    }
    
    function onYouTubeIframeAPIReady() {
      player = new YT.Player('player', {
        videoId: '${videoId}',
        playerVars: {
          autoplay: 1,
          playsinline: 1,
          controls: 1,
          modestbranding: 1,
          rel: 0,
          fs: 1,
          enablejsapi: 1,
          origin: '${proxyOrigin}'
        },
        events: {
          onReady: function(event) {
            isReady = true;
            sendToParent('ready');
          },
          onStateChange: function(event) {
            sendToParent('stateChange', { 
              state: event.data,
              currentTime: player ? player.getCurrentTime() : 0,
              duration: player ? player.getDuration() : 0
            });
          },
          onError: function(event) {
            sendToParent('error', { code: event.data });
          }
        }
      });
    }
    
    window.addEventListener('message', function(event) {
      if (!event.data || event.data.source === 'youtube-proxy') return;
      if (event.data.type !== 'command') return;
      var command = event.data.command;
      var args = event.data.args;
      if (!player || !isReady) return;
      try {
        switch (command) {
          case 'play': player.playVideo(); break;
          case 'pause': player.pauseVideo(); break;
          case 'stop': player.stopVideo(); break;
          case 'loadVideo':
            if (args && args.videoId) {
              player.loadVideoById(args.videoId);
              setTimeout(function() {
                if (player.getPlayerState() !== 1) player.playVideo();
              }, 300);
            }
            break;
          case 'cueVideo':
            if (args && args.videoId) player.cueVideoById(args.videoId);
            break;
          case 'seekTo':
            if (args && typeof args.seconds === 'number') player.seekTo(args.seconds, true);
            break;
          case 'setVolume':
            if (args && typeof args.volume === 'number') player.setVolume(args.volume);
            break;
          case 'mute': player.mute(); break;
          case 'unMute': player.unMute(); break;
          case 'getState':
            sendToParent('currentState', {
              state: player.getPlayerState(),
              currentTime: player.getCurrentTime(),
              duration: player.getDuration(),
              volume: player.getVolume(),
              isMuted: player.isMuted()
            });
            break;
        }
      } catch (e) {
        sendToParent('error', { message: e.message });
      }
    });
    
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

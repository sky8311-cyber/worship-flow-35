import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const token = pathParts[pathParts.length - 1];

    if (!token || token === 'og-public-view') {
      console.log('No token provided, redirecting to homepage');
      return Response.redirect('https://kworship.app', 302);
    }

    console.log('Processing OG request for token:', token);

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch worship set by public share token
    const { data: setData, error } = await supabase
      .from('service_sets')
      .select('id, date, service_name, theme, worship_leader, public_share_enabled')
      .eq('public_share_token', token)
      .eq('public_share_enabled', true)
      .single();

    if (error || !setData) {
      console.log('Set not found or not public:', error?.message);
      return Response.redirect('https://kworship.app', 302);
    }

    console.log('Found worship set:', setData.service_name);

    // Format date
    const date = new Date(setData.date);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const year = date.getFullYear();
    const formattedDateKo = `${month}월 ${day}일`;
    const formattedDateEn = `${month}/${day}/${year}`;

    // Build meta content
    const title = `${formattedDateKo} ${setData.service_name} | K-Worship`;
    const description = setData.theme 
      ? `${setData.theme}${setData.worship_leader ? ` - ${setData.worship_leader}` : ''}`
      : `예배 콘티${setData.worship_leader ? ` - ${setData.worship_leader}` : ''} | K-Worship`;
    
    const ogImage = 'https://kworship.app/images/og-worship-set.png';
    const pageUrl = `https://kworship.app/public-view/${token}`;

    // Generate HTML with OG meta tags and redirect
    const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">
  
  <!-- Open Graph -->
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="K-Worship">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:locale" content="ko_KR">
  
  <!-- Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${ogImage}">
  
  <!-- Kakao -->
  <meta property="kakao:title" content="${escapeHtml(title)}">
  <meta property="kakao:description" content="${escapeHtml(description)}">
  <meta property="kakao:image" content="${ogImage}">
  
  <!-- Redirect after meta tags are read -->
  <meta http-equiv="refresh" content="0;url=${pageUrl}">
  <link rel="canonical" href="${pageUrl}">
</head>
<body>
  <p>Redirecting to worship set...</p>
  <script>window.location.replace("${pageUrl}");</script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: { 
        ...corsHeaders,
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });

  } catch (error) {
    console.error('Error in og-public-view:', error);
    return Response.redirect('https://kworship.app', 302);
  }
});

// Helper function to escape HTML special characters
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

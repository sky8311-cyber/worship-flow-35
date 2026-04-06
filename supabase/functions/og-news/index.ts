import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const slug = pathParts[pathParts.length - 1];

    if (!slug || slug === 'og-news') {
      return Response.redirect('https://kworship.app/news', 302);
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: post, error } = await supabase
      .from('news_posts')
      .select('title, title_ko, excerpt, excerpt_ko, cover_image_url, category, published_at')
      .eq('slug', slug)
      .eq('is_published', true)
      .single();

    if (error || !post) {
      return Response.redirect('https://kworship.app/news', 302);
    }

    const title = post.title_ko || post.title;
    const description = post.excerpt_ko || post.excerpt || 'K-Worship 블로그';
    const ogImage = post.cover_image_url || 'https://jihozsqrrmzzrqvwilyy.supabase.co/storage/v1/object/public/og-assets/og-image.png';
    const pageUrl = `https://kworship.app/news/${slug}`;

    const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(description)}">

  <meta property="og:type" content="article">
  <meta property="og:site_name" content="K-Worship">
  <meta property="og:title" content="${escapeHtml(title)}">
  <meta property="og:description" content="${escapeHtml(description)}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${pageUrl}">
  <meta property="og:locale" content="ko_KR">

  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escapeHtml(title)}">
  <meta name="twitter:description" content="${escapeHtml(description)}">
  <meta name="twitter:image" content="${ogImage}">

  <meta property="kakao:title" content="${escapeHtml(title)}">
  <meta property="kakao:description" content="${escapeHtml(description)}">
  <meta property="kakao:image" content="${ogImage}">

  <meta http-equiv="refresh" content="0;url=${pageUrl}">
  <link rel="canonical" href="${pageUrl}">
</head>
<body>
  <p>Redirecting...</p>
  <script>window.location.replace("${pageUrl}");</script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error in og-news:', error);
    return Response.redirect('https://kworship.app/news', 302);
  }
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

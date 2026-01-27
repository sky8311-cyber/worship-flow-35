import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.9";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!
    );

    // Get category filter from query params
    const url = new URL(req.url);
    const category = url.searchParams.get("category");

    // Build query
    let query = supabase
      .from("news_posts")
      .select("id, title, title_ko, slug, excerpt, excerpt_ko, category, external_url, published_at, content, content_ko")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(50);

    if (category && ["news", "update", "blog", "press"].includes(category)) {
      query = query.eq("category", category);
    }

    const { data: posts, error } = await query;

    if (error) {
      console.error("Error fetching posts:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate RSS XML
    const baseUrl = "https://kworship.app";
    const feedTitle = category 
      ? `K-Worship 뉴스 - ${category.charAt(0).toUpperCase() + category.slice(1)}`
      : "K-Worship 뉴스";
    const feedDescription = "예배팀을 위한 통합 플랫폼 K-Worship의 최신 소식";
    const feedUrl = category ? `${baseUrl}/rss.xml?category=${category}` : `${baseUrl}/rss.xml`;

    const items = (posts || []).map((post) => {
      const title = post.title_ko || post.title;
      const description = post.excerpt_ko || post.excerpt || (post.content_ko || post.content).substring(0, 200);
      const link = post.external_url || `${baseUrl}/news/${post.slug}`;
      const pubDate = post.published_at ? new Date(post.published_at).toUTCString() : new Date().toUTCString();

      return `    <item>
      <title><![CDATA[${title}]]></title>
      <link>${escapeXml(link)}</link>
      <guid isPermaLink="${!post.external_url}">${escapeXml(link)}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${description}]]></description>
      <category>${post.category}</category>
    </item>`;
    }).join("\n");

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:content="http://purl.org/rss/1.0/modules/content/">
  <channel>
    <title>${feedTitle}</title>
    <link>${baseUrl}/news</link>
    <description>${feedDescription}</description>
    <language>ko</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${feedUrl}" rel="self" type="application/rss+xml"/>
    <image>
      <url>${baseUrl}/kworship-icon.png</url>
      <title>${feedTitle}</title>
      <link>${baseUrl}</link>
    </image>
${items}
  </channel>
</rss>`;

    return new Response(rss, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600", // 1 hour cache
      },
    });
  } catch (error) {
    console.error("RSS feed error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

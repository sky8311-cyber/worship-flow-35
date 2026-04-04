import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/xml; charset=utf-8",
};

const BASE_URL = "https://kworship.app";

const staticPages = [
  { loc: "/", changefreq: "weekly", priority: "1.0", hreflang: true },
  { loc: "/app", changefreq: "weekly", priority: "0.9" },
  { loc: "/features", changefreq: "monthly", priority: "0.9", hreflang: true },
  
  { loc: "/signup", changefreq: "monthly", priority: "0.8" },
  { loc: "/help", changefreq: "monthly", priority: "0.6", hreflang: true },
  { loc: "/legal", changefreq: "yearly", priority: "0.3" },
  { loc: "/news", changefreq: "daily", priority: "0.8", hreflang: true },
  { loc: "/press", changefreq: "monthly", priority: "0.5" },
  { loc: "/app-history", changefreq: "monthly", priority: "0.4" },
  { loc: "/membership", changefreq: "monthly", priority: "0.6" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch published news posts
    const { data: newsPosts } = await supabase
      .from("news_posts")
      .select("slug, updated_at, published_at")
      .eq("is_published", true)
      .order("published_at", { ascending: false });

    const today = new Date().toISOString().split("T")[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
`;

    // Static pages
    for (const page of staticPages) {
      xml += `  <url>
    <loc>${BASE_URL}${page.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>`;
      if (page.hreflang) {
        xml += `
    <xhtml:link rel="alternate" hreflang="ko" href="${BASE_URL}${page.loc}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${BASE_URL}${page.loc}"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${BASE_URL}${page.loc}"/>`;
      }
      xml += `
  </url>
`;
    }

    // Dynamic news posts
    if (newsPosts && newsPosts.length > 0) {
      for (const post of newsPosts) {
        const lastmod = (post.updated_at || post.published_at || today).split("T")[0];
        xml += `  <url>
    <loc>${BASE_URL}/news/${post.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
    <xhtml:link rel="alternate" hreflang="ko" href="${BASE_URL}/news/${post.slug}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${BASE_URL}/news/${post.slug}"/>
  </url>
`;
      }
    }

    xml += `</urlset>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return new Response("Error generating sitemap", { status: 500 });
  }
});

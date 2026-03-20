import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { title, artist, original_composer } = await req.json();
    if (!title) {
      return new Response(JSON.stringify({ error: "title is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build artist string: combine artist and original_composer for better search
    const searchArtist = [artist, original_composer].filter(Boolean).join(" ");

    console.log("match-lyrics: calling scrape-lyrics with", { title, artist: searchArtist });

    // Call scrape-lyrics internally (same pattern as enrich-song)
    const scrapeResponse = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/scrape-lyrics`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
        },
        body: JSON.stringify({ title, artist: searchArtist }),
      }
    );

    if (!scrapeResponse.ok) {
      const errorText = await scrapeResponse.text();
      console.error("scrape-lyrics call failed:", scrapeResponse.status, errorText);
      return new Response(
        JSON.stringify({ found: false, lyrics: null, source: null }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const scrapeData = await scrapeResponse.json();
    console.log("scrape-lyrics result:", { source: scrapeData.source, hasLyrics: !!scrapeData.lyrics });

    return new Response(
      JSON.stringify({
        found: !!scrapeData.lyrics,
        lyrics: scrapeData.lyrics || null,
        source: scrapeData.source === "none" ? null : scrapeData.source,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

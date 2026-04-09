import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { share_token, paths } = await req.json();

    if (!share_token || !Array.isArray(paths) || paths.length === 0) {
      return new Response(
        JSON.stringify({ error: "share_token and paths[] are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Limit batch size
    if (paths.length > 200) {
      return new Response(
        JSON.stringify({ error: "Maximum 200 paths per request" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Validate share_token — must correspond to an active public share
    const { data: setData, error: setError } = await supabase
      .from("service_sets")
      .select("id")
      .eq("public_share_token", share_token)
      .eq("public_share_enabled", true)
      .maybeSingle();

    if (setError || !setData) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired share token" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate signed URLs using service role (4 hours = 14400 seconds)
    const { data: signedData, error: signError } = await supabase.storage
      .from("scores")
      .createSignedUrls(paths, 14400);

    if (signError || !signedData) {
      return new Response(
        JSON.stringify({ error: "Failed to generate signed URLs" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build result map: path → signedUrl
    const urls: Record<string, string> = {};
    signedData.forEach((item, idx) => {
      if (item.signedUrl) {
        urls[paths[idx]] = item.signedUrl;
      }
    });

    return new Response(JSON.stringify({ urls }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[get-signed-score-urls] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

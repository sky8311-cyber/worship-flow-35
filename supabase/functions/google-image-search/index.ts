const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const GOOGLE_CSE_KEY = Deno.env.get("GOOGLE_CSE_KEY");
    const GOOGLE_CSE_CX = Deno.env.get("GOOGLE_CSE_CX");

    if (!GOOGLE_CSE_KEY || !GOOGLE_CSE_CX) {
      return new Response(
        JSON.stringify({
          error: "not_configured",
          message: "Google CSE API keys are not configured",
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const { query } = await req.json().catch(() => ({ query: "" }));
    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "invalid_query", message: "query is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const url = new URL("https://www.googleapis.com/customsearch/v1");
    url.searchParams.set("key", GOOGLE_CSE_KEY);
    url.searchParams.set("cx", GOOGLE_CSE_CX);
    url.searchParams.set("q", query);
    url.searchParams.set("searchType", "image");
    url.searchParams.set("num", "10");

    const res = await fetch(url.toString());
    const data = await res.json();

    if (!res.ok) {
      console.error("Google CSE error:", data);
      const reason = data?.error?.details?.find((d: any) => d?.reason)?.reason;
      const isRefererBlocked =
        res.status === 403 &&
        (reason === "API_KEY_HTTP_REFERRER_BLOCKED" ||
          /referer/i.test(data?.error?.message || ""));
      if (isRefererBlocked) {
        return new Response(
          JSON.stringify({
            error: "referer_blocked",
            message:
              "Google API key has HTTP referrer restrictions. Remove referrer restriction for backend use.",
          }),
          {
            status: 503,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }
      return new Response(
        JSON.stringify({
          error: "google_api_error",
          message: data?.error?.message || "Google API request failed",
        }),
        {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const items = (data.items || []).map((item: any) => ({
      title: item.title,
      link: item.link,
      thumbnailLink: item.image?.thumbnailLink,
      contextLink: item.image?.contextLink,
      width: item.image?.width,
      height: item.image?.height,
    }));

    return new Response(JSON.stringify({ items }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("google-image-search error:", e);
    return new Response(
      JSON.stringify({ error: "internal_error", message: String(e) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const extractSearchEngineId = (value: string | null | undefined) => {
  const trimmed = value?.trim();
  if (!trimmed) return "";

  const unquoted = trimmed.replace(/^['"`]+|['"`]+$/g, "").trim();

  const directCxMatch = unquoted.match(/(?:^|[?&\s])cx=([A-Za-z0-9_:%-]+)/i);
  if (directCxMatch?.[1]) {
    return decodeURIComponent(directCxMatch[1]).trim();
  }

  if (/^https?:\/\//i.test(unquoted)) {
    try {
      const url = new URL(unquoted);
      const fromQuery = url.searchParams.get("cx") || url.searchParams.get("cse_id");
      if (fromQuery?.trim()) {
        return fromQuery.trim();
      }
    } catch {
      // ignore malformed URL and fall back below
    }
  }

  return unquoted;
};

const looksLikeSearchEngineId = (value: string) => /^[A-Za-z0-9_:%-]{8,}$/.test(value);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const GOOGLE_CSE_KEY = Deno.env.get("GOOGLE_CSE_KEY")?.trim();
    const GOOGLE_CSE_CX = extractSearchEngineId(Deno.env.get("GOOGLE_CSE_CX"));

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

    if (!looksLikeSearchEngineId(GOOGLE_CSE_CX)) {
      return new Response(
        JSON.stringify({
          error: "invalid_cx_config",
          message:
            "GOOGLE_CSE_CX 값에서 유효한 Search Engine ID를 찾을 수 없습니다. Search Engine ID만 저장하거나 URL이라면 cx 파라미터가 포함되어 있어야 합니다.",
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const body = await req.json().catch(() => ({}));
    const query = typeof body?.query === "string" ? body.query.trim() : "";
    if (!query) {
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
    url.searchParams.set("safe", "active");

    const res = await fetch(url.toString());
    const data = await res.json();

    if (!res.ok) {
      console.error("Google CSE error:", JSON.stringify(data));
      const reason = data?.error?.details?.find((d: any) => d?.reason)?.reason;
      const message: string = data?.error?.message || "";

      const isRefererBlocked =
        res.status === 403 &&
        (reason === "API_KEY_HTTP_REFERRER_BLOCKED" || /referer/i.test(message));
      if (isRefererBlocked) {
        return new Response(
          JSON.stringify({
            error: "referer_blocked",
            message:
              "Google API 키에 브라우저 referrer 제한이 걸려 있어 사용할 수 없습니다.",
          }),
          {
            status: 503,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      if (res.status === 400) {
        return new Response(
          JSON.stringify({
            error: "invalid_cx_config",
            message:
              "Google Programmable Search Engine 설정이 올바르지 않습니다. Search Engine ID(cx)와 '이미지 검색', '전체 웹 검색' 활성화 여부를 확인해주세요.",
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
          message: message || "Google API request failed",
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

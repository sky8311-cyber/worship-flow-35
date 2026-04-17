const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const extractSearchEngineId = (value: string | null | undefined) => {
  const trimmed = value?.trim();
  if (!trimmed) return "";
  const unquoted = trimmed.replace(/^['"`]+|['"`]+$/g, "").trim();

  const directCxMatch = unquoted.match(/(?:^|[?&\s])cx=([A-Za-z0-9_:%-]+)/i);
  if (directCxMatch?.[1]) return decodeURIComponent(directCxMatch[1]).trim();

  if (/^https?:\/\//i.test(unquoted)) {
    try {
      const url = new URL(unquoted);
      const fromQuery = url.searchParams.get("cx") || url.searchParams.get("cse_id");
      if (fromQuery?.trim()) return fromQuery.trim();
    } catch {
      // ignore
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
      return json({
        error: "not_configured",
        message: "Google CSE API keys are not configured",
      });
    }

    if (!looksLikeSearchEngineId(GOOGLE_CSE_CX)) {
      return json({
        error: "invalid_cx_config",
        message:
          "GOOGLE_CSE_CX 값에서 유효한 Search Engine ID를 찾을 수 없습니다.",
      });
    }

    const body = await req.json().catch(() => ({}));
    const query = typeof body?.query === "string" ? body.query.trim() : "";
    if (!query) {
      return json({ error: "invalid_query", message: "query is required" }, 400);
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
      const reason = data?.error?.details?.find((d: any) => d?.reason)?.reason;
      const message: string = data?.error?.message || "";
      console.error("Google CSE error:", res.status, reason, message);

      // 403 family — treat as configuration access issue (broad bucket)
      if (res.status === 403) {
        return json({
          error: "api_access_denied",
          message:
            "Google API에서 요청을 거부했습니다. 아래 설정을 확인해주세요.",
          google_status: res.status,
          google_reason: reason ?? null,
          google_message: message || null,
        });
      }

      if (res.status === 400) {
        return json({
          error: "invalid_cx_config",
          message:
            "Google Programmable Search Engine 설정이 올바르지 않습니다. Search Engine ID(cx)와 '이미지 검색' 활성화 여부를 확인해주세요.",
          google_status: res.status,
          google_reason: reason ?? null,
          google_message: message || null,
        });
      }

      if (res.status === 429) {
        return json({
          error: "quota_exceeded",
          message: "Google API 일일 사용 한도를 초과했습니다.",
          google_status: res.status,
          google_reason: reason ?? null,
          google_message: message || null,
        });
      }

      return json({
        error: "google_api_error",
        message: message || "Google API request failed",
        google_status: res.status,
        google_reason: reason ?? null,
        google_message: message || null,
      });
    }

    const items = (data.items || []).map((item: any) => ({
      title: item.title,
      link: item.link,
      thumbnailLink: item.image?.thumbnailLink,
      contextLink: item.image?.contextLink,
      width: item.image?.width,
      height: item.image?.height,
    }));

    return json({ items });
  } catch (e) {
    console.error("google-image-search error:", e);
    return json({ error: "internal_error", message: String(e) }, 500);
  }
});

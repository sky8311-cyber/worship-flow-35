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

const SEARCH_PROVIDER = "duckduckgo";
const SEARCH_USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

class SearchProviderError extends Error {
  code: string;
  details?: Record<string, unknown>;

  constructor(code: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "SearchProviderError";
    this.code = code;
    this.details = details;
  }
}

const stripHtml = (value: string | null | undefined) =>
  (value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const extractVqdToken = (html: string) => {
  const patterns = [
    /vqd=['"]([^'"]+)['"]/i,
    /"vqd":"([^"]+)"/i,
    /vqd=([^&'"\s]+)/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1];
  }

  return "";
};

const getDuckDuckGoToken = async (query: string) => {
  const url = new URL("https://duckduckgo.com/");
  url.searchParams.set("q", query);
  url.searchParams.set("iax", "images");
  url.searchParams.set("ia", "images");

  const res = await fetch(url.toString(), {
    headers: {
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "user-agent": SEARCH_USER_AGENT,
    },
  });

  const html = await res.text();
  const vqd = extractVqdToken(html);

  if (!res.ok || !vqd) {
    throw new SearchProviderError(
      "search_unavailable",
      "외부 이미지 검색 제공자에서 검색 세션을 만들지 못했습니다. 잠시 후 다시 시도해주세요.",
      { provider: SEARCH_PROVIDER, upstream_status: res.status || null },
    );
  }

  return vqd;
};

const searchDuckDuckGoImages = async (query: string) => {
  const vqd = await getDuckDuckGoToken(query);
  const url = new URL("https://duckduckgo.com/i.js");
  url.searchParams.set("q", query);
  url.searchParams.set("o", "json");
  url.searchParams.set("l", "wt-wt");
  url.searchParams.set("f", ",,,");
  url.searchParams.set("p", "1");
  url.searchParams.set("vqd", vqd);

  const res = await fetch(url.toString(), {
    headers: {
      "accept": "application/json, text/javascript, */*; q=0.01",
      "referer": "https://duckduckgo.com/",
      "user-agent": SEARCH_USER_AGENT,
      "x-requested-with": "XMLHttpRequest",
    },
  });

  const raw = await res.text();

  if (res.status === 202 || res.status === 429) {
    throw new SearchProviderError(
      "rate_limited",
      "외부 이미지 검색 제공자 요청이 잠시 제한되었습니다. 잠시 후 다시 시도해주세요.",
      { provider: SEARCH_PROVIDER, upstream_status: res.status },
    );
  }

  if (!res.ok) {
    throw new SearchProviderError(
      "search_unavailable",
      "외부 이미지 검색 제공자가 요청을 처리하지 못했습니다. 잠시 후 다시 시도해주세요.",
      { provider: SEARCH_PROVIDER, upstream_status: res.status },
    );
  }

  let data: any;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new SearchProviderError(
      "search_unavailable",
      "외부 이미지 검색 응답을 해석하지 못했습니다. 잠시 후 다시 시도해주세요.",
      { provider: SEARCH_PROVIDER },
    );
  }

  const items = Array.isArray(data?.results)
    ? data.results
        .slice(0, 10)
        .map((item: any) => ({
          title: stripHtml(item?.title) || query,
          link: item?.image || item?.thumbnail || "",
          thumbnailLink: item?.thumbnail || item?.image || "",
          contextLink: item?.url || null,
          width: item?.width ?? null,
          height: item?.height ?? null,
        }))
        .filter((item: any) => item.link && item.thumbnailLink)
    : [];

  return items;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const query = typeof body?.query === "string" ? body.query.trim() : "";

    if (!query) {
      return json({ error: "invalid_query", message: "query is required", provider: SEARCH_PROVIDER });
    }

    const items = await searchDuckDuckGoImages(query);

    return json({ items, provider: SEARCH_PROVIDER });
  } catch (error) {
    if (error instanceof SearchProviderError) {
      console.error("image search provider error:", error.code, error.details);
      return json({
        error: error.code,
        message: error.message,
        provider: SEARCH_PROVIDER,
        ...error.details,
      });
    }

    console.error("image-search error:", error);
    return json({
      error: "internal_error",
      message: "이미지 검색 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.",
      provider: SEARCH_PROVIDER,
    });
  }
});

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AI_CONFIG } from "../_shared/ai-config.ts";

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

    const { lyrics } = await req.json();
    if (!lyrics || !lyrics.trim()) {
      return new Response(JSON.stringify({ topics: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch(AI_CONFIG.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": AI_CONFIG.anthropicVersion,
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        max_tokens: 256,
        system: "JSON 배열로만 응답하세요. 다른 텍스트는 포함하지 마세요.",
        messages: [
          {
            role: "user",
            content: `아래 가사를 읽고 다음 29개 태그 중 가장 적합한 2-3개를 골라줘.
반드시 목록에 있는 것만 선택.
JSON 배열로만 응답: ["태그1", "태그2"]

허용 태그: 감사 결단 경배 고백 공동체 구원 기도 기쁨 동행 믿음 사랑 사명 선교 성령 소망 순종 십자가 영광 위로 은혜 인도하심 찬양 축복 치유 평안 하나님의나라 헌신 회개 회복

가사:
${lyrics.substring(0, 2000)}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", errorText);
      return new Response(
        JSON.stringify({ error: "AI API error" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await response.json();
    let resultText = "";
    for (const block of aiData.content || []) {
      if (block.type === "text") {
        resultText += block.text;
      }
    }

    try {
      const jsonMatch = resultText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const topics = JSON.parse(jsonMatch[0]);
        // Validate against allowed topics
        const allowed = new Set([
          "감사", "결단", "경배", "고백", "공동체", "구원", "기도", "기쁨", "동행",
          "믿음", "사랑", "사명", "선교", "성령", "소망", "순종", "십자가", "영광",
          "위로", "은혜", "인도하심", "찬양", "축복", "치유", "평안", "하나님의나라",
          "헌신", "회개", "회복",
        ]);
        const filtered = topics.filter((t: string) => allowed.has(t));
        return new Response(JSON.stringify({ topics: filtered }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr);
    }

    return new Response(JSON.stringify({ topics: [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

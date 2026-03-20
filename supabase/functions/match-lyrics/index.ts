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
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
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

    const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build user message
    let userMessage = `곡 제목: ${title}`;
    if (artist) userMessage += `\n아티스트: ${artist}`;
    if (original_composer) userMessage += `\n원곡자: ${original_composer}`;
    userMessage += `\n이 곡의 실제 가사를 찾아주세요.`;

    const response = await fetch(AI_CONFIG.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": AI_CONFIG.anthropicVersion,
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        max_tokens: 4096,
        tools: [
          {
            type: "web_search_20250305",
            name: "web_search",
            max_uses: 3,
          },
        ],
        system: `당신은 한국 CCM/찬양 가사 전문가입니다.
곡 제목, 아티스트, 원곡자 정보로 실제 가사를 찾아 반환합니다.

규칙:
- 반드시 실제 가사만 반환. 절대 창작하거나 추측하지 말 것.
- 검색 우선순위: melon.com → genie.co.kr → akbotong.com → ccm3.net → lyrics.co.kr
- 동명이곡 주의: 아티스트/원곡자 정보로 정확한 버전 특정
- 찾을 수 없으면 반드시 found: false 반환
- 섹션 레이블 포함 (1절, 2절, 후렴, 브릿지)
- JSON만 응답:
  { "found": boolean, "lyrics": string | null, "source": string | null }`,
        messages: [
          {
            role: "user",
            content: userMessage,
          },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", errorText);
      return new Response(
        JSON.stringify({ error: "AI API error", details: errorText }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await response.json();

    // Extract text from response content blocks
    let resultText = "";
    for (const block of aiData.content || []) {
      if (block.type === "text") {
        resultText += block.text;
      }
    }

    // Parse JSON from the response
    try {
      // Try to extract JSON from the response (might be wrapped in markdown code blocks)
      const jsonMatch = resultText.match(/\{[\s\S]*"found"[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return new Response(JSON.stringify(parsed), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr, "Raw text:", resultText);
    }

    // Fallback: couldn't parse
    return new Response(
      JSON.stringify({ found: false, lyrics: null, source: null }),
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

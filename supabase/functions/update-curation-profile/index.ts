import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SYSTEM_PROMPT = `당신은 한국 찬양인도자의 예배 스타일을 파악하는 도우미입니다.
아래 질문들을 자연스러운 대화 형식으로 하나씩 물어보세요. 한국어로 대화합니다.

파악해야 할 내용:
1. 주로 섬기는 교회의 회중 특성 (연령대, 한국어/영어 비율)
2. 선호하는 예배 분위기와 템포 패턴
3. 자주 쓰는 키 (예: F, G, A, Bb)
4. 밴드 구성 (피아노만, 풀밴드, 어쿠스틱 등)
5. 선호하는 찬양 스타일 (마커스워십, 어노인팅, 모던CCM, 찬송가 등)
6. 예배 시간 (보통 몇 분 인도하는지)

대화가 충분히 진행되면 아래 JSON 형식으로 응답한다:
{"response": "사용자에게 보여줄 메시지", "skills_summary": "이 찬양인도자에 대한 한국어 서술 — AI 선곡 시스템이 참고할 내용. 2-3문장으로 간결하게.", "is_complete": true}

아직 정보가 부족하면:
{"response": "다음 질문", "skills_summary": null, "is_complete": false}

반드시 위 JSON 형식으로만 응답하세요. 다른 텍스트를 추가하지 마세요.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, existingSummary } = await req.json();

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build system prompt with context
    const systemContent = existingSummary
      ? `${SYSTEM_PROMPT}\n\n기존 프로필 정보:\n${existingSummary}\n\n사용자가 프로필을 수정하려 합니다. 기존 정보를 참고하여 변경사항을 반영하세요.`
      : SYSTEM_PROMPT;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 800,
        system: systemContent,
        messages,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "요청이 너무 많습니다. 잠시 후 다시 시도해주세요." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("Anthropic API error:", response.status, errorText);
      throw new Error("AI API error");
    }

    const aiData = await response.json();
    const rawContent = aiData.content?.[0]?.text || "";

    // Parse JSON from response
    let parsed;
    try {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : rawContent);
    } catch {
      parsed = { response: rawContent, skills_summary: null, is_complete: false };
    }

    // If complete, save to database
    if (parsed.is_complete && parsed.skills_summary) {
      const { error: upsertError } = await supabase
        .from("user_curation_profiles")
        .upsert({
          user_id: user.id,
          skills_summary: parsed.skills_summary,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (upsertError) {
        console.error("Upsert error:", upsertError);
      }
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { AI_CONFIG } from "../_shared/ai-config.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1507692049790-de58290a4334?w=800',
  'https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=800',
  'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?w=800',
  'https://images.unsplash.com/photo-1545232979-8bf68ee9b1af?w=800',
];

const SYSTEM_PROMPT = `당신은 K-Worship Institute의 콘텐츠 구조화 AI입니다.

당신의 역할은 강의 원고의 내용을 보존하면서 디지털 학습 페이지에 맞는 구조로 변환하는 것입니다.

핵심 원칙:
- 원본 텍스트를 요약하거나 축소하지 마십시오
- 원고의 모든 문장이 출력에 포함되어야 합니다
- 당신의 역할은 재작성이 아니라 구조화입니다
- 원고의 어조, 깊이, 설명을 그대로 유지하십시오

페이지 분할 기준:
- 원고의 자연스러운 주제 전환 지점에서 페이지를 나누십시오
- 한 페이지에 1-2개의 주요 개념/섹션을 담으십시오
- 페이지 길이는 내용에 따라 유동적입니다 (글자 수 제한 없음)
- 일반적으로 한 챕터는 6-10개 페이지로 분할됩니다

블록 태깅 규칙:
1. heading: 섹션 제목 또는 주제 전환 표시 (level 1-3)
2. paragraph: 본문 텍스트 — 원문 그대로 보존. 여러 문장을 하나의 paragraph 블록에 포함 가능
3. verse: 성경 구절 — text에 구절 전문, reference에 출처 (예: 로마서 12:1)
4. callout: 핵심 정의나 중요 개념 — 본문과 별도로 강조 표시. icon 옵션: 💡(정의), 📖(성경원리), 🎯(적용), 💬(인용)
5. quote: 저자 인용, 명언 — text와 attribution 포함
6. image: 시각적 전환이 필요한 위치에 배치. search_query(영어 Unsplash 검색어)와 caption(한국어) 포함
7. list: 번호/항목 목록 — ordered(boolean)와 items(배열) 포함
8. divider: 주요 섹션 사이 구분선

퀴즈 생성 (generate_quiz=true인 경우):
- 강의 핵심 내용에서 5-7개 질문 생성
- 이해도를 측정하는 질문 (단순 암기 X)
- 각 질문에 4개 선택지, correct_answer_index, explanation_ko 포함

출력 형식 (JSON만, markdown fence 없이):
{
  "pages": [{
    "title_ko": "페이지 제목",
    "content_blocks": [
      {"id": "<uuid>", "type": "heading", "data": {"level": 1, "text": "..."}},
      {"id": "<uuid>", "type": "paragraph", "data": {"text": "원본 텍스트 그대로..."}},
      {"id": "<uuid>", "type": "verse", "data": {"text": "성경 구절", "reference": "출처"}},
      {"id": "<uuid>", "type": "callout", "data": {"text": "핵심 포인트", "icon": "💡"}},
      {"id": "<uuid>", "type": "image", "data": {"url": "STOCK_PHOTO_PLACEHOLDER", "caption": "...", "alt": "...", "search_query": "..."}},
      {"id": "<uuid>", "type": "list", "data": {"ordered": true, "items": ["항목1", "항목2"]}},
      {"id": "<uuid>", "type": "quote", "data": {"text": "인용문", "attribution": "출처"}},
      {"id": "<uuid>", "type": "divider", "data": {}}
    ]
  }],
  "quiz": {
    "title_ko": "퀴즈 제목",
    "questions": [{
      "question_text_ko": "질문?",
      "question_text": "Question?",
      "options": [{"text_ko": "선택지1", "text": "Option1"}, {"text_ko": "선택지2", "text": "Option2"}, {"text_ko": "선택지3", "text": "Option3"}, {"text_ko": "선택지4", "text": "Option4"}],
      "correct_answer_index": 0,
      "explanation_ko": "해설"
    }]
  }
}

중요: quiz 필드는 generate_quiz가 false이면 null로 설정하십시오.
각 블록의 id는 고유한 UUID를 생성하십시오.`;

function asSSE(event: string, data: unknown) {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

async function replaceImagePlaceholders(pages: any[]): Promise<any[]> {
  let imageIdx = 0;
  for (const page of pages) {
    if (!Array.isArray(page.content_blocks)) continue;
    for (const block of page.content_blocks) {
      if (block.type === 'image' && block.data?.url === 'STOCK_PHOTO_PLACEHOLDER') {
        const unsplashKey = Deno.env.get('UNSPLASH_ACCESS_KEY');
        if (unsplashKey && block.data.search_query) {
          try {
            const q = encodeURIComponent(block.data.search_query);
            const res = await fetch(`https://api.unsplash.com/search/photos?query=${q}&per_page=1&orientation=landscape`, {
              headers: { Authorization: `Client-ID ${unsplashKey}` },
            });
            if (res.ok) {
              const json = await res.json();
              if (json.results?.[0]?.urls?.regular) {
                block.data.url = json.results[0].urls.regular;
                continue;
              }
            }
          } catch (_) { /* fall through to fallback */ }
        }
        block.data.url = FALLBACK_IMAGES[imageIdx % FALLBACK_IMAGES.length];
        imageIdx++;
      }
    }
  }
  return pages;
}

function repairAndParseJSON(rawText: string): any {
  const jsonMatch = rawText.match(/\{[\s\S]*/);
  if (!jsonMatch) throw new Error('No JSON found in response');
  let jsonStr = jsonMatch[0];

  try {
    return JSON.parse(jsonStr);
  } catch (_) {
    console.warn('JSON parse failed, attempting truncation-safe repair...');

    const lastCompletePageMatch = jsonStr.match(
      /("pages"\s*:\s*\[[\s\S]*\})\s*,\s*\{[^]*$/
    );
    if (lastCompletePageMatch) {
      jsonStr = lastCompletePageMatch[1] + '], "quiz": null}';
      console.log('Repaired by truncating to last complete page');
    } else {
      jsonStr = jsonStr.replace(/,\s*"[^"]*"?\s*:\s*"[^"]*$/, '');
      jsonStr = jsonStr.replace(/,\s*\{[^}]*$/, '');
      jsonStr = jsonStr.replace(/,\s*"[^"]*$/, '');
      let openBraces = 0, openBrackets = 0;
      let inString = false, escape = false;
      for (const ch of jsonStr) {
        if (escape) { escape = false; continue; }
        if (ch === '\\') { escape = true; continue; }
        if (ch === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (ch === '{') openBraces++;
        if (ch === '}') openBraces--;
        if (ch === '[') openBrackets++;
        if (ch === ']') openBrackets--;
      }
      if (inString) jsonStr += '"';
      for (let i = 0; i < openBrackets; i++) jsonStr += ']';
      for (let i = 0; i < openBraces; i++) jsonStr += '}';
    }
    const parsed = JSON.parse(jsonStr);
    console.log(`JSON repair successful — ${parsed.pages?.length || 0} pages recovered`);
    return parsed;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: authError } = await adminSupabase.auth.getUser(token);
    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userId = userData.user.id;

    const { data: roleData } = await adminSupabase.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin');
    if (!roleData || roleData.length === 0) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin role required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { course_id, module_title_ko, file_content, generate_quiz } = await req.json();

    if (!file_content || !module_title_ko) {
      return new Response(JSON.stringify({ error: 'file_content and module_title_ko are required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const truncated = file_content.slice(0, 30000);

    const userPrompt = `다음 강의 원고를 K-Worship Institute 학습 페이지로 변환해주세요.

모듈 제목: ${module_title_ko}
퀴즈 생성: ${generate_quiz ? '예 (3-5개 질문)' : '아니요'}

--- 강의 원고 ---
${truncated}
--- 원고 끝 ---

위 형식에 맞춰 JSON만 출력해주세요.`;

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const MAX_TOKENS = 16384;
    const INSTITUTE_FAST_MODEL = 'claude-haiku-3-5-20251001';

    const accept = req.headers.get('Accept') || '';
    const wantsSSE = accept.includes('text/event-stream');

    const runAnthropicStream = async (onDelta: (text: string) => void) => {
      // Use streaming to keep the edge function connection alive
      const aiResponse = await fetch(AI_CONFIG.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicKey,
          'anthropic-version': AI_CONFIG.anthropicVersion,
        },
        body: JSON.stringify({
          model: INSTITUTE_FAST_MODEL,
          max_tokens: MAX_TOKENS,
          stream: true,
          messages: [{ role: 'user', content: userPrompt }],
          system: SYSTEM_PROMPT,
        }),
      });

      if (!aiResponse.ok) {
        const errText = await aiResponse.text();
        console.error('Anthropic API error:', errText);
        throw new Error(errText || 'Anthropic API error');
      }

      const reader = aiResponse.body!.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const dataStr = line.slice(6).trim();
          if (!dataStr || dataStr === '[DONE]') continue;
          try {
            const event = JSON.parse(dataStr);
            if (event.type === 'content_block_delta' && event.delta?.text) {
              const t = String(event.delta.text);
              fullText += t;
              onDelta(t);
            }
          } catch (_) {
            // Skip unparseable SSE lines
          }
        }
      }

      return fullText;
    };

    if (wantsSSE) {
      const encoder = new TextEncoder();

      const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
          // Send something immediately to avoid idle timeouts
          controller.enqueue(encoder.encode(asSSE('start', { ok: true })));
          const keepAlive = setInterval(() => {
            try {
              controller.enqueue(encoder.encode(': ping\n\n'));
            } catch (_) {
              // ignore
            }
          }, 15000);

          try {
            let fullText = '';
            fullText = await runAnthropicStream((deltaText) => {
              controller.enqueue(encoder.encode(asSSE('delta', { text: deltaText })));
            });

            console.log(`Stream complete: accumulated ${fullText.length} chars`);

            if (!fullText || fullText.trim().length === 0) {
              controller.enqueue(encoder.encode(asSSE('error', { error: 'AI 응답이 비어있습니다. 다시 시도해주세요.' })));
              return;
            }

            let parsed: any;
            try {
              parsed = repairAndParseJSON(fullText);
            } catch (parseErr) {
              console.error('Failed to parse AI response:', fullText.slice(0, 500));
              controller.enqueue(encoder.encode(asSSE('error', { error: 'Failed to parse AI response', raw: fullText.slice(0, 1000) })));
              return;
            }

            if (!parsed.pages) parsed.pages = [];
            if (!parsed.quiz) parsed.quiz = null;

            if (parsed.pages.length > 0) {
              parsed.pages = await replaceImagePlaceholders(parsed.pages);
            }

            // Log AI usage
            try {
              await adminSupabase.from('ai_usage_log').insert({ user_id: userId, action_type: 'institute_content_gen' });
              await adminSupabase.rpc('increment_ai_usage', { p_user_id: userId });
            } catch (logErr) {
              console.error('Usage logging failed:', logErr);
            }

            controller.enqueue(encoder.encode(asSSE('result', { success: true, data: parsed })));
            controller.enqueue(encoder.encode(asSSE('done', { ok: true })));
          } catch (err) {
            console.error('SSE generation error:', err);
            controller.enqueue(encoder.encode(asSSE('error', { error: 'AI generation failed', details: String(err?.message || err) })));
          } finally {
            clearInterval(keepAlive);
            try {
              controller.close();
            } catch (_) {
              // ignore
            }
          }
        },
      });

      return new Response(stream, {
        headers: {
          ...corsHeaders,
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          Connection: 'keep-alive',
          'X-Accel-Buffering': 'no',
        },
      });
    }

    // Non-SSE (backwards compatible) path: run streaming upstream, return JSON at the end
    const fullText = await runAnthropicStream(() => {
      // no-op
    });

    console.log(`Stream complete: accumulated ${fullText.length} chars`);

    if (!fullText || fullText.trim().length === 0) {
      console.error('AI streaming response produced no text');
      return new Response(JSON.stringify({ error: 'AI 응답이 비어있습니다. 다시 시도해주세요.' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let parsed: any;
    try {
      parsed = repairAndParseJSON(fullText);
    } catch (parseErr) {
      console.error('Failed to parse AI response:', fullText.slice(0, 500));
      return new Response(JSON.stringify({ error: 'Failed to parse AI response', raw: fullText.slice(0, 1000) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!parsed.pages) parsed.pages = [];
    if (!parsed.quiz) parsed.quiz = null;

    if (parsed.pages.length > 0) {
      parsed.pages = await replaceImagePlaceholders(parsed.pages);
    }

    try {
      await adminSupabase.from('ai_usage_log').insert({ user_id: userId, action_type: 'institute_content_gen' });
      await adminSupabase.rpc('increment_ai_usage', { p_user_id: userId });
    } catch (logErr) {
      console.error('Usage logging failed:', logErr);
    }

    return new Response(JSON.stringify({ success: true, data: parsed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('institute-generate-content error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

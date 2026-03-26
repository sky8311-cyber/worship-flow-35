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

const SYSTEM_PROMPT = `You are a content structuring assistant for K-Worship Institute, a Korean worship leader training platform.

Your task: Convert lecture manuscript text into structured JSON content for the learning platform.

OUTPUT FORMAT (strict JSON, no markdown fences):
{
  "pages": [
    {
      "title_ko": "페이지 제목 (한국어)",
      "content_blocks": [
        { "id": "<uuid>", "type": "heading", "data": { "level": 1, "text": "..." } },
        { "id": "<uuid>", "type": "paragraph", "data": { "text": "..." } },
        { "id": "<uuid>", "type": "verse", "data": { "text": "...", "reference": "요한복음 3:16" } },
        { "id": "<uuid>", "type": "callout", "data": { "icon": "💡", "text": "..." } },
        { "id": "<uuid>", "type": "image", "data": { "url": "STOCK_PHOTO_PLACEHOLDER", "caption": "...", "search_query": "worship church prayer" } },
        { "id": "<uuid>", "type": "divider", "data": {} }
      ]
    }
  ],
  "quiz": {
    "title_ko": "퀴즈 제목",
    "questions": [
      {
        "question_text_ko": "질문 (한국어)",
        "question_text": "Question (English)",
        "options": [
          { "text_ko": "선택지 A", "text": "Option A" },
          { "text_ko": "선택지 B", "text": "Option B" },
          { "text_ko": "선택지 C", "text": "Option C" },
          { "text_ko": "선택지 D", "text": "Option D" }
        ],
        "correct_answer_index": 0,
        "explanation_ko": "해설 (한국어)"
      }
    ]
  }
}

RULES:
- Split content into logical pages (800-1200 characters per page in Korean)
- Each page should have a clear heading (level 1) at the top
- Use "verse" blocks for Bible references
- Use "callout" blocks for key insights, practical tips
- Insert an "image" block with "STOCK_PHOTO_PLACEHOLDER" every 2-3 paragraphs with a relevant search_query
- Use "divider" blocks between major sections
- Generate unique UUIDs for each block id
- If quiz requested, generate 3-5 multiple choice questions covering key concepts
- All text content should be in Korean
- quiz field should be null if not requested`;

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
        // Use fallback images in rotation
        block.data.url = FALLBACK_IMAGES[imageIdx % FALLBACK_IMAGES.length];
        imageIdx++;
      }
    }
  }
  return pages;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
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

    // Check admin role
    const { data: roleData } = await adminSupabase.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin');
    if (!roleData || roleData.length === 0) {
      return new Response(JSON.stringify({ error: 'Forbidden: admin role required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { course_id, module_title_ko, file_content, generate_quiz } = await req.json();

    if (!file_content || !module_title_ko) {
      return new Response(JSON.stringify({ error: 'file_content and module_title_ko are required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Truncate to ~30k chars to fit within context
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

    const aiResponse = await fetch(AI_CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': AI_CONFIG.anthropicVersion,
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        max_tokens: 8000,
        messages: [
          { role: 'user', content: userPrompt },
        ],
        system: SYSTEM_PROMPT,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('Anthropic API error:', errText);
      return new Response(JSON.stringify({ error: 'AI generation failed', details: errText }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const aiJson = await aiResponse.json();
    const rawText = aiJson.content?.[0]?.text || '';

    // Parse JSON from response (handle possible markdown fences)
    let parsed: any;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in response');
      parsed = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error('Failed to parse AI response:', rawText.slice(0, 500));
      return new Response(JSON.stringify({ error: 'Failed to parse AI response', raw: rawText.slice(0, 1000) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Replace image placeholders
    if (parsed.pages) {
      parsed.pages = await replaceImagePlaceholders(parsed.pages);
    }

    // Log AI usage
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

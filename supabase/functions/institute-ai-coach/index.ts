import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    const token = authHeader.replace('Bearer ', '');
    const { data: userData, error: userError } = await adminSupabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { user_id, course_id, module_id, message, conversation_history = [] } = await req.json();

    if (user_id !== userData.user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!course_id || !module_id || !message) {
      return new Response(JSON.stringify({ error: 'course_id, module_id, and message are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch module and course info
    const [moduleRes, courseRes] = await Promise.all([
      adminSupabase.from('institute_modules').select('title_ko, content_ko').eq('id', module_id).single(),
      adminSupabase.from('institute_courses').select('title_ko').eq('id', course_id).single(),
    ]);

    const moduleTitle = moduleRes.data?.title_ko || '';
    const moduleContent = moduleRes.data?.content_ko || '';
    const courseTitle = courseRes.data?.title_ko || '';

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const systemPrompt = `당신은 K-Worship Institute의 AI 러닝 코치입니다.
한국 기독교 예배 사역자들을 위한 온라인 스쿨에서 학습을 돕습니다.
현재 수강 중인 과정: ${courseTitle}
현재 학습 중인 모듈: ${moduleTitle}
모듈 내용 요약: ${moduleContent.slice(0, 500)}

학습 내용과 관련된 질문에 따뜻하고 목회적인 어조로 답합니다.
예배 신학, 사역 원칙, 실천적 리더십에 대해 깊이 있게 답합니다.
답변은 한국어로 합니다. 간결하고 실용적으로 답합니다.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          ...conversation_history,
          { role: 'user', content: message },
        ],
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI 서비스 크레딧이 부족합니다.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const t = await response.text();
      console.error('AI gateway error:', response.status, t);
      throw new Error('AI gateway error');
    }

    const aiResult = await response.json();
    const reply = aiResult.choices?.[0]?.message?.content || '';

    // Fire-and-forget: log AI usage
    fetch(`${supabaseUrl}/functions/v1/log-ai-usage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id, action_type: 'institute_coach' }),
    }).catch(() => {});

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('institute-ai-coach error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

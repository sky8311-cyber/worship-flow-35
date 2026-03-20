import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SKILLS_MD = `당신은 한인교회 장년 예배를 위한 찬양 선곡 전문가입니다. 찬양인도자의 시각으로 예배 흐름을 설계합니다.

## 핵심 철학
- 찬양으로 설교 내용을 담는 것이 목적이 아니다. 성도들이 하나님을 바라보고 말씀에 귀 기울일 수 있도록 마음을 여는 것이 목적이다.
- 설교 본문의 핵심 신학 명제를 추출한다. 키워드 매칭이 아닌 명제(proposition)로 연결한다.
- 가사를 모르면 선곡하지 않는다. 추측 절대 금지.

## 예배 아크 (Worship Arc)
나아감 → 하나님의 위대하심/선하심/신실하심 선포 → 나의 고백/낮아짐/엎드림 → 오직 주만 바라봄

## 선곡 구조
- 1번: 마음 열기. 친숙하고 간결한 가사. 템포 유연.
- 2번: 선포/높임. 빠른 곡 우선. 하나님의 성품 선포.
- 3번: 깊이로 전환. 고백 또는 경배로 전환.
- 4번: 깊은 경배/엎드림. 느린 곡 필수. 말씀 직전 마음 준비.
- 5번(선택): 에너지 추가 시만. 후렴만. 억지로 추가하지 않는다.

## 템포 패턴 선호 순서
1. 느→빠→느→느 (기본 선호)
2. 빠→빠→느→느
3. 느→빠→빠→느

## 가사 처리 원칙
- 곡 데이터에 lyrics가 있으면: 가사를 읽고 본문과 신학적으로 대조하여 선곡
- lyrics가 없으면: 확실히 아는 곡만 선곡. 모르면 건너뜀. 추측 금지.

## 실제 예배 데이터 활용 원칙
- 제공된 community_patterns(실제 찬양인도자들의 선곡 패턴)를 참고 자료로 활용한다.
- 특정 인도자의 세트를 복사하지 않는다. 패턴과 흐름을 참고하여 새 세트를 설계한다.
- 자주 함께 쓰이는 곡 조합, 자주 쓰이는 키 전환, 실제 선호 템포 패턴을 반영한다.

## 출력 형식 (JSON array만 반환. 다른 텍스트 없음)
[{"song_id":"uuid","song_title":"string","artist":"string","key":"string","order_position":number,"role":"마음열기|선포|고백|경배","tempo":"느림|보통|빠름","transition_note":"string(한국어)","rationale":"string(한국어)"}]`;

const SYSTEM_PROMPT = `${SKILLS_MD}

위 지침에 따라 예배 세트를 구성한다. 제공된 곡 목록에서만 선곡한다. 목록에 없는 곡은 절대 추가하지 않는다. JSON array만 반환한다. 다른 텍스트 없음.`;

// Truncate lyrics to save tokens
function truncateLyrics(lyrics: string | null, maxLen = 400): string | null {
  if (!lyrics) return null;
  return lyrics.length > maxLen ? lyrics.substring(0, maxLen) + '...' : lyrics;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const db = createClient(supabaseUrl, supabaseServiceKey);

    const { data: userData, error: userError } = await db.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = userData.user.id;
    const { theme, songCount, preferredKey, durationMinutes, tone, communityId } = await req.json();

    // ── 1. Fetch songs ──
    let songs: any[] = [];

    if (communityId) {
      const { data: members } = await db
        .from('community_members')
        .select('user_id')
        .eq('community_id', communityId);
      const memberIds = (members || []).map((m: any) => m.user_id);

      const { data: publicSongs, error: pubErr } = await db
        .from('songs')
        .select('id, title, artist, default_key, lyrics, tags, topics, language')
        .or('is_private.eq.false,is_private.is.null')
        .limit(400);

      if (pubErr) {
        console.error('Failed to fetch public songs:', pubErr);
        return new Response(JSON.stringify({ error: 'Failed to fetch songs' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let privateSongs: any[] = [];
      if (memberIds.length > 0) {
        const { data: privData } = await db
          .from('songs')
          .select('id, title, artist, default_key, lyrics, tags, topics, language')
          .eq('is_private', true)
          .in('created_by', memberIds)
          .limit(100);
        privateSongs = privData || [];
      }

      const songMap = new Map<string, any>();
      for (const s of [...(publicSongs || []), ...privateSongs]) {
        songMap.set(s.id, s);
      }
      songs = Array.from(songMap.values());
    } else {
      const { data, error: songsError } = await db
        .from('songs')
        .select('id, title, artist, default_key, lyrics, tags, topics, language')
        .or('is_private.eq.false,is_private.is.null')
        .limit(500);

      if (songsError) {
        console.error('Failed to fetch songs:', songsError);
        return new Response(JSON.stringify({ error: 'Failed to fetch songs' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      songs = data || [];
    }

    if (!songs || songs.length === 0) {
      return new Response(JSON.stringify({ error: 'No songs available in the database' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── 2. Fetch user curation profile ──
    let profileSection = '';
    try {
      const { data: profile } = await db
        .from('user_curation_profiles')
        .select('skills_summary')
        .eq('user_id', userId)
        .maybeSingle();

      if (profile?.skills_summary) {
        profileSection = `\n\n이 찬양인도자의 회중 정보:\n${profile.skills_summary}`;
      }
    } catch (e) {
      console.error('Failed to fetch curation profile:', e);
    }

    // ── 3. Fetch recent community patterns ──
    let patternsSection = '';
    try {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const { data: recentSets } = await db
        .from('service_sets')
        .select('id, service_name, date')
        .gte('date', thirtyDaysAgo)
        .order('date', { ascending: false })
        .limit(20);

      if (recentSets && recentSets.length > 0) {
        // Pick up to 5 random sets
        const shuffled = recentSets.sort(() => Math.random() - 0.5).slice(0, 5);
        const setIds = shuffled.map(s => s.id);

        const { data: setSongs } = await db
          .from('set_songs')
          .select('service_set_id, position, key, bpm, song_id')
          .in('service_set_id', setIds)
          .order('position', { ascending: true });

        if (setSongs && setSongs.length > 0) {
          // Get song titles for pattern display
          const patternSongIds = [...new Set(setSongs.map(ss => ss.song_id))];
          const { data: patternSongs } = await db
            .from('songs')
            .select('id, title')
            .in('id', patternSongIds);

          const songTitleMap: Record<string, string> = {};
          (patternSongs || []).forEach((s: any) => { songTitleMap[s.id] = s.title; });

          const patternLines: string[] = [];
          shuffled.forEach((set, idx) => {
            const songsInSet = (setSongs || [])
              .filter(ss => ss.service_set_id === set.id)
              .sort((a, b) => a.position - b.position);

            if (songsInSet.length > 0) {
              const flow = songsInSet.map(ss => {
                const title = songTitleMap[ss.song_id] || '?';
                const key = ss.key ? `Key:${ss.key}` : '';
                const bpm = ss.bpm;
                const tempoPart = bpm ? (bpm >= 120 ? '빠름' : bpm >= 90 ? '보통' : '느림') : '';
                const meta = [key, tempoPart ? `템포:${tempoPart}` : ''].filter(Boolean).join(', ');
                return meta ? `${title} (${meta})` : title;
              }).join(' → ');
              patternLines.push(`- 세트 ${idx + 1}: ${flow}`);
            }
          });

          if (patternLines.length >= 3) {
            patternsSection = `\n\n실제 찬양인도자들의 최근 키 흐름 패턴 참고 (복사 금지, 키 전환 흐름만 참고):\n각 세트의 곡 순서와 키 흐름을 보여줍니다. 템포는 SKILLS_MD의 선곡 구조 원칙을 따릅니다.\n${patternLines.join('\n')}`;
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch community patterns:', e);
    }

    // ── 4. Build user message ──
    const songListJson = JSON.stringify(songs.map(s => ({
      song_id: s.id,
      title: s.title,
      artist: s.artist,
      original_key: s.default_key,
      lyrics: truncateLyrics(s.lyrics),
      language: s.language,
    })), null, 2);

    const userMessage = `예배 정보:
- 설교 본문/주제: ${theme || '일반 예배'}
- 곡 수: ${songCount || 5}곡
- 선호 키: ${preferredKey || '상관없음'}
- 예배 시간: ${durationMinutes || 30}분
- 분위기: ${tone || '혼합'}${profileSection}${patternsSection}

사용 가능한 곡 목록 (song_id, title, artist, original_key, lyrics 포함):
${songListJson}

위 곡 목록에서만 선곡한다. 목록에 없는 곡은 절대 추가하지 않는다. JSON array만 반환한다.`;

    // ── 5. Call Anthropic API ──
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');
    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error('Anthropic API error:', anthropicResponse.status, errorText);

      if (anthropicResponse.status === 429) {
        return new Response(JSON.stringify({ error: 'AI 서비스가 일시적으로 사용량이 초과되었습니다. 잠시 후 다시 시도해주세요.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ error: 'AI 서비스 오류가 발생했습니다. 다시 시도해주세요.' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const anthropicData = await anthropicResponse.json();
    const content = anthropicData.content?.[0]?.text;

    if (!content) {
      return new Response(JSON.stringify({ error: 'Empty response from AI' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse JSON
    let worshipSet;
    try {
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) throw new Error('No JSON array found');
      worshipSet = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      return new Response(JSON.stringify({ error: 'AI 응답을 처리할 수 없습니다. 다시 시도해주세요.' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── 6. Log AI usage (fire and forget) ──
    try {
      fetch(`${supabaseUrl}/functions/v1/log-ai-usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({ user_id: userId, action_type: 'set_generation' }),
      });
    } catch (logError) {
      console.error('Failed to log AI usage:', logError);
    }

    return new Response(JSON.stringify({ worshipSet }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('generate-worship-set error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

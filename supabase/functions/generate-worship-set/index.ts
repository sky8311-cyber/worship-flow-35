import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const SKILLS_MD = `# Worship Set Curation Knowledge Base

## Worship Flow Structure (Korean Church Context)

Korean Protestant worship services typically follow this flow pattern:

1. **Opening / 시작 (환영)** — Upbeat, congregational engagement. Sets energy and expectation.
2. **Praise / 찬양** — High-energy, celebratory songs. Key: major keys, faster tempos (120–140 BPM). 1–2 songs.
3. **Worship / 경배** — Transitional, moving from outward praise to inward devotion. Medium tempo (90–110 BPM). 1–2 songs.
4. **Encounter / 만남 (깊은 경배)** — Intimate, reflective. Slower tempo (60–90 BPM), minor keys or gentle major keys. 1–2 songs.
5. **Response / 응답** — After the sermon or encounter, a song of commitment or prayer. Often a hymn or well-known CCM. 1 song.
6. **Closing / 마무리 (축복)** — Sends the congregation out. Can be upbeat or a benediction. 1 song.

## Key Transition Rules
- Relative minor/major: C major → A minor, G major → E minor (smooth)
- Fourth up: C → F, G → C (natural resolution)
- Fifth up: C → G, D → A (bright, lifting)
- Avoid tritone jumps (C → F#) and random jumps > 3 semitones without harmonic relationship
- Use capo-friendly keys for guitar-led worship: G, C, D, E, A, Em, Am

## Korean Church Worship Context
- Korean CCM (마커스워십, 제이어스, 아이자야식스티원)
- Translated Western Worship (Hillsong, Bethel, Elevation Korean translations)
- Korean Hymns (찬송가)
- Balance familiar songs (70%) with newer songs (30%)

## Duration Planning
- Average song: 4–5 minutes including intro/outro
- Transition: 30s – 1 min
- 25-min worship block: 5–6 songs
- 40-min worship block: 7–9 songs
- 15-min worship block: 3–4 songs

## Output Quality Guidelines
- Every song must have a clear rationale for its position
- Transition notes should explain the musical and spiritual connection
- Key suggestions should account for vocalist range (most Korean worship in D–A range)
- Only suggest songs from the provided database — never invent songs
`;

const SYSTEM_PROMPT = `You are a worship set curator for Korean Christian churches. You understand worship flow, key transitions, energy arcs, and how to guide a congregation from preparation through encounter to response. Given a list of available songs and user preferences, return a worship set as a valid JSON array. Each item must have: song_id, song_title, key, order_position, transition_note, rationale. Return only the JSON array with no other text.

Here is your worship curation knowledge base:

${SKILLS_MD}`;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth validation
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data: userData, error: userError } = await adminSupabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = userData.user.id;
    const { theme, songCount, preferredKey, durationMinutes, tone, communityId } = await req.json();

    // Fetch available songs
    let songs: any[] = [];

    if (communityId) {
      // First get community member IDs
      const { data: members } = await adminSupabase
        .from('community_members')
        .select('user_id')
        .eq('community_id', communityId);

      const memberIds = (members || []).map((m: any) => m.user_id);

      // Get public songs + private songs created by community members
      const { data: publicSongs, error: pubErr } = await adminSupabase
        .from('songs')
        .select('id, title, artist, default_key, tags, topics, language')
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
        const { data: privData } = await adminSupabase
          .from('songs')
          .select('id, title, artist, default_key, tags, topics, language')
          .eq('is_private', true)
          .in('created_by', memberIds)
          .limit(100);
        privateSongs = privData || [];
      }

      // Deduplicate by id
      const songMap = new Map<string, any>();
      for (const s of [...(publicSongs || []), ...privateSongs]) {
        songMap.set(s.id, s);
      }
      songs = Array.from(songMap.values());
    } else {
      const { data, error: songsError } = await adminSupabase
        .from('songs')
        .select('id, title, artist, default_key, tags, topics, language')
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

    // Build user message
    const userMessage = `User preferences:
- Theme/Scripture: ${theme || 'General worship'}
- Number of songs: ${songCount || 5}
- Preferred key: ${preferredKey || 'Any'}
- Service duration: ${durationMinutes || 30} minutes
- Tone: ${tone || 'Mixed'}

Available songs (${songs.length} total):
${JSON.stringify(songs.map(s => ({
  id: s.id,
  title: s.title,
  artist: s.artist,
  key: s.default_key,
  tags: s.tags,
  topics: s.topics,
  language: s.language,
})), null, 2)}

Select exactly ${songCount || 5} songs from the list above and return a JSON array.`;

    // Call Anthropic API
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
        max_tokens: 1500,
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

    // Parse JSON from Claude's response (handle potential markdown wrapping)
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

    // Log AI usage (fire and forget)
    try {
      await fetch(`${supabaseUrl}/functions/v1/log-ai-usage`, {
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

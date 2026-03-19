import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { AI_CONFIG } from "../_shared/ai-config.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ALLOWED_TOPICS = [
  { ko: '감사', en: 'Thanksgiving' },
  { ko: '결단', en: 'Decision' },
  { ko: '경배', en: 'Worship' },
  { ko: '고백', en: 'Confession' },
  { ko: '공동체', en: 'Community' },
  { ko: '구원', en: 'Salvation' },
  { ko: '기도', en: 'Prayer' },
  { ko: '기쁨', en: 'Joy' },
  { ko: '나라', en: 'Kingdom' },
  { ko: '동행', en: 'Walking with God' },
  { ko: '믿음', en: 'Faith' },
  { ko: '사랑', en: 'Love' },
  { ko: '사명', en: 'Calling' },
  { ko: '선교', en: 'Mission' },
  { ko: '성령', en: 'Holy Spirit' },
  { ko: '소망', en: 'Hope' },
  { ko: '순종', en: 'Obedience' },
  { ko: '십자가', en: 'Cross' },
  { ko: '영광', en: 'Glory' },
  { ko: '위로', en: 'Comfort' },
  { ko: '은혜', en: 'Grace' },
  { ko: '인도하심', en: 'Guidance' },
  { ko: '찬양', en: 'Praise' },
  { ko: '축복', en: 'Blessing' },
  { ko: '치유', en: 'Healing' },
  { ko: '평안', en: 'Peace' },
  { ko: '헌신', en: 'Commitment' },
  { ko: '회개', en: 'Repentance' },
  { ko: '회복', en: 'Restoration' },
];

const TOPIC_NAMES_KO = ALLOWED_TOPICS.map(t => t.ko);

interface ScrapeResult {
  lyrics: string | null;
  source: 'gasazip' | 'bugs' | 'melon' | 'none';
  error?: string;
  trackInfo?: { title: string; artist: string };
  youtube_title?: string;
  verified?: boolean;
}

// Call the scrape-lyrics function with extra context
async function scrapeLyrics(title: string, artist: string, subtitle: string, youtubeUrl: string): Promise<ScrapeResult> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      return { lyrics: null, source: 'none', error: 'Missing config' };
    }
    
    const response = await fetch(`${supabaseUrl}/functions/v1/scrape-lyrics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
      },
      body: JSON.stringify({ title, artist, subtitle, youtube_url: youtubeUrl }),
    });
    
    if (!response.ok) {
      console.log('Scrape function failed:', response.status);
      return { lyrics: null, source: 'none', error: `Scrape failed: ${response.status}` };
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error calling scrape-lyrics:', error);
    return { lyrics: null, source: 'none', error: error instanceof Error ? error.message : 'Unknown' };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, artist, language, subtitle, youtube_url, notes } = await req.json();
    
    if (!title) {
      return new Response(
        JSON.stringify({ error: 'Title is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not configured');
    }

    console.log('Enriching song:', { title, artist, language, subtitle, youtube_url });

    // Step 1: Scrape lyrics with extra context
    console.log('Step 1: Scraping lyrics...');
    const scrapeResult = await scrapeLyrics(title, artist || '', subtitle || '', youtube_url || '');
    
    const hasScrapedLyrics = scrapeResult.lyrics && scrapeResult.lyrics.length > 50;
    console.log('Scrape result:', { 
      hasLyrics: hasScrapedLyrics, 
      source: scrapeResult.source,
      lyricsLength: scrapeResult.lyrics?.length || 0,
      verified: scrapeResult.verified,
      youtube_title: scrapeResult.youtube_title
    });

    // Step 2: AI analysis
    console.log('Step 2: AI analysis...');
    
    // Build extra context string
    let extraContext = '';
    if (subtitle) extraContext += `\n- 부제: ${subtitle}`;
    if (notes) extraContext += `\n- 메모/참고: ${notes}`;
    if (scrapeResult.youtube_title) extraContext += `\n- YouTube 영상 제목: ${scrapeResult.youtube_title}`;
    if (scrapeResult.trackInfo) {
      extraContext += `\n- 스크래핑된 곡 정보: "${scrapeResult.trackInfo.title}" by ${scrapeResult.trackInfo.artist}`;
    }
    
    let analysisPrompt: string;
    
    if (hasScrapedLyrics) {
      analysisPrompt = `다음 찬양/예배곡의 실제 가사를 분석하여 음악적 정보를 추천해주세요.

곡 정보:
- 제목: ${title}
- 아티스트: ${artist || '미상'}
- 언어: ${language || '한국어'}${extraContext}

[가사 내용]
${scrapeResult.lyrics}

분석 요청:
1. 가사의 분위기와 멜로디 라인을 고려하여 적절한 음악 키를 추천해주세요.
2. 가사 내용을 분석하여 가장 적합한 주제를 2-3개 선택해주세요.

주의: 주제는 반드시 아래 목록에서만 선택하세요:
${TOPIC_NAMES_KO.join(', ')}`;
    } else {
      analysisPrompt = `다음 찬양/예배곡의 정보를 기반으로 음악적 메타데이터를 추천해주세요.

곡 정보:
- 제목: ${title}
- 아티스트: ${artist || '미상'}
- 언어: ${language || '한국어'}${extraContext}

주의: 가사를 직접 찾을 수 없었습니다. 곡 제목과 아티스트 정보만으로 최선의 추측을 해주세요.

분석 요청:
1. 이 곡의 일반적인 연주 키를 추천해주세요.
2. 곡 제목에서 유추할 수 있는 주제를 2-3개 선택해주세요.

주의: 주제는 반드시 아래 목록에서만 선택하세요:
${TOPIC_NAMES_KO.join(', ')}`;
    }

    const response = await fetch(AI_CONFIG.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': AI_CONFIG.anthropicVersion,
      },
      body: JSON.stringify({
        model: AI_CONFIG.model,
        max_tokens: 1024,
        system: `당신은 한국 CCM과 예배 음악 전문가입니다. 곡의 가사와 분위기를 분석하여 정확한 메타데이터를 추천합니다.

중요 규칙:
1. 주제(topics)는 반드시 지정된 목록에서만 선택하세요.
2. 가사가 제공된 경우, 가사 내용을 깊이 분석하여 주제를 선택하세요.
3. 키는 실제 곡의 일반적인 연주 키를 추천하세요.
4. 확신이 없으면 confidence를 낮게 설정하세요.
5. 부제(subtitle)나 YouTube 제목이 제공된 경우, 정확한 곡 식별에 활용하세요.`,
        messages: [
          { role: 'user', content: analysisPrompt }
        ],
        tools: [{
          name: 'analyze_song_metadata',
          description: 'Return analyzed song metadata including key and topics',
          input_schema: {
            type: 'object',
            properties: {
              default_key: { 
                type: 'string', 
                enum: ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'],
                description: '추천하는 음악 키'
              },
              topics: {
                type: 'array',
                description: '가사 내용에서 분석된 주제들 (2-3개)',
                items: { type: 'string', enum: TOPIC_NAMES_KO },
              },
              confidence: {
                type: 'string',
                enum: ['high', 'medium', 'low'],
                description: '분석 결과의 신뢰도'
              },
              analysis_notes: {
                type: 'string',
                description: '분석에 대한 간단한 설명이나 참고사항'
              }
            },
            required: ['default_key', 'topics', 'confidence'],
          }
        }],
        tool_choice: { type: 'tool', name: 'analyze_song_metadata' }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('Anthropic API error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI API error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const toolUseBlock = data.content?.find((block: any) => block.type === 'tool_use');
    if (!toolUseBlock) {
      return new Response(
        JSON.stringify({ error: 'No metadata suggestions generated' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const aiAnalysis = toolUseBlock.input;
    
    const bilingualTopics = aiAnalysis.topics
      .map((topicKo: string) => {
        const found = ALLOWED_TOPICS.find(t => t.ko === topicKo);
        return found ? { ko: found.ko, en: found.en } : null;
      })
      .filter(Boolean);

    const suggestions = {
      lyrics: hasScrapedLyrics ? scrapeResult.lyrics : null,
      lyrics_source: scrapeResult.source,
      default_key: aiAnalysis.default_key,
      tags: bilingualTopics,
      confidence: hasScrapedLyrics ? 
        (aiAnalysis.confidence === 'low' ? 'medium' : aiAnalysis.confidence) : 
        'low',
      notes: aiAnalysis.analysis_notes || (
        hasScrapedLyrics 
          ? `${scrapeResult.source}에서 가사를 가져왔습니다.${scrapeResult.verified === false ? ' (유사도 검증 미통과 - 정확도 주의)' : ''}`
          : '가사를 찾을 수 없어 곡 제목 기반으로 분석했습니다. 정확도가 낮을 수 있습니다.'
      )
    };
    
    console.log('Final suggestions:', { 
      hasLyrics: !!suggestions.lyrics,
      source: suggestions.lyrics_source,
      key: suggestions.default_key,
      topicsCount: suggestions.tags.length,
      confidence: suggestions.confidence
    });

    return new Response(
      JSON.stringify({ success: true, suggestions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in enrich-song function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

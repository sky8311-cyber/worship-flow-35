import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, artist, language } = await req.json();
    
    if (!title) {
      return new Response(
        JSON.stringify({ error: 'Title is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Enriching song:', { title, artist, language });

    // Construct research prompt
    const prompt = `Research and provide detailed information about the worship song:
Title: ${title}
Artist: ${artist || 'Unknown'}
Language: ${language || 'Unknown'}

Please find and suggest:
1. Full lyrics (if available online)
2. BPM (tempo)
3. Musical key
4. Energy level (1-5 scale, where 1=slow/meditative, 5=fast/energetic)
5. Category (choose one: 찬송가, 모던워십 (한국), 모던워십 (서양), 모던워십 (기타), 한국 복음성가)
6. Bilingual tags in Korean and English that describe the song's themes, mood, and worship context (e.g., grace, repentance, thanksgiving, fast tempo, etc.)

Be accurate and research-based. If you cannot find information, indicate that clearly.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { 
            role: 'system', 
            content: 'You are a worship music expert assistant that researches and provides accurate information about worship songs. Provide detailed, research-based information.'
          },
          { role: 'user', content: prompt }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'suggest_song_metadata',
            description: 'Return detailed song metadata including lyrics, BPM, key, energy level, category, and bilingual tags',
            parameters: {
              type: 'object',
              properties: {
                lyrics: { 
                  type: 'string', 
                  description: 'Full song lyrics if found. If not found, return empty string.' 
                },
                bpm: { 
                  type: 'number', 
                  minimum: 40, 
                  maximum: 220,
                  description: 'Suggested tempo/BPM. If unknown, suggest typical range for this style.'
                },
                default_key: { 
                  type: 'string', 
                  enum: ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'],
                  description: 'Suggested musical key'
                },
                energy_level: { 
                  type: 'number', 
                  minimum: 1, 
                  maximum: 5,
                  description: '1=slow/meditative, 5=fast/energetic'
                },
                category: { 
                  type: 'string', 
                  enum: ['찬송가', '모던워십 (한국)', '모던워십 (서양)', '모던워십 (기타)', '한국 복음성가'],
                  description: 'Song category classification'
                },
                tags: {
                  type: 'array',
                  description: 'Bilingual tags describing themes, mood, and worship context',
                  items: {
                    type: 'object',
                    properties: {
                      ko: { type: 'string', description: 'Korean tag' },
                      en: { type: 'string', description: 'English translation' }
                    },
                    required: ['ko', 'en']
                  }
                },
                confidence: {
                  type: 'string',
                  enum: ['high', 'medium', 'low'],
                  description: 'Confidence level of the suggestions based on available information'
                },
                notes: {
                  type: 'string',
                  description: 'Any additional notes about the song or limitations of the information found'
                }
              },
              required: ['bpm', 'default_key', 'energy_level', 'category', 'tags', 'confidence'],
              additionalProperties: false
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'suggest_song_metadata' } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required. Please add credits to your Lovable workspace.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'AI gateway error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data, null, 2));

    // Extract tool call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(
        JSON.stringify({ error: 'No metadata suggestions generated' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const suggestions = JSON.parse(toolCall.function.arguments);
    
    console.log('Suggestions generated:', suggestions);

    return new Response(
      JSON.stringify({ 
        success: true,
        suggestions 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in enrich-song function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

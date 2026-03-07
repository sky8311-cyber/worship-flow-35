import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Song {
  id: string;
  title: string;
  artist: string;
  language: string;
  lyrics: string | null;
  default_key: string | null;
  topics: string | null;
  subtitle: string | null;
  youtube_url: string | null;
  notes: string | null;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const batchSize = body.batch_size || 5;
    const songId = body.song_id;

    let query = supabase
      .from('songs')
      .select('id, title, artist, language, lyrics, default_key, topics, subtitle, youtube_url, notes')
      .limit(batchSize);

    if (songId) {
      query = query.eq('id', songId);
    } else {
      query = query.eq('enrichment_status', 'needs_processing');
    }

    const { data: songs, error: fetchError } = await query;

    if (fetchError) {
      console.error('Error fetching songs:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch songs', details: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!songs || songs.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: 'No songs to process', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results: { songId: string; success: boolean; error?: string }[] = [];

    for (const song of songs as Song[]) {
      try {
        console.log(`Processing song: ${song.title} by ${song.artist}`);

        const needsLyrics = !song.lyrics || song.lyrics.trim() === '';
        const needsKey = !song.default_key || song.default_key.trim() === '';
        const needsTopics = !song.topics || song.topics.trim() === '';

        if (!needsLyrics && !needsKey && !needsTopics) {
          console.log(`Song ${song.id} already has all fields, skipping`);
          await supabase.from('songs').update({
            enrichment_status: 'enriched',
            last_enrichment_at: new Date().toISOString()
          }).eq('id', song.id);
          results.push({ songId: song.id, success: true });
          continue;
        }

        await supabase.from('songs').update({
          enrichment_status: 'pending',
          last_enrichment_at: new Date().toISOString()
        }).eq('id', song.id);

        // Pass extra context to enrich-song
        const enrichResponse = await fetch(`${supabaseUrl}/functions/v1/enrich-song`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            title: song.title,
            artist: song.artist || '',
            language: song.language || 'ko',
            subtitle: song.subtitle || '',
            youtube_url: song.youtube_url || '',
            notes: song.notes || ''
          })
        });

        if (!enrichResponse.ok) {
          const errorText = await enrichResponse.text();
          console.error(`Enrich failed for ${song.id}:`, errorText);
          await supabase.from('songs').update({ enrichment_status: 'failed' }).eq('id', song.id);
          results.push({ songId: song.id, success: false, error: errorText });
          continue;
        }

        const enrichResult = await enrichResponse.json();
        console.log(`Enrich result for ${song.title}:`, enrichResult);

        if (!enrichResult.success) {
          await supabase.from('songs').update({ enrichment_status: 'failed' }).eq('id', song.id);
          results.push({ songId: song.id, success: false, error: enrichResult.error });
          continue;
        }

        const suggestions = enrichResult.suggestions || {};
        const suggestionData: Record<string, unknown> = {
          song_id: song.id,
          status: 'pending',
          created_at: new Date().toISOString()
        };

        if (suggestions.lyrics) {
          suggestionData.suggested_lyrics = suggestions.lyrics;
          suggestionData.lyrics_source = suggestions.lyrics_source || 'none';
        }

        if (needsKey && suggestions.default_key) {
          suggestionData.suggested_key = suggestions.default_key;
        }

        if (needsTopics && suggestions.tags && suggestions.tags.length > 0) {
          suggestionData.suggested_topics = suggestions.tags.map(
            (t: { ko: string; en: string }) => `${t.ko} (${t.en})`
          );
        }

        suggestionData.confidence = suggestions.confidence || 'medium';
        suggestionData.ai_notes = suggestions.analysis_notes || null;

        const hasSuggestions = suggestionData.suggested_lyrics || 
                              suggestionData.suggested_key || 
                              (suggestionData.suggested_topics as string[] | undefined)?.length;

        if (hasSuggestions) {
          await supabase
            .from('song_enrichment_suggestions')
            .delete()
            .eq('song_id', song.id)
            .eq('status', 'pending');

          const { error: insertError } = await supabase
            .from('song_enrichment_suggestions')
            .insert(suggestionData);

          if (insertError) {
            console.error(`Failed to save suggestion for ${song.id}:`, insertError);
            results.push({ songId: song.id, success: false, error: insertError.message });
            continue;
          }
          console.log(`Suggestion saved for song ${song.id}`);
        } else {
          console.log(`No suggestions available for song ${song.id}`);
          await supabase.from('songs').update({ enrichment_status: 'failed' }).eq('id', song.id);
        }

        results.push({ songId: song.id, success: true });
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (songError) {
        console.error(`Error processing song ${song.id}:`, songError);
        results.push({ 
          songId: song.id, 
          success: false, 
          error: songError instanceof Error ? songError.message : 'Unknown error' 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failedCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Processed ${songs.length} songs`,
        processed: successCount,
        failed: failedCount,
        results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Process enrichment queue error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

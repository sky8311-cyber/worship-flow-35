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
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body for optional parameters
    const body = await req.json().catch(() => ({}));
    const batchSize = body.batch_size || 5;
    const songId = body.song_id; // Optional: process specific song

    // Build query for songs needing processing
    let query = supabase
      .from('songs')
      .select('id, title, artist, language, lyrics, default_key, topics')
      .limit(batchSize);

    if (songId) {
      // Process specific song
      query = query.eq('id', songId);
    } else {
      // Process songs flagged for enrichment
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

        // Determine what fields need enrichment
        const needsLyrics = !song.lyrics || song.lyrics.trim() === '';
        const needsKey = !song.default_key || song.default_key.trim() === '';
        const needsTopics = !song.topics || song.topics.trim() === '';

        // Skip if nothing needs enrichment
        if (!needsLyrics && !needsKey && !needsTopics) {
          console.log(`Song ${song.id} already has all fields, skipping`);
          
          // Update status to enriched
          await supabase.from('songs').update({
            enrichment_status: 'enriched',
            last_enrichment_at: new Date().toISOString()
          }).eq('id', song.id);
          
          results.push({ songId: song.id, success: true });
          continue;
        }

        // Mark as pending before processing
        await supabase.from('songs').update({
          enrichment_status: 'pending',
          last_enrichment_at: new Date().toISOString()
        }).eq('id', song.id);

        // Call enrich-song function
        const enrichResponse = await fetch(`${supabaseUrl}/functions/v1/enrich-song`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({
            title: song.title,
            artist: song.artist || '',
            language: song.language || 'ko'
          })
        });

        if (!enrichResponse.ok) {
          const errorText = await enrichResponse.text();
          console.error(`Enrich failed for ${song.id}:`, errorText);
          
          // Mark as failed
          await supabase.from('songs').update({
            enrichment_status: 'failed'
          }).eq('id', song.id);
          
          results.push({ songId: song.id, success: false, error: errorText });
          continue;
        }

        const enrichResult = await enrichResponse.json();
        console.log(`Enrich result for ${song.title}:`, enrichResult);

        if (!enrichResult.success) {
          await supabase.from('songs').update({
            enrichment_status: 'failed'
          }).eq('id', song.id);
          
          results.push({ songId: song.id, success: false, error: enrichResult.error });
          continue;
        }

        const suggestions = enrichResult.suggestions || {};

        // Prepare suggestion data
        const suggestionData: Record<string, unknown> = {
          song_id: song.id,
          status: 'pending',
          created_at: new Date().toISOString()
        };

        // Only include fields that were actually missing and have suggestions
        if (needsLyrics && suggestions.lyrics) {
          suggestionData.suggested_lyrics = suggestions.lyrics;
          suggestionData.lyrics_source = suggestions.lyrics_source || 'none';
        }

        if (needsKey && suggestions.default_key) {
          suggestionData.suggested_key = suggestions.default_key;
        }

        if (needsTopics && suggestions.tags && suggestions.tags.length > 0) {
          // Format tags as "ko (en)" strings
          suggestionData.suggested_topics = suggestions.tags.map(
            (t: { ko: string; en: string }) => `${t.ko} (${t.en})`
          );
        }

        suggestionData.confidence = suggestions.confidence || 'medium';
        suggestionData.ai_notes = suggestions.analysis_notes || null;

        // Check if we have any suggestions to save
        const hasSuggestions = suggestionData.suggested_lyrics || 
                              suggestionData.suggested_key || 
                              (suggestionData.suggested_topics as string[] | undefined)?.length;

        if (hasSuggestions) {
          // Delete any existing pending suggestion for this song
          await supabase
            .from('song_enrichment_suggestions')
            .delete()
            .eq('song_id', song.id)
            .eq('status', 'pending');

          // Insert new suggestion
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
          
          // Mark as failed (no data found)
          await supabase.from('songs').update({
            enrichment_status: 'failed'
          }).eq('id', song.id);
        }

        results.push({ songId: song.id, success: true });

        // Add delay between requests to avoid rate limiting
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

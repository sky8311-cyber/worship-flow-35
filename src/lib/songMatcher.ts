import { supabase } from "@/integrations/supabase/client";
import { ParsedSong } from "./notionParser";

export interface SongMatchResult {
  id: string;
  created: boolean;
  updated: boolean;
}

/**
 * Find an existing song by title or create a new one
 * Returns the song ID and whether it was created or updated
 */
export async function findOrCreateSong(
  parsedSong: ParsedSong,
  scoreUrl?: string
): Promise<SongMatchResult> {
  // Search for existing song by title (case-insensitive, trimmed)
  const { data: existing } = await supabase
    .from('songs')
    .select('id, youtube_url, score_file_url, default_key')
    .ilike('title', parsedSong.title.trim())
    .maybeSingle();
  
  if (existing) {
    // Update if new data is provided and field is currently empty
    const updates: any = {};
    let hasUpdates = false;
    
    if (parsedSong.youtubeUrl && !existing.youtube_url) {
      updates.youtube_url = parsedSong.youtubeUrl;
      hasUpdates = true;
    }
    if (scoreUrl && !existing.score_file_url) {
      updates.score_file_url = scoreUrl;
      hasUpdates = true;
    }
    if (parsedSong.key && !existing.default_key) {
      updates.default_key = parsedSong.key;
      hasUpdates = true;
    }
    
    if (hasUpdates) {
      await supabase.from('songs').update(updates).eq('id', existing.id);
    }
    
    return { id: existing.id, created: false, updated: hasUpdates };
  }
  
  // Create new song
  const languageValue = parsedSong.languages?.includes('한글') || parsedSong.languages?.includes('한국어')
    ? 'Korean'
    : parsedSong.languages?.includes('영어') || parsedSong.languages?.includes('English')
    ? 'English'
    : 'Korean'; // default to Korean
  
  const { data: newSong, error } = await supabase.from('songs').insert({
    title: parsedSong.title.trim(),
    default_key: parsedSong.key,
    youtube_url: parsedSong.youtubeUrl,
    score_file_url: scoreUrl,
    language: languageValue,
    category: null, // user can categorize later
  }).select('id').single();
  
  if (error) {
    throw new Error(`Failed to create song "${parsedSong.title}": ${error.message}`);
  }
  
  return { id: newSong.id, created: true, updated: false };
}

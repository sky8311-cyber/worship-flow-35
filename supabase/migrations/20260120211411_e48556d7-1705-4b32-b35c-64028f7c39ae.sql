-- Drop and recreate get_public_set_songs to filter out private songs
DROP FUNCTION IF EXISTS public.get_public_set_songs(text);

CREATE FUNCTION public.get_public_set_songs(share_token text)
 RETURNS TABLE(id uuid, song_id uuid, song_position integer, song_key text, key_change_to text, bpm integer, custom_notes text, lyrics text, override_youtube_url text, override_score_file_url text, song_title text, song_artist text, song_default_key text, song_youtube_url text, song_score_file_url text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    ss_songs.id,
    ss_songs.song_id,
    ss_songs.position as song_position,
    ss_songs.key as song_key,
    ss_songs.key_change_to,
    ss_songs.bpm,
    ss_songs.custom_notes,
    ss_songs.lyrics,
    ss_songs.override_youtube_url,
    ss_songs.override_score_file_url,
    s.title as song_title,
    s.artist as song_artist,
    s.default_key as song_default_key,
    s.youtube_url as song_youtube_url,
    s.score_file_url as song_score_file_url
  FROM service_sets ss
  JOIN set_songs ss_songs ON ss_songs.service_set_id = ss.id
  JOIN songs s ON s.id = ss_songs.song_id
  WHERE ss.public_share_token = share_token
    AND ss.public_share_enabled = true
    AND (s.is_private = false OR s.is_private IS NULL)
  ORDER BY ss_songs.position;
END;
$function$;
-- Create function to get public set songs (with quoted reserved words)
CREATE OR REPLACE FUNCTION get_public_set_songs(share_token TEXT)
RETURNS TABLE(
  id uuid,
  song_id uuid,
  song_position integer,
  song_key text,
  key_change_to text,
  bpm integer,
  custom_notes text,
  lyrics text,
  override_youtube_url text,
  override_score_file_url text,
  song_title text,
  song_artist text,
  song_default_key text,
  song_youtube_url text,
  song_score_file_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
  ORDER BY ss_songs.position;
END;
$$;

GRANT EXECUTE ON FUNCTION get_public_set_songs(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_public_set_songs(TEXT) TO authenticated;

-- Create function to get public set components
CREATE OR REPLACE FUNCTION get_public_set_components(share_token TEXT)
RETURNS TABLE(
  id uuid,
  component_position integer,
  component_type text,
  label text,
  notes text,
  content text,
  duration_minutes integer,
  assigned_to text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sc.id,
    sc.position as component_position,
    sc.component_type,
    sc.label,
    sc.notes,
    sc.content,
    sc.duration_minutes,
    sc.assigned_to
  FROM service_sets ss
  JOIN set_components sc ON sc.service_set_id = ss.id
  WHERE ss.public_share_token = share_token
    AND ss.public_share_enabled = true
  ORDER BY sc.position;
END;
$$;

GRANT EXECUTE ON FUNCTION get_public_set_components(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_public_set_components(TEXT) TO authenticated;

-- Create function to get public set score files
CREATE OR REPLACE FUNCTION get_public_song_scores(share_token TEXT)
RETURNS TABLE(
  id uuid,
  song_id uuid,
  score_key text,
  file_url text,
  score_position integer,
  page_number integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ssc.id,
    ssc.song_id,
    ssc.key as score_key,
    ssc.file_url,
    ssc.position as score_position,
    ssc.page_number
  FROM service_sets ss
  JOIN set_songs ss_songs ON ss_songs.service_set_id = ss.id
  JOIN song_scores ssc ON ssc.song_id = ss_songs.song_id
  WHERE ss.public_share_token = share_token
    AND ss.public_share_enabled = true
  ORDER BY ssc.song_id, ssc.position;
END;
$$;

GRANT EXECUTE ON FUNCTION get_public_song_scores(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_public_song_scores(TEXT) TO authenticated;
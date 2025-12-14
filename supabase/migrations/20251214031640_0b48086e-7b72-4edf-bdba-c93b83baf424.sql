-- Create the missing get_public_worship_set function for public link sharing
CREATE OR REPLACE FUNCTION public.get_public_worship_set(share_token text)
RETURNS TABLE(
  id uuid,
  service_name text,
  date date,
  service_time time,
  worship_leader text,
  band_name text,
  theme text,
  notes text,
  scripture_reference text,
  target_audience text,
  worship_duration integer,
  community_id uuid,
  community_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ss.id,
    ss.service_name,
    ss.date,
    ss.service_time,
    ss.worship_leader,
    ss.band_name,
    ss.theme,
    ss.notes,
    ss.scripture_reference,
    ss.target_audience,
    ss.worship_duration,
    ss.community_id,
    wc.name as community_name
  FROM service_sets ss
  LEFT JOIN worship_communities wc ON wc.id = ss.community_id
  WHERE ss.public_share_token = share_token
    AND ss.public_share_enabled = true;
END;
$$;
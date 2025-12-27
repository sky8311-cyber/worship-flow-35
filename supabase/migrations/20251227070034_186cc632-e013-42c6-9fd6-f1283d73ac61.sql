-- 1. Delete position-only UPDATE audit records (meaningless changes)
DELETE FROM public.set_songs_audit 
WHERE action = 'UPDATE' 
  AND changed_fields IS NOT NULL 
  AND jsonb_array_length(COALESCE(
    (SELECT jsonb_agg(key) FROM jsonb_object_keys(changed_fields) AS key), 
    '[]'::jsonb
  )) = 1
  AND changed_fields ? 'position';

DELETE FROM public.set_components_audit 
WHERE action = 'UPDATE' 
  AND changed_fields IS NOT NULL 
  AND jsonb_array_length(COALESCE(
    (SELECT jsonb_agg(key) FROM jsonb_object_keys(changed_fields) AS key), 
    '[]'::jsonb
  )) = 1
  AND changed_fields ? 'position';

-- 2. Delete redundant consecutive INSERT records (auto-save duplicates)
-- For set_songs_audit: keep only the first INSERT for same service_set_id + song_id within 30 seconds
WITH duplicate_inserts AS (
  SELECT 
    id,
    service_set_id,
    song_id,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY service_set_id, song_id 
      ORDER BY created_at ASC
    ) as rn
  FROM public.set_songs_audit
  WHERE action = 'INSERT'
)
DELETE FROM public.set_songs_audit 
WHERE id IN (
  SELECT id FROM duplicate_inserts WHERE rn > 1
);

-- For set_components_audit: keep only the first INSERT for same service_set_id + set_component_id
WITH duplicate_component_inserts AS (
  SELECT 
    id,
    service_set_id,
    set_component_id,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY service_set_id, set_component_id 
      ORDER BY created_at ASC
    ) as rn
  FROM public.set_components_audit
  WHERE action = 'INSERT'
)
DELETE FROM public.set_components_audit 
WHERE id IN (
  SELECT id FROM duplicate_component_inserts WHERE rn > 1
);

-- 3. Delete orphaned DELETE records that were part of DELETE+INSERT cycles
-- (DELETE followed by INSERT within 30 seconds for same song_id)
WITH delete_insert_pairs AS (
  SELECT 
    d.id as delete_id
  FROM public.set_songs_audit d
  INNER JOIN public.set_songs_audit i 
    ON d.service_set_id = i.service_set_id 
    AND d.song_id = i.song_id
    AND d.action = 'DELETE'
    AND i.action = 'INSERT'
    AND i.created_at > d.created_at
    AND i.created_at < d.created_at + INTERVAL '30 seconds'
)
DELETE FROM public.set_songs_audit 
WHERE id IN (SELECT delete_id FROM delete_insert_pairs);

-- Same for components
WITH delete_insert_component_pairs AS (
  SELECT 
    d.id as delete_id
  FROM public.set_components_audit d
  INNER JOIN public.set_components_audit i 
    ON d.service_set_id = i.service_set_id 
    AND d.set_component_id = i.set_component_id
    AND d.action = 'DELETE'
    AND i.action = 'INSERT'
    AND i.created_at > d.created_at
    AND i.created_at < d.created_at + INTERVAL '30 seconds'
)
DELETE FROM public.set_components_audit 
WHERE id IN (SELECT delete_id FROM delete_insert_component_pairs);
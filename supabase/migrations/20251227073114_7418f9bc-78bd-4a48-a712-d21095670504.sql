-- Clean up INSERT/DELETE pairs in set_songs_audit that occurred within 10 seconds of each other
-- These are caused by race conditions and should be removed to show meaningful history only

WITH delete_insert_song_pairs AS (
  SELECT 
    a1.id as delete_id, 
    a2.id as insert_id
  FROM set_songs_audit a1
  JOIN set_songs_audit a2 
    ON a1.song_id = a2.song_id 
    AND a1.service_set_id = a2.service_set_id
    AND a1.action = 'DELETE' 
    AND a2.action = 'INSERT'
    AND a2.created_at BETWEEN a1.created_at AND a1.created_at + interval '10 seconds'
),
delete_insert_component_pairs AS (
  SELECT 
    a1.id as delete_id, 
    a2.id as insert_id
  FROM set_components_audit a1
  JOIN set_components_audit a2 
    ON a1.set_component_id = a2.set_component_id 
    AND a1.service_set_id = a2.service_set_id
    AND a1.action = 'DELETE' 
    AND a2.action = 'INSERT'
    AND a2.created_at BETWEEN a1.created_at AND a1.created_at + interval '10 seconds'
),
-- Also find INSERT/DELETE pairs (opposite order)
insert_delete_song_pairs AS (
  SELECT 
    a1.id as insert_id, 
    a2.id as delete_id
  FROM set_songs_audit a1
  JOIN set_songs_audit a2 
    ON a1.song_id = a2.song_id 
    AND a1.service_set_id = a2.service_set_id
    AND a1.action = 'INSERT' 
    AND a2.action = 'DELETE'
    AND a2.created_at BETWEEN a1.created_at AND a1.created_at + interval '10 seconds'
),
insert_delete_component_pairs AS (
  SELECT 
    a1.id as insert_id, 
    a2.id as delete_id
  FROM set_components_audit a1
  JOIN set_components_audit a2 
    ON a1.set_component_id = a2.set_component_id 
    AND a1.service_set_id = a2.service_set_id
    AND a1.action = 'INSERT' 
    AND a2.action = 'DELETE'
    AND a2.created_at BETWEEN a1.created_at AND a1.created_at + interval '10 seconds'
)
-- Delete from set_songs_audit
DELETE FROM set_songs_audit 
WHERE id IN (
  SELECT delete_id FROM delete_insert_song_pairs
  UNION SELECT insert_id FROM delete_insert_song_pairs
  UNION SELECT insert_id FROM insert_delete_song_pairs
  UNION SELECT delete_id FROM insert_delete_song_pairs
);

-- Delete from set_components_audit (separate statement needed)
WITH delete_insert_component_pairs AS (
  SELECT 
    a1.id as delete_id, 
    a2.id as insert_id
  FROM set_components_audit a1
  JOIN set_components_audit a2 
    ON a1.set_component_id = a2.set_component_id 
    AND a1.service_set_id = a2.service_set_id
    AND a1.action = 'DELETE' 
    AND a2.action = 'INSERT'
    AND a2.created_at BETWEEN a1.created_at AND a1.created_at + interval '10 seconds'
),
insert_delete_component_pairs AS (
  SELECT 
    a1.id as insert_id, 
    a2.id as delete_id
  FROM set_components_audit a1
  JOIN set_components_audit a2 
    ON a1.set_component_id = a2.set_component_id 
    AND a1.service_set_id = a2.service_set_id
    AND a1.action = 'INSERT' 
    AND a2.action = 'DELETE'
    AND a2.created_at BETWEEN a1.created_at AND a1.created_at + interval '10 seconds'
)
DELETE FROM set_components_audit 
WHERE id IN (
  SELECT delete_id FROM delete_insert_component_pairs
  UNION SELECT insert_id FROM delete_insert_component_pairs
  UNION SELECT insert_id FROM insert_delete_component_pairs
  UNION SELECT delete_id FROM insert_delete_component_pairs
);
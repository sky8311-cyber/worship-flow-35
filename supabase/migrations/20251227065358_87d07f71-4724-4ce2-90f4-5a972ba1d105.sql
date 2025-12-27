-- Solution B: Improve audit triggers to ignore position-only changes
-- Solution C: Clean up existing duplicate audit records

-- B-1: Update audit_set_song_changes() to ignore position-only changes
CREATE OR REPLACE FUNCTION public.audit_set_song_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  changed_fields_json JSONB;
  old_json JSONB;
  new_json JSONB;
  field_count INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.set_songs_audit (set_song_id, service_set_id, song_id, user_id, action, new_values)
    VALUES (NEW.id, NEW.service_set_id, NEW.song_id, auth.uid(), 'INSERT', to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    old_json := to_jsonb(OLD);
    new_json := to_jsonb(NEW);
    
    SELECT jsonb_object_agg(key, new_json->key)
    INTO changed_fields_json
    FROM jsonb_each(new_json)
    WHERE key NOT IN ('created_at')
      AND (old_json->key IS DISTINCT FROM new_json->key);
    
    -- Count the number of changed fields
    SELECT COUNT(*) INTO field_count
    FROM jsonb_object_keys(COALESCE(changed_fields_json, '{}'::jsonb));
    
    -- Only log if there are actual changes AND it's not just a position-only change
    IF changed_fields_json IS NOT NULL 
       AND changed_fields_json != '{}'::jsonb
       AND NOT (field_count = 1 AND changed_fields_json ? 'position')
    THEN
      INSERT INTO public.set_songs_audit (set_song_id, service_set_id, song_id, user_id, action, old_values, new_values, changed_fields)
      VALUES (NEW.id, NEW.service_set_id, NEW.song_id, auth.uid(), 'UPDATE', old_json, new_json, changed_fields_json);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.set_songs_audit (set_song_id, service_set_id, song_id, user_id, action, old_values)
    VALUES (OLD.id, OLD.service_set_id, OLD.song_id, auth.uid(), 'DELETE', to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- B-2: Update audit_set_component_changes() to ignore position-only changes
CREATE OR REPLACE FUNCTION public.audit_set_component_changes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  changed_fields_json JSONB;
  old_json JSONB;
  new_json JSONB;
  field_count INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.set_components_audit (set_component_id, service_set_id, user_id, action, new_values)
    VALUES (NEW.id, NEW.service_set_id, auth.uid(), 'INSERT', to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    old_json := to_jsonb(OLD);
    new_json := to_jsonb(NEW);
    
    SELECT jsonb_object_agg(key, new_json->key)
    INTO changed_fields_json
    FROM jsonb_each(new_json)
    WHERE key NOT IN ('created_at')
      AND (old_json->key IS DISTINCT FROM new_json->key);
    
    -- Count the number of changed fields
    SELECT COUNT(*) INTO field_count
    FROM jsonb_object_keys(COALESCE(changed_fields_json, '{}'::jsonb));
    
    -- Only log if there are actual changes AND it's not just a position-only change
    IF changed_fields_json IS NOT NULL 
       AND changed_fields_json != '{}'::jsonb
       AND NOT (field_count = 1 AND changed_fields_json ? 'position')
    THEN
      INSERT INTO public.set_components_audit (set_component_id, service_set_id, user_id, action, old_values, new_values, changed_fields)
      VALUES (NEW.id, NEW.service_set_id, auth.uid(), 'UPDATE', old_json, new_json, changed_fields_json);
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.set_components_audit (set_component_id, service_set_id, user_id, action, old_values)
    VALUES (OLD.id, OLD.service_set_id, auth.uid(), 'DELETE', to_jsonb(OLD));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$function$;

-- C: Clean up existing duplicate audit records
-- Delete position-only UPDATE records
DELETE FROM set_songs_audit
WHERE action = 'UPDATE'
  AND changed_fields IS NOT NULL
  AND (SELECT COUNT(*) FROM jsonb_object_keys(changed_fields)) = 1
  AND changed_fields ? 'position';

DELETE FROM set_components_audit
WHERE action = 'UPDATE'
  AND changed_fields IS NOT NULL
  AND (SELECT COUNT(*) FROM jsonb_object_keys(changed_fields)) = 1
  AND changed_fields ? 'position';

-- Delete redundant INSERT/DELETE pairs (same song_id, same set, within 5 seconds)
-- Keep only the first INSERT for each song_id + service_set_id combination
WITH ranked_inserts AS (
  SELECT id,
         service_set_id,
         song_id,
         created_at,
         ROW_NUMBER() OVER (
           PARTITION BY service_set_id, song_id 
           ORDER BY created_at ASC
         ) as rn
  FROM set_songs_audit
  WHERE action = 'INSERT'
)
DELETE FROM set_songs_audit
WHERE id IN (
  SELECT id FROM ranked_inserts WHERE rn > 1
);

-- Delete orphaned DELETE records that came from auto-save cycles
-- (DELETEs that have a matching INSERT within 10 seconds for the same song_id + set)
DELETE FROM set_songs_audit d
WHERE d.action = 'DELETE'
  AND EXISTS (
    SELECT 1 FROM set_songs_audit i
    WHERE i.action = 'INSERT'
      AND i.service_set_id = d.service_set_id
      AND i.song_id = d.song_id
      AND i.created_at > d.created_at
      AND i.created_at < d.created_at + INTERVAL '30 seconds'
  );

-- Same cleanup for components
WITH ranked_component_inserts AS (
  SELECT id,
         service_set_id,
         set_component_id,
         created_at,
         ROW_NUMBER() OVER (
           PARTITION BY service_set_id, set_component_id 
           ORDER BY created_at ASC
         ) as rn
  FROM set_components_audit
  WHERE action = 'INSERT'
)
DELETE FROM set_components_audit
WHERE id IN (
  SELECT id FROM ranked_component_inserts WHERE rn > 1
);
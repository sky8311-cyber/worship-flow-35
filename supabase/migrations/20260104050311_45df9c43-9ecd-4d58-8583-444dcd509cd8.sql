-- 1. Restore original created_by from audit logs for any sets that were incorrectly modified
-- Find the original creator from the INSERT action in service_sets_audit
WITH original_creators AS (
  SELECT DISTINCT ON (service_set_id)
    service_set_id,
    (new_values->>'created_by')::uuid as original_created_by
  FROM service_sets_audit
  WHERE action = 'INSERT'
    AND new_values->>'created_by' IS NOT NULL
  ORDER BY service_set_id, created_at ASC
)
UPDATE service_sets ss
SET created_by = oc.original_created_by
FROM original_creators oc
WHERE ss.id = oc.service_set_id
  AND ss.created_by IS DISTINCT FROM oc.original_created_by;

-- 2. Create trigger function to prevent created_by from being changed
CREATE OR REPLACE FUNCTION public.prevent_created_by_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If created_by is being changed and OLD.created_by was not null, reject the change
  IF OLD.created_by IS NOT NULL AND OLD.created_by IS DISTINCT FROM NEW.created_by THEN
    RAISE EXCEPTION 'Cannot change created_by field. Original creator: %, attempted change to: %', OLD.created_by, NEW.created_by;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Create trigger on service_sets table
DROP TRIGGER IF EXISTS prevent_service_set_created_by_change ON service_sets;
CREATE TRIGGER prevent_service_set_created_by_change
  BEFORE UPDATE ON service_sets
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_created_by_change();

-- 4. Add RLS policy to allow deletion of expired edit locks by any authenticated user
DROP POLICY IF EXISTS "Anyone can delete expired locks" ON set_edit_locks;
CREATE POLICY "Anyone can delete expired locks"
  ON set_edit_locks FOR DELETE
  TO authenticated
  USING (expires_at < NOW());

-- 5. Clean up currently expired edit locks
DELETE FROM set_edit_locks WHERE expires_at < NOW();
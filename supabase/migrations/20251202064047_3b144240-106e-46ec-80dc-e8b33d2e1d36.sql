-- Add view_count column to service_sets
ALTER TABLE service_sets ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Create function to increment view count
CREATE OR REPLACE FUNCTION public.increment_set_view_count(set_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE service_sets 
  SET view_count = COALESCE(view_count, 0) + 1 
  WHERE id = set_id;
END;
$$;

-- Update RLS policy to allow cross-community viewing of published sets
DROP POLICY IF EXISTS "View service sets" ON service_sets;

CREATE POLICY "View service sets" 
ON service_sets 
FOR SELECT 
USING (
  -- Same community members can see all sets
  (is_community_member(auth.uid(), community_id))
  OR 
  -- Published sets visible to all authenticated users (cross-community reference)
  ((status = 'published') AND (auth.uid() IS NOT NULL))
  OR 
  -- Admins see everything
  is_admin(auth.uid())
);
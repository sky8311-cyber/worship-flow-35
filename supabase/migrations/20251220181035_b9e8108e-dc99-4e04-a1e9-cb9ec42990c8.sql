-- Drop the old SELECT policy that incorrectly allows community members to view drafts
DROP POLICY IF EXISTS "View service sets" ON public.service_sets;
-- Allow authenticated users to view profiles of community leaders
CREATE POLICY "Can view community leader profiles"
ON public.profiles FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  id IN (SELECT leader_id FROM public.worship_communities WHERE is_active = true)
);

-- Allow authenticated users to count members of any active community
CREATE POLICY "Can count community members"
ON public.community_members FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  community_id IN (SELECT id FROM public.worship_communities WHERE is_active = true)
);
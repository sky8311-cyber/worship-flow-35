-- Fix critical security issues for set_songs and profiles tables

-- ============================================================================
-- FIX 1: Restrict set_songs access to owners and collaborators only
-- ============================================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Enable all access for set_songs" ON public.set_songs;

-- Allow viewing set songs for owners, collaborators, and community members viewing published sets
CREATE POLICY "View set songs"
ON public.set_songs FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.service_sets ss
    LEFT JOIN public.community_members cm ON cm.community_id = ss.community_id
    WHERE ss.id = set_songs.service_set_id
      AND (
        ss.created_by = auth.uid()
        OR cm.user_id = auth.uid()
        OR is_set_collaborator(auth.uid(), ss.id)
        OR (ss.is_public = true AND ss.status = 'published')
      )
  )
);

-- Restrict INSERT to set owners, collaborators, and admins only
CREATE POLICY "Insert set songs"
ON public.set_songs FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.service_sets ss
    WHERE ss.id = set_songs.service_set_id
      AND (
        ss.created_by = auth.uid()
        OR is_set_collaborator(auth.uid(), ss.id)
        OR is_admin(auth.uid())
      )
  )
);

-- Restrict UPDATE to set owners, collaborators, and admins only
CREATE POLICY "Update set songs"
ON public.set_songs FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.service_sets ss
    WHERE ss.id = set_songs.service_set_id
      AND (
        ss.created_by = auth.uid()
        OR is_set_collaborator(auth.uid(), ss.id)
        OR is_admin(auth.uid())
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.service_sets ss
    WHERE ss.id = set_songs.service_set_id
      AND (
        ss.created_by = auth.uid()
        OR is_set_collaborator(auth.uid(), ss.id)
        OR is_admin(auth.uid())
      )
  )
);

-- Restrict DELETE to set owners, collaborators, and admins only
CREATE POLICY "Delete set songs"
ON public.set_songs FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.service_sets ss
    WHERE ss.id = set_songs.service_set_id
      AND (
        ss.created_by = auth.uid()
        OR is_set_collaborator(auth.uid(), ss.id)
        OR is_admin(auth.uid())
      )
  )
);

-- ============================================================================
-- FIX 2: Limit profiles visibility to community members only
-- ============================================================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view profiles" ON public.profiles;

-- Allow users to view their own profile and profiles of people in their communities
CREATE POLICY "Users can view profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  auth.uid() = id OR
  EXISTS (
    SELECT 1 FROM public.community_members cm1
    JOIN public.community_members cm2 ON cm1.community_id = cm2.community_id
    WHERE cm1.user_id = auth.uid()
      AND cm2.user_id = profiles.id
  )
);
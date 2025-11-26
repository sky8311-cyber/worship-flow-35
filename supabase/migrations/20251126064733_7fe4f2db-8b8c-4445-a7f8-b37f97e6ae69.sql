-- Create security definer function to check community membership without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.shares_community_membership(_user_id uuid, _target_community_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.community_members
    WHERE user_id = _user_id 
      AND community_id = _target_community_id
  )
$$;

-- Drop the broken policy that causes infinite recursion
DROP POLICY IF EXISTS "View community members" ON community_members;

-- Recreate policy using security definer function to prevent recursion
CREATE POLICY "View community members"
ON community_members
FOR SELECT
USING (
  -- User can see their own membership
  (user_id = auth.uid())
  OR 
  -- User is a leader and can see all members
  (EXISTS (
    SELECT 1 FROM worship_communities wc
    WHERE wc.id = community_members.community_id 
    AND wc.leader_id = auth.uid()
  ))
  OR
  -- User is a member of the same community (using security definer function to avoid recursion)
  shares_community_membership(auth.uid(), community_id)
);
-- Update RLS policies for community_invitations to allow managers to manage invitations

-- Drop existing policies
DROP POLICY IF EXISTS "Leaders can create invitations" ON public.community_invitations;
DROP POLICY IF EXISTS "Leaders can view invitations" ON public.community_invitations;

-- Policy for creating invitations (admins, community owners, community leaders)
CREATE POLICY "Managers can create invitations"
ON public.community_invitations
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.worship_communities wc
    WHERE wc.id = community_invitations.community_id
    AND wc.leader_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.community_members cm
    WHERE cm.community_id = community_invitations.community_id
    AND cm.user_id = auth.uid()
    AND cm.role = 'community_leader'
  )
);

-- Policy for viewing invitations (admins, community owners, community leaders)
CREATE POLICY "Managers can view invitations"
ON public.community_invitations
FOR SELECT
TO authenticated
USING (
  is_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.worship_communities wc
    WHERE wc.id = community_invitations.community_id
    AND wc.leader_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.community_members cm
    WHERE cm.community_id = community_invitations.community_id
    AND cm.user_id = auth.uid()
    AND cm.role = 'community_leader'
  )
);

-- Policy for updating invitations (for resend functionality)
CREATE POLICY "Managers can update invitations"
ON public.community_invitations
FOR UPDATE
TO authenticated
USING (
  is_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.worship_communities wc
    WHERE wc.id = community_invitations.community_id
    AND wc.leader_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.community_members cm
    WHERE cm.community_id = community_invitations.community_id
    AND cm.user_id = auth.uid()
    AND cm.role = 'community_leader'
  )
);

-- Policy for deleting invitations (for cancel functionality)
CREATE POLICY "Managers can delete invitations"
ON public.community_invitations
FOR DELETE
TO authenticated
USING (
  is_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.worship_communities wc
    WHERE wc.id = community_invitations.community_id
    AND wc.leader_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.community_members cm
    WHERE cm.community_id = community_invitations.community_id
    AND cm.user_id = auth.uid()
    AND cm.role = 'community_leader'
  )
);
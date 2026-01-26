-- Fix accept_invitation: Add email verification to prevent unauthorized acceptance
CREATE OR REPLACE FUNCTION public.accept_invitation(invitation_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation_email TEXT;
  v_user_email TEXT;
BEGIN
  -- Get invitation email
  SELECT email INTO v_invitation_email
  FROM community_invitations
  WHERE id = invitation_uuid AND status = 'pending';
  
  IF v_invitation_email IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get current user's email from auth.users
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = auth.uid();
  
  -- Verify email matches (case-insensitive comparison)
  IF LOWER(v_user_email) != LOWER(v_invitation_email) THEN
    RAISE EXCEPTION 'Unauthorized: invitation not for this user';
  END IF;
  
  UPDATE community_invitations
  SET status = 'accepted'
  WHERE id = invitation_uuid AND status = 'pending';
  
  RETURN FOUND;
END;
$$;

-- Fix decline_invitation: Add email verification to prevent unauthorized decline
CREATE OR REPLACE FUNCTION public.decline_invitation(invitation_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invitation_email TEXT;
  v_user_email TEXT;
BEGIN
  -- Get invitation email
  SELECT email INTO v_invitation_email
  FROM community_invitations
  WHERE id = invitation_uuid AND status = 'pending';
  
  IF v_invitation_email IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get current user's email from auth.users
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = auth.uid();
  
  -- Verify email matches (case-insensitive comparison)
  IF LOWER(v_user_email) != LOWER(v_invitation_email) THEN
    RAISE EXCEPTION 'Unauthorized: invitation not for this user';
  END IF;
  
  UPDATE community_invitations
  SET status = 'declined'
  WHERE id = invitation_uuid AND status = 'pending';
  
  RETURN FOUND;
END;
$$;

-- Restrict set_edit_locks visibility to users who have access to the specific service set
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can read edit locks" ON set_edit_locks;

-- Create a more restrictive policy
CREATE POLICY "Users can read locks for sets they have access to"
ON set_edit_locks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM service_sets ss
    WHERE ss.id = set_edit_locks.set_id
    AND (
      -- Creator can see locks
      ss.created_by = auth.uid()
      -- Collaborators can see locks
      OR is_set_collaborator(auth.uid(), ss.id)
      -- Community members can see locks for published sets
      OR (ss.status = 'published' AND is_community_member(auth.uid(), ss.community_id))
      -- Community leaders can see locks
      OR is_community_leader(auth.uid(), ss.community_id)
    )
  )
);
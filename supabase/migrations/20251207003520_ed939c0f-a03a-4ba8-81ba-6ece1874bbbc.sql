-- Create SECURITY DEFINER function to decline invitations (bypasses RLS)
CREATE OR REPLACE FUNCTION public.decline_invitation(invitation_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE community_invitations
  SET status = 'declined'
  WHERE id = invitation_uuid
    AND status = 'pending';
  
  RETURN FOUND;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.decline_invitation(UUID) TO authenticated;
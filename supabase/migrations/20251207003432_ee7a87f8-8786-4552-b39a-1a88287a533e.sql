-- Create SECURITY DEFINER function to accept invitations (bypasses RLS)
CREATE OR REPLACE FUNCTION public.accept_invitation(invitation_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE community_invitations
  SET status = 'accepted'
  WHERE id = invitation_uuid
    AND status = 'pending';
  
  RETURN FOUND;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.accept_invitation(UUID) TO authenticated;

-- Enable real-time for community_members table
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_members;

-- Enable real-time for community_invitations table
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_invitations;
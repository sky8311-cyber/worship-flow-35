-- Create a SECURITY DEFINER function to fetch invitation details (bypasses RLS for unauthenticated users)
CREATE OR REPLACE FUNCTION public.get_invitation_by_id(invitation_uuid UUID)
RETURNS TABLE (
  id UUID,
  email TEXT,
  community_id UUID,
  invited_by UUID,
  status TEXT,
  created_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  role TEXT
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ci.id, ci.email, ci.community_id, ci.invited_by, 
    ci.status, ci.created_at, ci.expires_at, ci.role
  FROM community_invitations ci
  WHERE ci.id = invitation_uuid;
END;
$$;

-- Grant execute permission to unauthenticated users (anon role)
GRANT EXECUTE ON FUNCTION public.get_invitation_by_id(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_invitation_by_id(UUID) TO authenticated;
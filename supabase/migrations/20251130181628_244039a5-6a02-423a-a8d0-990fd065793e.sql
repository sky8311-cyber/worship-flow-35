
-- Add permission_level to church_custom_roles
ALTER TABLE public.church_custom_roles 
ADD COLUMN IF NOT EXISTS permission_level text DEFAULT 'view_only';

-- Add community_id to team_rotation_schedules (make church_account_id nullable for transition)
ALTER TABLE public.team_rotation_schedules 
ADD COLUMN IF NOT EXISTS community_id uuid REFERENCES public.worship_communities(id) ON DELETE CASCADE;

-- Create role assignments table (assigns roles to specific members in specific communities)
CREATE TABLE IF NOT EXISTS public.church_role_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES public.church_custom_roles(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  community_id uuid NOT NULL REFERENCES public.worship_communities(id) ON DELETE CASCADE,
  assigned_by uuid REFERENCES public.profiles(id),
  assigned_at timestamptz DEFAULT now(),
  UNIQUE(role_id, user_id, community_id)
);

-- Create role community visibility table (which communities can see/use this role)
CREATE TABLE IF NOT EXISTS public.church_role_communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid NOT NULL REFERENCES public.church_custom_roles(id) ON DELETE CASCADE,
  community_id uuid NOT NULL REFERENCES public.worship_communities(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(role_id, community_id)
);

-- Enable RLS on new tables
ALTER TABLE public.church_role_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.church_role_communities ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user can manage role assignments
CREATE OR REPLACE FUNCTION public.can_manage_church_roles(_user_id uuid, _church_account_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT is_church_account_admin(_user_id, _church_account_id)
$$;

-- RLS policies for church_role_assignments
CREATE POLICY "Church admins can manage role assignments"
ON public.church_role_assignments
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM church_custom_roles ccr
    WHERE ccr.id = church_role_assignments.role_id
    AND is_church_account_admin(auth.uid(), ccr.church_account_id)
  )
);

CREATE POLICY "Users can view their own role assignments"
ON public.church_role_assignments
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Community members can view role assignments in their community"
ON public.church_role_assignments
FOR SELECT
USING (is_community_member(auth.uid(), community_id));

-- RLS policies for church_role_communities
CREATE POLICY "Church admins can manage role community visibility"
ON public.church_role_communities
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM church_custom_roles ccr
    WHERE ccr.id = church_role_communities.role_id
    AND is_church_account_admin(auth.uid(), ccr.church_account_id)
  )
);

CREATE POLICY "Community members can view role visibility"
ON public.church_role_communities
FOR SELECT
USING (is_community_member(auth.uid(), community_id));

-- Update team_rotation_schedules RLS to support community-based access
DROP POLICY IF EXISTS "Church admins can manage rotation schedules" ON public.team_rotation_schedules;
DROP POLICY IF EXISTS "Church members can view rotation schedules" ON public.team_rotation_schedules;

CREATE POLICY "Admins can manage rotation schedules"
ON public.team_rotation_schedules
FOR ALL
USING (
  is_church_account_admin(auth.uid(), church_account_id) 
  OR (community_id IS NOT NULL AND is_community_leader(auth.uid(), community_id))
);

CREATE POLICY "Members can view rotation schedules"
ON public.team_rotation_schedules
FOR SELECT
USING (
  is_church_account_member(auth.uid(), church_account_id)
  OR (community_id IS NOT NULL AND is_community_member(auth.uid(), community_id))
);

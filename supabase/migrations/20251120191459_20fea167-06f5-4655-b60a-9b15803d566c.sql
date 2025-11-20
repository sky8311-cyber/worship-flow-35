-- Part 1: Create security definer functions to break RLS recursion

-- Function 1: Check if user is a collaborator on a specific set
CREATE OR REPLACE FUNCTION public.is_set_collaborator(_user_id uuid, _set_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.set_collaborators
    WHERE user_id = _user_id 
      AND service_set_id = _set_id
  )
$$;

-- Function 2: Check if user is a community member
CREATE OR REPLACE FUNCTION public.is_community_member(_user_id uuid, _community_id uuid)
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
      AND community_id = _community_id
  )
$$;

-- Part 2: Rewrite service_sets RLS policies to use security definer functions

-- Drop existing policies
DROP POLICY IF EXISTS "View service sets" ON public.service_sets;
DROP POLICY IF EXISTS "Update service sets" ON public.service_sets;

-- Recreate View policy with security definer functions
CREATE POLICY "View service sets" ON public.service_sets
FOR SELECT
USING (
  -- Published sets: public OR community member OR admin
  (
    status = 'published' 
    AND (
      is_public = true 
      OR is_admin(auth.uid()) 
      OR is_community_member(auth.uid(), community_id)
    )
  )
  OR
  -- Draft sets: creator OR collaborator OR admin
  (
    status = 'draft' 
    AND (
      created_by = auth.uid() 
      OR is_admin(auth.uid()) 
      OR is_set_collaborator(auth.uid(), id)
    )
  )
);

-- Recreate Update policy with security definer functions
CREATE POLICY "Update service sets" ON public.service_sets
FOR UPDATE
USING (
  created_by = auth.uid() 
  OR is_admin(auth.uid()) 
  OR is_set_collaborator(auth.uid(), id)
);
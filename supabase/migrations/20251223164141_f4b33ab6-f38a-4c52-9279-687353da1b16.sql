-- Step 1: Migrate existing leader_id users to community_members with 'owner' role
-- Insert or update existing community leaders as owners
INSERT INTO public.community_members (community_id, user_id, role, joined_at)
SELECT wc.id, wc.leader_id, 'owner', COALESCE(wc.created_at, now())
FROM public.worship_communities wc
WHERE wc.leader_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.community_members cm 
    WHERE cm.community_id = wc.id AND cm.user_id = wc.leader_id
  );

-- Update existing members who are leaders to have 'owner' role
UPDATE public.community_members cm
SET role = 'owner'
FROM public.worship_communities wc
WHERE cm.community_id = wc.id 
  AND cm.user_id = wc.leader_id
  AND cm.role != 'owner';

-- Step 2: Create helper function to check if user is community owner
CREATE OR REPLACE FUNCTION public.is_community_owner(_user_id uuid, _community_id uuid)
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
      AND role = 'owner'
  )
$$;

-- Step 3: Update RLS policy for worship_communities deletion
-- Drop existing delete policy if exists
DROP POLICY IF EXISTS "Leaders can delete own communities" ON public.worship_communities;
DROP POLICY IF EXISTS "Owners can delete communities" ON public.worship_communities;

-- Create new policy allowing only owners to delete
CREATE POLICY "Owners can delete communities" 
ON public.worship_communities 
FOR DELETE 
TO authenticated
USING (
  is_community_owner(auth.uid(), id) OR is_admin(auth.uid())
);

-- Step 4: Update RLS policies for community management to use owner role
-- Update community_members delete policy to include owner check
DROP POLICY IF EXISTS "Leaders, community leaders, and self can remove members" ON public.community_members;

CREATE POLICY "Leaders, community leaders, owners, and self can remove members" 
ON public.community_members 
FOR DELETE 
TO authenticated
USING (
  (auth.uid() = user_id) OR 
  is_community_owner(auth.uid(), community_id) OR
  is_community_leader(auth.uid(), community_id) OR
  (EXISTS (
    SELECT 1 FROM worship_communities wc
    WHERE wc.id = community_members.community_id AND wc.leader_id = auth.uid()
  )) OR 
  is_admin(auth.uid())
);

-- Update community_members update policy to include owner check
DROP POLICY IF EXISTS "Leaders and admins can update members" ON public.community_members;

CREATE POLICY "Leaders, owners, and admins can update members" 
ON public.community_members 
FOR UPDATE 
TO authenticated
USING (
  is_community_owner(auth.uid(), community_id) OR
  is_community_leader(auth.uid(), community_id) OR
  (EXISTS (
    SELECT 1 FROM worship_communities wc
    WHERE wc.id = community_members.community_id AND wc.leader_id = auth.uid()
  )) OR 
  is_admin(auth.uid())
)
WITH CHECK (
  is_community_owner(auth.uid(), community_id) OR
  is_community_leader(auth.uid(), community_id) OR
  (EXISTS (
    SELECT 1 FROM worship_communities wc
    WHERE wc.id = community_members.community_id AND wc.leader_id = auth.uid()
  )) OR 
  is_admin(auth.uid())
);
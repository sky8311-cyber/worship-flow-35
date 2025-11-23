-- Add RLS policy for admins to view all profiles
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (
  is_admin(auth.uid()) OR 
  (auth.uid() = id) OR 
  (EXISTS ( 
    SELECT 1
    FROM (community_members cm1
      JOIN community_members cm2 ON ((cm1.community_id = cm2.community_id)))
    WHERE ((cm1.user_id = auth.uid()) AND (cm2.user_id = profiles.id))
  ))
);
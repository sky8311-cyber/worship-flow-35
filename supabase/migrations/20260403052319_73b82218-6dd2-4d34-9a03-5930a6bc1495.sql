
-- 1. Fix user_roles INSERT policy: remove auth.uid() IS NULL branch
DROP POLICY IF EXISTS "Users can insert own worship leader role" ON public.user_roles;
CREATE POLICY "Users can insert own worship leader role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  is_admin(auth.uid()) 
  OR (auth.uid() = user_id AND role = 'worship_leader')
);

-- 2. Fix user_seeds: remove the dangerous "System can manage seeds" ALL policy
DROP POLICY IF EXISTS "System can manage seeds" ON public.user_seeds;

-- 3. Fix user_seeds: restrict SELECT to authenticated users only
DROP POLICY IF EXISTS "Users can view all seed data" ON public.user_seeds;
CREATE POLICY "Users can view all seed data"
ON public.user_seeds
FOR SELECT
TO authenticated
USING (true);

-- 4. Fix rewards_milestones: remove the public ALL policy
DROP POLICY IF EXISTS "Service role can manage all milestones" ON public.rewards_milestones;

-- 5. Fix page_analytics: fix the self-referential UPDATE condition
DROP POLICY IF EXISTS "Users can update own session analytics" ON public.page_analytics;
CREATE POLICY "Users can update own session analytics"
ON public.page_analytics
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

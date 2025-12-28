-- Drop existing INSERT policy on user_roles
DROP POLICY IF EXISTS "Admins and system can insert roles" ON public.user_roles;

-- Create new INSERT policy allowing self-insert for worship_leader role during auto-approve
CREATE POLICY "Admins and system can insert roles" ON public.user_roles
  FOR INSERT
  WITH CHECK (
    public.is_admin(auth.uid())  -- Admins can insert any role
    OR (auth.uid() IS NULL)  -- System can insert
    OR (auth.uid() = user_id AND role = 'worship_leader')  -- Users can add worship_leader to themselves (auto-approve)
  );
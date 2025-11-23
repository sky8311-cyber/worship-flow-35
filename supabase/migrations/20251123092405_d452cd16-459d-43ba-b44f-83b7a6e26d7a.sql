-- Fix RLS so backend trigger and admins can insert roles/profiles safely

-- 1) Clean up previous backend-only policies
DROP POLICY IF EXISTS "System can assign default roles" ON public.user_roles;
DROP POLICY IF EXISTS "System can create profiles" ON public.profiles;

-- Also refine existing admin policy to separate INSERT from other commands
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

-- 2) Recreate admin policies for non-INSERT commands (USING is allowed here)
CREATE POLICY "Admins can manage roles select"
ON public.user_roles
FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage roles update"
ON public.user_roles
FOR UPDATE
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can manage roles delete"
ON public.user_roles
FOR DELETE
USING (is_admin(auth.uid()));

-- 3) INSERT policies must use WITH CHECK (per engine error)
-- Allow admins and backend trigger (auth.uid() IS NULL) to insert roles
CREATE POLICY "Admins and system can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (is_admin(auth.uid()) OR auth.uid() IS NULL);

-- 4) Backend-only INSERT for profiles during signup trigger
CREATE POLICY "System can create profiles"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() IS NULL);
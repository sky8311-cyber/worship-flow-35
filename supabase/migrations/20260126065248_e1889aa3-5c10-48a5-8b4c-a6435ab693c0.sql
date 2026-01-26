-- Drop existing policy if exists and recreate with correct SELECT permission
DROP POLICY IF EXISTS "Admins can manage automated email settings" ON public.automated_email_settings;

-- Create separate policies for SELECT, INSERT, UPDATE, DELETE
CREATE POLICY "Admins can read automated email settings"
ON public.automated_email_settings FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can insert automated email settings"
ON public.automated_email_settings FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can update automated email settings"
ON public.automated_email_settings FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can delete automated email settings"
ON public.automated_email_settings FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Also add RLS policy for automated_email_log so admins can read logs
DROP POLICY IF EXISTS "Admins can read automated email log" ON public.automated_email_log;

CREATE POLICY "Admins can read automated email log"
ON public.automated_email_log FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
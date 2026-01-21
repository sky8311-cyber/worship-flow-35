-- Add RLS policy for admins to create support conversations for any user
CREATE POLICY "Admins can create support conversations"
ON public.support_conversations
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);
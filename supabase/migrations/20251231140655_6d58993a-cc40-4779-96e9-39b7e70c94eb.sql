-- Backfill missing worship_leader roles for approved applications
-- This inserts the role only if it doesn't already exist

INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT wla.user_id, 'worship_leader'::app_role
FROM public.worship_leader_applications wla
WHERE wla.status = 'approved'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = wla.user_id
      AND ur.role = 'worship_leader'
  );
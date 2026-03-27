
-- 1. Fix event_reminder_log: Remove overly permissive ALL policy, add user-scoped SELECT
DROP POLICY IF EXISTS "Service role can manage reminder logs" ON public.event_reminder_log;

CREATE POLICY "Users can view own reminder logs"
ON public.event_reminder_log
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 2. Fix seed_transactions: Replace public-facing SELECT with authenticated + own-user scope
DROP POLICY IF EXISTS "Users can view all transactions" ON public.seed_transactions;

CREATE POLICY "Users can view own transactions"
ON public.seed_transactions
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

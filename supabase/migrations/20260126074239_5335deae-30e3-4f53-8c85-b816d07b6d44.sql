-- Backfill last_active_at from auth.users.last_sign_in_at for existing users
-- This fixes NULL values for users who logged in before the tracking was improved
UPDATE profiles p
SET last_active_at = au.last_sign_in_at
FROM auth.users au
WHERE p.id = au.id
  AND p.last_active_at IS NULL
  AND au.last_sign_in_at IS NOT NULL;
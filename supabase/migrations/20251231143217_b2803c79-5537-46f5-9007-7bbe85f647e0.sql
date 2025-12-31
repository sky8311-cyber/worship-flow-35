-- Add 'cancelled' as a valid status for worship_leader_applications
-- This prevents the sync function from re-adding the role after cancellation

-- First, let's check the current constraint and update it
-- The status column uses a CHECK constraint, we need to add 'cancelled' to it

ALTER TABLE public.worship_leader_applications 
DROP CONSTRAINT IF EXISTS worship_leader_applications_status_check;

ALTER TABLE public.worship_leader_applications 
ADD CONSTRAINT worship_leader_applications_status_check 
CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled'));
-- Prevent duplicate pending applications per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_worship_leader_applications_pending_unique 
ON worship_leader_applications (user_id) 
WHERE status = 'pending';
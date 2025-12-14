-- Add columns for public share functionality
ALTER TABLE service_sets 
ADD COLUMN IF NOT EXISTS public_share_token TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS public_share_enabled BOOLEAN DEFAULT false;

-- Create index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_service_sets_public_share_token 
ON service_sets(public_share_token) 
WHERE public_share_token IS NOT NULL;
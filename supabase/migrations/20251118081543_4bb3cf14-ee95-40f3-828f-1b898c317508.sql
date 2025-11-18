-- Add invite_token column to worship_communities
ALTER TABLE worship_communities 
ADD COLUMN invite_token TEXT UNIQUE;

-- Generate unique tokens for existing communities using hex encoding
UPDATE worship_communities 
SET invite_token = encode(gen_random_bytes(16), 'hex')
WHERE invite_token IS NULL;

-- Create index for fast lookups
CREATE INDEX idx_worship_communities_invite_token 
ON worship_communities(invite_token);

-- Make it required
ALTER TABLE worship_communities 
ALTER COLUMN invite_token SET NOT NULL;

-- Set default for new communities
ALTER TABLE worship_communities 
ALTER COLUMN invite_token SET DEFAULT encode(gen_random_bytes(16), 'hex');
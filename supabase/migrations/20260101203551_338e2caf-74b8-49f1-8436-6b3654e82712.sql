-- Add store_enabled column to rewards_settings
ALTER TABLE rewards_settings 
ADD COLUMN IF NOT EXISTS store_enabled boolean DEFAULT true;

-- Update existing row
UPDATE rewards_settings SET store_enabled = true WHERE id = 1;
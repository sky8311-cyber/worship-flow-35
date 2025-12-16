-- Add worship leader columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS church_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS church_website TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS serving_position TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS years_serving INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS worship_leader_intro TEXT;

-- Migrate existing data from worship_leader_profiles to profiles
UPDATE profiles p
SET 
  church_name = wlp.church_name,
  church_website = wlp.church_website,
  country = wlp.country,
  serving_position = wlp.position,
  years_serving = wlp.years_serving,
  worship_leader_intro = wlp.introduction
FROM worship_leader_profiles wlp
WHERE p.id = wlp.user_id;
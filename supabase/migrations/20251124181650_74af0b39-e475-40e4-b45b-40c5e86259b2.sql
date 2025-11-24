-- Add three new required columns to worship_leader_applications table
ALTER TABLE worship_leader_applications
ADD COLUMN church_website TEXT NOT NULL DEFAULT '',
ADD COLUMN denomination TEXT NOT NULL DEFAULT '',
ADD COLUMN country TEXT NOT NULL DEFAULT '';

-- Add three new required columns to worship_leader_profiles table
ALTER TABLE worship_leader_profiles
ADD COLUMN church_website TEXT NOT NULL DEFAULT '',
ADD COLUMN denomination TEXT NOT NULL DEFAULT '',
ADD COLUMN country TEXT NOT NULL DEFAULT '';

-- Remove default constraints after adding columns (to enforce required for new entries)
ALTER TABLE worship_leader_applications
ALTER COLUMN church_website DROP DEFAULT,
ALTER COLUMN denomination DROP DEFAULT,
ALTER COLUMN country DROP DEFAULT;

ALTER TABLE worship_leader_profiles
ALTER COLUMN church_website DROP DEFAULT,
ALTER COLUMN denomination DROP DEFAULT,
ALTER COLUMN country DROP DEFAULT;
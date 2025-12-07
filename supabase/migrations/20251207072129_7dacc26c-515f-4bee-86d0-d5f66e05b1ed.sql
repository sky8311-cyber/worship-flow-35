-- Make denomination columns nullable in both tables
ALTER TABLE worship_leader_applications 
ALTER COLUMN denomination DROP NOT NULL;

ALTER TABLE worship_leader_profiles 
ALTER COLUMN denomination DROP NOT NULL;
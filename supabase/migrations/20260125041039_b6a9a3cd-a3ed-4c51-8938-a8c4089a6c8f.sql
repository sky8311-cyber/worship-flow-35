-- Drop existing category check constraint and add new one including bugfix
ALTER TABLE public.platform_milestones 
DROP CONSTRAINT IF EXISTS platform_milestones_category_check;

ALTER TABLE public.platform_milestones 
ADD CONSTRAINT platform_milestones_category_check 
CHECK (category IN ('launch', 'feature', 'milestone', 'update', 'bugfix'));
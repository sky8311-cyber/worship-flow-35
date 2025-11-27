-- Make author_id/created_by columns nullable to retain content when users are deleted
ALTER TABLE public.community_posts ALTER COLUMN author_id DROP NOT NULL;
ALTER TABLE public.post_comments ALTER COLUMN author_id DROP NOT NULL;
ALTER TABLE public.calendar_events ALTER COLUMN created_by DROP NOT NULL;
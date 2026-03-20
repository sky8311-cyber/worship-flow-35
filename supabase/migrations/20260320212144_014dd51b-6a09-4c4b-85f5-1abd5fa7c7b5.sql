ALTER TABLE public.songs ADD COLUMN original_composer text DEFAULT NULL;
ALTER TABLE public.songs ADD COLUMN status text DEFAULT 'published' NOT NULL;
ALTER TABLE public.songs ADD COLUMN draft_step integer DEFAULT NULL;
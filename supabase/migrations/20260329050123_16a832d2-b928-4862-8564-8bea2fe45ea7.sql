ALTER TABLE public.space_blocks ADD COLUMN page_number integer NOT NULL DEFAULT 0;
ALTER TABLE public.studio_spaces ADD COLUMN page_count integer NOT NULL DEFAULT 2;
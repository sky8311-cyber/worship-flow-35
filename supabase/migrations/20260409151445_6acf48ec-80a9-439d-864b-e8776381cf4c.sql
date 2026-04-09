-- Add missing user_id foreign key (position_id already exists)
ALTER TABLE public.worship_set_signups
  ADD CONSTRAINT worship_set_signups_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Set scores bucket to private
UPDATE storage.buckets SET public = false WHERE id = 'scores';
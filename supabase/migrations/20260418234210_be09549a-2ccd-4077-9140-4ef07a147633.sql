-- 1. user_score_vault
CREATE TABLE IF NOT EXISTS public.user_score_vault (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  song_id uuid REFERENCES public.songs(id) ON DELETE SET NULL,
  score_url text NOT NULL,
  thumbnail_url text,
  musical_key text DEFAULT 'C',
  label text,
  pages_count int DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_score_vault_user ON public.user_score_vault(user_id);
CREATE INDEX IF NOT EXISTS idx_user_score_vault_user_song ON public.user_score_vault(user_id, song_id);

ALTER TABLE public.user_score_vault ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own vault" ON public.user_score_vault;
CREATE POLICY "own vault" ON public.user_score_vault
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. user_song_profiles
CREATE TABLE IF NOT EXISTS public.user_song_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  song_id uuid NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  preferred_key text,
  notes text,
  vault_score_ids uuid[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, song_id)
);

CREATE INDEX IF NOT EXISTS idx_user_song_profiles_user_song ON public.user_song_profiles(user_id, song_id);

ALTER TABLE public.user_song_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "own profiles" ON public.user_song_profiles;
CREATE POLICY "own profiles" ON public.user_song_profiles
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. service_sets columns
ALTER TABLE public.service_sets
  ADD COLUMN IF NOT EXISTS has_private_scores boolean NOT NULL DEFAULT false;

ALTER TABLE public.service_sets
  ADD COLUMN IF NOT EXISTS band_view_visibility text NOT NULL DEFAULT 'public';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'service_sets_band_view_visibility_check'
  ) THEN
    ALTER TABLE public.service_sets
      ADD CONSTRAINT service_sets_band_view_visibility_check
      CHECK (band_view_visibility IN ('public','team','link'));
  END IF;
END $$;

ALTER TABLE public.service_sets
  ADD COLUMN IF NOT EXISTS share_token uuid DEFAULT gen_random_uuid();

UPDATE public.service_sets SET share_token = gen_random_uuid() WHERE share_token IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_service_sets_share_token ON public.service_sets(share_token);

-- 4. set_song_scores column
ALTER TABLE public.set_song_scores
  ADD COLUMN IF NOT EXISTS vault_score_id uuid REFERENCES public.user_score_vault(id) ON DELETE SET NULL;

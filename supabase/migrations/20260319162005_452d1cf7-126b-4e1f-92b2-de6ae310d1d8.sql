CREATE TABLE IF NOT EXISTS public.user_curation_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  skills_summary text,
  congregation_notes text,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_curation_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own curation profile"
  ON public.user_curation_profiles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own curation profile"
  ON public.user_curation_profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own curation profile"
  ON public.user_curation_profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
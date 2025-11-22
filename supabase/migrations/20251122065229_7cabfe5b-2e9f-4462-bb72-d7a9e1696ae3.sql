-- Create user_favorite_songs table
CREATE TABLE IF NOT EXISTS public.user_favorite_songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  song_id uuid NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, song_id)
);

-- Enable RLS
ALTER TABLE public.user_favorite_songs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own favorites"
ON public.user_favorite_songs FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can add own favorites"
ON public.user_favorite_songs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove own favorites"
ON public.user_favorite_songs FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_user_favorite_songs_user_id ON public.user_favorite_songs(user_id);
CREATE INDEX idx_user_favorite_songs_song_id ON public.user_favorite_songs(song_id);
-- [1] songs.notes 컬럼 삭제
ALTER TABLE public.songs DROP COLUMN IF EXISTS notes;

-- [2] user_song_settings_history 테이블 생성
CREATE TABLE public.user_song_settings_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  bpm INTEGER,
  time_signature TEXT,
  energy_level INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_song_settings_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own history"
ON public.user_song_settings_history
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_user_song_settings_history_user_song_created
ON public.user_song_settings_history (user_id, song_id, created_at DESC);
-- 곡 라이브러리 테이블
CREATE TABLE IF NOT EXISTS public.songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  artist TEXT,
  language TEXT,
  default_key TEXT,
  bpm INTEGER,
  time_signature TEXT,
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 5),
  category TEXT,
  tags TEXT,
  youtube_url TEXT,
  score_file_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 예배 세트 테이블
CREATE TABLE IF NOT EXISTS public.service_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  service_name TEXT NOT NULL,
  worship_leader TEXT,
  band_name TEXT,
  theme TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 세트 내 곡 테이블
CREATE TABLE IF NOT EXISTS public.set_songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_set_id UUID NOT NULL REFERENCES public.service_sets(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES public.songs(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  key TEXT,
  custom_notes TEXT,
  override_score_file_url TEXT,
  override_youtube_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_set_songs_service_set ON public.set_songs(service_set_id);
CREATE INDEX IF NOT EXISTS idx_set_songs_song ON public.set_songs(song_id);
CREATE INDEX IF NOT EXISTS idx_service_sets_date ON public.service_sets(date);
CREATE INDEX IF NOT EXISTS idx_songs_title ON public.songs(title);

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 트리거
DROP TRIGGER IF EXISTS update_songs_updated_at ON public.songs;
CREATE TRIGGER update_songs_updated_at
  BEFORE UPDATE ON public.songs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_service_sets_updated_at ON public.service_sets;
CREATE TRIGGER update_service_sets_updated_at
  BEFORE UPDATE ON public.service_sets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for 악보 파일
INSERT INTO storage.buckets (id, name, public)
VALUES ('scores', 'scores', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS 정책 (public read, 모든 사람이 업로드 가능)
CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'scores');

CREATE POLICY "Anyone can upload scores"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'scores');

CREATE POLICY "Anyone can update their scores"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'scores');

CREATE POLICY "Anyone can delete scores"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'scores');

-- RLS 활성화 (나중에 인증 추가 시를 위해)
ALTER TABLE public.songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.set_songs ENABLE ROW LEVEL SECURITY;

-- 현재는 모든 사람이 모든 데이터에 접근 가능 (단일 사용자/교회 기준)
CREATE POLICY "Enable all access for songs"
  ON public.songs FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all access for service_sets"
  ON public.service_sets FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Enable all access for set_songs"
  ON public.set_songs FOR ALL
  USING (true)
  WITH CHECK (true);
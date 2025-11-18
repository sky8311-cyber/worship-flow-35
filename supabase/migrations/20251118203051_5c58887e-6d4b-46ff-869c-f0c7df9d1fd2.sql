-- Add new fields to service_sets table
ALTER TABLE service_sets 
ADD COLUMN target_audience TEXT,
ADD COLUMN scripture_reference TEXT,
ADD COLUMN worship_duration INTEGER;

COMMENT ON COLUMN service_sets.target_audience IS '예배 대상 (청년, 장년, 청소년 등)';
COMMENT ON COLUMN service_sets.scripture_reference IS '예배 본문 성경 구절';
COMMENT ON COLUMN service_sets.worship_duration IS '찬양 시간 (분)';

-- Add new fields to songs table
ALTER TABLE songs
ADD COLUMN subtitle TEXT,
ADD COLUMN interpretation TEXT;

COMMENT ON COLUMN songs.subtitle IS '곡 부제 (선택사항)';
COMMENT ON COLUMN songs.interpretation IS '개인적 곡 해석 및 묵상';
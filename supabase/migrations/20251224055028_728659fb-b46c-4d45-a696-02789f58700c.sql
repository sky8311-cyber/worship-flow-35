-- Create liturgical_calendar_items table
CREATE TABLE public.liturgical_calendar_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year integer NOT NULL,
  date_start date NOT NULL,
  date_end date NOT NULL,
  title_ko text NOT NULL,
  title_en text NULL,
  type text NOT NULL DEFAULT 'church_calendar',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Unique constraint to prevent duplicates
ALTER TABLE public.liturgical_calendar_items 
ADD CONSTRAINT liturgical_calendar_items_unique 
UNIQUE (year, date_start, date_end, title_ko, type);

-- Indexes for efficient queries
CREATE INDEX idx_liturgical_date_start ON public.liturgical_calendar_items(date_start);
CREATE INDEX idx_liturgical_date_end ON public.liturgical_calendar_items(date_end);
CREATE INDEX idx_liturgical_year ON public.liturgical_calendar_items(year);

-- Enable RLS
ALTER TABLE public.liturgical_calendar_items ENABLE ROW LEVEL SECURITY;

-- RLS Policy: All authenticated users can read
CREATE POLICY "Authenticated users can read liturgical items"
  ON public.liturgical_calendar_items FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- RLS Policy: Only admins can manage
CREATE POLICY "Admins can manage liturgical items"
  ON public.liturgical_calendar_items FOR ALL
  USING (is_admin(auth.uid()));

-- Seed 2026 data
INSERT INTO public.liturgical_calendar_items (year, date_start, date_end, title_ko, type) VALUES
  (2026, '2026-01-06', '2026-01-06', '주현절', 'church_calendar'),
  (2026, '2026-01-11', '2026-01-11', '주님의 수세주일', 'church_calendar'),
  (2026, '2026-02-15', '2026-02-15', '산상변모주일', 'church_calendar'),
  (2026, '2026-02-18', '2026-02-18', '재의 수요일', 'church_calendar'),
  (2026, '2026-02-22', '2026-02-22', '사순절 첫째 주일', 'church_calendar'),
  (2026, '2026-03-29', '2026-03-29', '종려주일(고난주일)', 'church_calendar'),
  (2026, '2026-03-30', '2026-04-04', '고난 주간', 'church_calendar'),
  (2026, '2026-04-03', '2026-04-03', '성 금요일', 'church_calendar'),
  (2026, '2026-04-05', '2026-04-05', '부활주일', 'church_calendar'),
  (2026, '2026-05-14', '2026-05-14', '주님 승천일', 'church_calendar'),
  (2026, '2026-05-24', '2026-05-24', '성령강림주일', 'church_calendar'),
  (2026, '2026-05-31', '2026-05-31', '삼위일체주일', 'church_calendar'),
  (2026, '2026-11-22', '2026-11-22', '왕이신 그리스도 주일', 'church_calendar'),
  (2026, '2026-11-29', '2026-11-29', '대림절 첫째 주일', 'church_calendar'),
  (2026, '2026-12-25', '2026-12-25', '성탄절', 'church_calendar'),
  -- 2025 data
  (2025, '2025-01-06', '2025-01-06', '주현절', 'church_calendar'),
  (2025, '2025-01-12', '2025-01-12', '주님수세주일', 'church_calendar'),
  (2025, '2025-03-02', '2025-03-02', '산상변모주일', 'church_calendar'),
  (2025, '2025-03-05', '2025-03-05', '재의수요일', 'church_calendar'),
  (2025, '2025-03-09', '2025-03-09', '사순절 첫째 주일', 'church_calendar'),
  (2025, '2025-04-13', '2025-04-13', '종려주일(고난주일)', 'church_calendar'),
  (2025, '2025-04-14', '2025-04-19', '고난주간', 'church_calendar'),
  (2025, '2025-04-18', '2025-04-18', '성금요일', 'church_calendar'),
  (2025, '2025-04-20', '2025-04-20', '부활주일', 'church_calendar'),
  (2025, '2025-05-29', '2025-05-29', '주님승천일', 'church_calendar'),
  (2025, '2025-06-08', '2025-06-08', '성령강림주일', 'church_calendar'),
  (2025, '2025-06-15', '2025-06-15', '삼위일체주일', 'church_calendar'),
  (2025, '2025-11-23', '2025-11-23', '왕이신 그리스도 주일', 'church_calendar'),
  (2025, '2025-11-30', '2025-11-30', '대림절 첫째 주일', 'church_calendar'),
  (2025, '2025-12-25', '2025-12-25', '성탄절', 'church_calendar'),
  -- 2024 data
  (2024, '2024-01-06', '2024-01-06', '주현절', 'church_calendar'),
  (2024, '2024-01-07', '2024-01-07', '주님의 수세주일', 'church_calendar'),
  (2024, '2024-02-11', '2024-02-11', '산상변모주일', 'church_calendar'),
  (2024, '2024-02-14', '2024-02-14', '재의수요일', 'church_calendar'),
  (2024, '2024-02-18', '2024-02-18', '사순절 첫 주일', 'church_calendar'),
  (2024, '2024-03-24', '2024-03-24', '종려주일(고난주일)', 'church_calendar'),
  (2024, '2024-03-25', '2024-03-30', '고난주간', 'church_calendar'),
  (2024, '2024-03-29', '2024-03-29', '성금요일', 'church_calendar'),
  (2024, '2024-03-31', '2024-03-31', '부활주일', 'church_calendar'),
  (2024, '2024-05-09', '2024-05-09', '주님승천일', 'church_calendar'),
  (2024, '2024-05-19', '2024-05-19', '오순절 성령강림일', 'church_calendar'),
  (2024, '2024-05-26', '2024-05-26', '삼위일체주일', 'church_calendar'),
  (2024, '2024-11-24', '2024-11-24', '왕이신 그리스도 주일', 'church_calendar'),
  (2024, '2024-12-01', '2024-12-01', '대림절 첫 주일', 'church_calendar'),
  (2024, '2024-12-25', '2024-12-25', '성탄절', 'church_calendar')
ON CONFLICT (year, date_start, date_end, title_ko, type) DO UPDATE
SET updated_at = now();
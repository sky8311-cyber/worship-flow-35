-- Page Analytics 테이블 생성
CREATE TABLE public.page_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT NOT NULL,
  page_path TEXT NOT NULL,
  page_title TEXT,
  referrer_path TEXT,
  entered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  exited_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  device_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 성능을 위한 인덱스
CREATE INDEX idx_page_analytics_path ON public.page_analytics(page_path);
CREATE INDEX idx_page_analytics_entered_at ON public.page_analytics(entered_at);
CREATE INDEX idx_page_analytics_user_id ON public.page_analytics(user_id);
CREATE INDEX idx_page_analytics_session_id ON public.page_analytics(session_id);

-- RLS 활성화
ALTER TABLE public.page_analytics ENABLE ROW LEVEL SECURITY;

-- 모든 사용자(인증/비인증)가 INSERT 가능
CREATE POLICY "Anyone can insert analytics"
  ON public.page_analytics FOR INSERT
  WITH CHECK (true);

-- 사용자는 자신의 세션 데이터만 UPDATE 가능
CREATE POLICY "Users can update own session analytics"
  ON public.page_analytics FOR UPDATE
  USING (session_id = session_id);

-- 관리자만 모든 데이터 조회 가능
CREATE POLICY "Admins can view all analytics"
  ON public.page_analytics FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );
-- email_preferences 테이블 생성
CREATE TABLE public.email_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  automated_reminders BOOLEAN DEFAULT true,
  community_updates BOOLEAN DEFAULT true,
  product_updates BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT true,
  unsubscribe_token UUID DEFAULT gen_random_uuid() UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 활성화
ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;

-- 본인만 조회/수정 가능
CREATE POLICY "Users can view own email preferences" 
  ON public.email_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own email preferences" 
  ON public.email_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own email preferences" 
  ON public.email_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- communications 문서 삽입 (한국어/영어)
INSERT INTO public.legal_documents (type, version, language, title, content, effective_date, is_active)
VALUES 
  ('communications', '1.0', 'ko', '마케팅 및 정보 수신 동의', 
   '서비스 관련 이메일(자동 리마인더, 커뮤니티 업데이트, 마케팅 이메일)을 수신하는 데 동의합니다.', 
   NOW(), true),
  ('communications', '1.0', 'en', 'Marketing and Communication Consent',
   'I consent to receiving service-related emails including automated reminders, community updates, and marketing emails.',
   NOW(), true)
ON CONFLICT DO NOTHING;
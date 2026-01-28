

# 긴급 수정: email_preferences 테이블 생성

## 문제

에러 메시지: `Could not find the table 'public.email_preferences' in the schema cache`

이메일 수신 동의 모달에서 `email_preferences` 테이블에 접근하려 하지만, 해당 테이블이 데이터베이스에 존재하지 않습니다.

## 원인

이전 마이그레이션 (`20260128025559_f14f4792-ae7b-4c02-9fe3-094738425350.sql`)에 enum 타입 추가만 포함되어 있고, `email_preferences` 테이블 생성 SQL이 누락되었습니다.

## 해결 방안

### 새 마이그레이션 실행

`email_preferences` 테이블 생성 + RLS 정책 + communications 법적 문서 삽입:

```sql
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
```

## 영향

- `/signup` 페이지에서 동의 완료 시 정상 작동
- `/dashboard` 등 로그인 후 페이지에서 기존 유저 동의 모달 정상 작동
- Settings 페이지에서 이메일 수신 설정 관리 가능

## 예상 결과

테이블 생성 후 이메일 수신 동의 모달이 정상적으로 작동하여 사용자가 회원가입/로그인을 완료할 수 있습니다.


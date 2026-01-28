

# 이메일 수신 동의 및 구독 관리 시스템 구현

## 개요

승인된 최종 플랜에 따라 이메일 수신 동의 시스템을 구현합니다:
1. 신규 유저: 기존 약관 동의창에 커뮤니케이션 동의 체크박스 추가
2. 기존 유저: 커뮤니케이션 동의만 별도 요청 (기존 약관 재동의 불필요)
3. 수신 거부 시 실제로 이메일 발송 안 함
4. 모든 이메일에 수신 거부 링크 삽입

---

## 구현 순서

### 1단계: 데이터베이스 마이그레이션

**테이블 생성:**
- `email_preferences` 테이블 (수신 설정 저장)
- RLS 정책 추가
- `communications` 법적 문서 삽입 (한국어/영어)

```sql
-- email_preferences 테이블
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

-- RLS 활성화 및 정책
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;
-- 사용자 본인 데이터만 접근 가능
```

---

### 2단계: useLegalConsent.ts 수정

**변경 사항:**
- `communications` 타입 추가
- 분기 처리: terms/privacy 동의 완료 + communications만 미동의 → 별도 플래그 반환

```typescript
// 반환 타입 확장
return {
  needsConsent: boolean,
  pendingDocuments: [...],
  needsCommunicationConsentOnly: boolean, // 신규 플래그
}
```

---

### 3단계: LegalConsentModal.tsx 수정 (신규 유저용)

**변경 사항:**
- terms/privacy 동의 체크박스 (필수)
- 커뮤니케이션 동의 체크박스 추가 (선택, 기본 체크됨)
- 저장 시 `email_preferences` 테이블에도 설정 저장

```text
┌─────────────────────────────────────────────────────────┐
│ 📄 이용약관                                  [보기]     │
│ 🔒 개인정보처리방침                          [보기]     │
├─────────────────────────────────────────────────────────┤
│ ☑ 위 약관에 동의합니다 (필수)                          │
│ ☑ 서비스 관련 이메일 수신에 동의합니다 (선택)          │
├─────────────────────────────────────────────────────────┤
│              [동의하고 계속하기]                        │
└─────────────────────────────────────────────────────────┘
```

---

### 4단계: CommunicationConsentModal.tsx 생성 (기존 유저용)

**새 컴포넌트:**
- 기존 유저에게 커뮤니케이션 동의만 요청
- "수신 동의" 또는 "수신 안함" 선택 가능
- 선택 후 `email_preferences` 및 `legal_acceptances` 저장

```text
┌─────────────────────────────────────────────────────────┐
│ 📧 이메일 수신 설정                                      │
├─────────────────────────────────────────────────────────┤
│ K-Worship에서 서비스 관련 이메일을 보내드립니다.         │
│                                                         │
│ • 자동 리마인더                                         │
│ • 커뮤니티/서비스 업데이트                              │
│ • 마케팅 이메일                                         │
│                                                         │
│ 설정에서 언제든지 변경 가능합니다.                       │
├─────────────────────────────────────────────────────────┤
│   [수신 안함]                    [수신 동의하기]        │
└─────────────────────────────────────────────────────────┘
```

---

### 5단계: App.tsx 수정

**변경 사항:**
- `LegalConsentGate`에서 `needsCommunicationConsentOnly` 분기 처리
- `CommunicationConsentModal` 조건부 렌더링
- `/email-preferences` 라우트 추가

---

### 6단계: Settings.tsx - 이메일 수신 설정 카드 추가

**위치:** 푸시 알림 설정 카드 아래

```text
┌─────────────────────────────────────────────────────────┐
│ 📧 이메일 수신 설정                                      │
├─────────────────────────────────────────────────────────┤
│ 📬 자동 리마인더                         [ON/OFF]       │
│ 👥 커뮤니티 업데이트                     [ON/OFF]       │
│ 📢 서비스 업데이트                       [ON/OFF]       │
│ 🎯 마케팅 이메일                         [ON/OFF]       │
└─────────────────────────────────────────────────────────┘
```

---

### 7단계: EmailPreferences.tsx 페이지 생성 (토큰 기반)

**경로:** `/email-preferences?token=xxx`

**기능:**
- 이메일 링크에서 로그인 없이 접근 가능
- 토큰으로 사용자 식별
- 개별 카테고리별 수신 설정 변경
- "모든 이메일 수신 거부" 옵션

---

### 8단계: manage-email-preferences Edge Function 생성

**기능:**
- GET: 토큰으로 현재 설정 조회
- POST: 토큰으로 설정 업데이트
- 인증 불필요 (토큰이 인증 역할)

---

### 9단계: process-automated-emails 수정

**변경 사항:**
1. 수신 거부 사용자 필터링:
```typescript
const { data: optedOut } = await supabase
  .from("email_preferences")
  .select("user_id")
  .eq("automated_reminders", false);

const filteredRecipients = recipients.filter(r => !optedOutIds.has(r.id));
```

2. 수신 거부 링크 변수 추가:
```typescript
variables.unsubscribe_url = `${APP_URL}/email-preferences?token=${token}`;
variables.preferences_url = `${APP_URL}/email-preferences?token=${token}`;
```

---

### 10단계: send-admin-email 수정

**변경 사항:**
- 카테고리별 수신 거부 필터링 (marketing_emails, product_updates 등)
- 수신 거부 링크 변수 추가

---

### 11단계: 자동 이메일 템플릿 업데이트

**DB 업데이트 (automated_email_settings):**
- 모든 템플릿에 수신 거부 푸터 추가:

```html
<p style="font-size: 11px;">
  <a href="{{preferences_url}}">이메일 수신 설정 변경</a> | 
  <a href="{{unsubscribe_url}}">수신 거부</a>
</p>
```

---

## 파일 변경 목록

| 파일 | 작업 |
|------|------|
| **Database Migration** | `email_preferences` 테이블 + RLS + communications 문서 |
| `src/hooks/useLegalConsent.ts` | communications 타입 추가, 분기 처리 |
| `src/components/legal/LegalConsentModal.tsx` | 커뮤니케이션 체크박스 추가 |
| `src/components/legal/CommunicationConsentModal.tsx` | **신규** - 기존 유저용 모달 |
| `src/App.tsx` | CommunicationConsentModal 연동, 라우트 추가 |
| `src/pages/Settings.tsx` | 이메일 수신 설정 카드 추가 |
| `src/pages/EmailPreferences.tsx` | **신규** - 토큰 기반 수신 거부 페이지 |
| `supabase/functions/manage-email-preferences/index.ts` | **신규** |
| `supabase/functions/process-automated-emails/index.ts` | 수신 거부 필터링 |
| `supabase/functions/send-admin-email/index.ts` | 수신 거부 필터링 |
| `supabase/config.toml` | 새 함수 등록 |

---

## 기술 세부 사항

### 보안
- `unsubscribe_token`: UUID로 생성, 추측 불가능
- RLS: 사용자 본인 데이터만 접근 가능
- 토큰 API: service_role_key로 필터링 수행

### 기존 유저 처리 흐름
1. 로그인 시 `useLegalConsent` 훅이 communications 미동의 감지
2. `needsCommunicationConsentOnly = true` 반환
3. `App.tsx`에서 `CommunicationConsentModal` 표시
4. 사용자가 "수신 동의" 또는 "수신 안함" 선택
5. 선택에 따라 `email_preferences` 생성 + `legal_acceptances` 기록

### 신규 유저 처리 흐름
1. 회원가입 후 `LegalConsentModal` 표시
2. terms + privacy 동의 (필수) + communications 동의 (선택)
3. 저장 시 `email_preferences` 자동 생성



# 이메일 수신 동의 및 구독 관리 시스템 - 최종 플랜

## 요약

1. **커뮤니케이션 동의**: 약관 동의 시스템에 통합
2. **기존 유저**: 커뮤니케이션 동의만 별도 요청 (약관/개인정보 재동의 불필요)
3. **신규 유저**: 기존 약관 동의창에 커뮤니케이션 동의 체크박스 추가
4. **수신 거부 제어**: 실제 이메일 발송 전 필터링 로직 추가
5. **이메일 템플릿**: 모든 이메일에 수신 거부 링크 삽입

---

## 1. 데이터베이스 변경

### 1-1. `email_preferences` 테이블 생성

```sql
CREATE TABLE public.email_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- 이메일 카테고리별 수신 설정
  automated_reminders BOOLEAN DEFAULT true,
  community_updates BOOLEAN DEFAULT true,
  product_updates BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT true,
  
  -- 수신 거부 토큰 (이메일 링크용)
  unsubscribe_token UUID DEFAULT gen_random_uuid() UNIQUE,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 정책
ALTER TABLE email_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON email_preferences FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON email_preferences FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON email_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 인덱스
CREATE INDEX idx_email_preferences_token ON email_preferences(unsubscribe_token);
```

### 1-2. 커뮤니케이션 동의 문서 추가 (legal_documents)

```sql
-- 한국어
INSERT INTO legal_documents (type, language, version, title, content, is_active)
VALUES ('communications', 'ko', '1.0', 'Kworship 커뮤니케이션 수신 동의',
'K-Worship 서비스 관련 이메일 수신에 동의합니다.

수신하는 이메일 종류:
• 자동 리마인더 (미접속 알림, 팀 초대 리마인더 등)
• 커뮤니티 업데이트 (공동체 공지, 안내)
• 서비스 업데이트 (새 기능, 정책 변경 안내)
• 마케팅 이메일 (프로모션, 이벤트 안내)

설정 > 이메일 수신 설정에서 언제든지 수신 여부를 변경할 수 있으며, 
이메일 하단의 수신 거부 링크를 통해서도 변경 가능합니다.', true);

-- 영어
INSERT INTO legal_documents (type, language, version, title, content, is_active)
VALUES ('communications', 'en', '1.0', 'Kworship Communication Consent',
'I agree to receive service-related emails from K-Worship.

Types of emails you will receive:
• Automated reminders (inactivity alerts, team invite reminders, etc.)
• Community updates (announcements, notifications)
• Service updates (new features, policy changes)
• Marketing emails (promotions, events)

You can change your email preferences anytime in Settings > Email Preferences, 
or via the unsubscribe link at the bottom of any email.', true);
```

---

## 2. 신규 유저 동의 흐름

### 현재 LegalConsentModal
기존 약관(terms) + 개인정보(privacy) 동의 화면에 커뮤니케이션 동의 체크박스 **한 줄 추가**

```text
┌─────────────────────────────────────────────────────────────────┐
│ 약관 동의                                                        │
├─────────────────────────────────────────────────────────────────┤
│ 📄 이용약관 v1.0                                    [보기 ▼]     │
│ 🔒 개인정보처리방침 v1.0                            [보기 ▼]     │
├─────────────────────────────────────────────────────────────────┤
│ ☑ 위 약관에 동의합니다 (필수)                                    │
│                                                                 │
│ ☑ 서비스 관련 이메일 수신에 동의합니다 (선택)   ← 새로 추가      │
├─────────────────────────────────────────────────────────────────┤
│                     [동의하고 계속하기]                          │
└─────────────────────────────────────────────────────────────────┘
```

**동작:**
- 필수 약관 동의: terms + privacy
- 선택 동의: communications (기본 체크됨)
- 동의 시 `email_preferences` 테이블 자동 생성

---

## 3. 기존 유저 동의 흐름

### 별도 커뮤니케이션 동의 모달

기존 유저가 이미 terms/privacy에 동의한 경우, **커뮤니케이션 동의만** 요청하는 간소화된 모달 표시

```text
┌─────────────────────────────────────────────────────────────────┐
│ 📧 이메일 수신 설정                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ K-Worship에서 서비스 관련 이메일을 보내드리려고 합니다.           │
│                                                                 │
│ 수신하는 이메일:                                                 │
│ • 자동 리마인더 (미접속 알림, 팀 초대 등)                         │
│ • 커뮤니티/서비스 업데이트                                       │
│ • 마케팅 이메일                                                  │
│                                                                 │
│ 설정에서 언제든지 변경할 수 있습니다.                             │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│    [수신 안함]                        [수신 동의하기]            │
└─────────────────────────────────────────────────────────────────┘
```

**동작:**
- "수신 동의하기" 클릭 → `email_preferences` 모두 true로 생성, `legal_acceptances` 기록
- "수신 안함" 클릭 → `email_preferences` 모두 false로 생성, `legal_acceptances` 기록
- 둘 중 하나 선택해야 진행 가능 (선택권 부여)

### useLegalConsent.ts 수정

```typescript
// 기존: ["terms", "privacy"]만 체크
// 변경: communications도 체크하되, 별도 처리 로직 추가

// 1. terms/privacy 중 미동의 있으면 → 전체 약관 모달
// 2. terms/privacy 동의 완료 + communications 미동의 → 커뮤니케이션 전용 모달
```

---

## 4. Settings 페이지 - 이메일 수신 설정 카드

푸시 알림 설정 카드 **아래**에 추가:

```text
┌─────────────────────────────────────────────────────────────────┐
│ 📧 이메일 수신 설정                                              │
│ ─────────────────────────────────────────────────────────────── │
│ K-Worship에서 보내는 이메일 수신 여부를 설정합니다                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ 📬 자동 리마인더                                [ON/OFF 스위치]  │
│    미접속, 팀원 초대, 워십세트 생성 알림                          │
│                                                                 │
│ 👥 커뮤니티 업데이트                            [ON/OFF 스위치]  │
│    커뮤니티 공지 및 안내                                         │
│                                                                 │
│ 📢 서비스 업데이트                              [ON/OFF 스위치]  │
│    새 기능, 정책 변경 안내                                       │
│                                                                 │
│ 🎯 마케팅 이메일                                [ON/OFF 스위치]  │
│    프로모션, 이벤트 안내                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 5. 수신 거부 페이지 (토큰 기반)

### 새 페이지: `/email-preferences`

이메일 링크에서 로그인 없이 접근 가능:

```
URL: /email-preferences?token=xxxx-xxxx-xxxx
```

```text
┌─────────────────────────────────────────────────────────────────┐
│                        K-Worship                                 │
│                                                                 │
│              이메일 수신 설정                                     │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ☑ 자동 리마인더 수신                                            │
│  ☑ 커뮤니티 업데이트 수신                                        │
│  ☑ 서비스 업데이트 수신                                          │
│  ☑ 마케팅 이메일 수신                                            │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│  □ 모든 이메일 수신 거부                                         │
│                                                                 │
│  [저장하기]                                                      │
│                                                                 │
│  ✓ 저장되었습니다                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Edge Function 수정 - 수신 거부 필터링

### 6-1. `process-automated-emails/index.ts`

**수정 위치:** recipients 조회 후, 발송 전

```typescript
// 수신 거부 사용자 필터링
const { data: optedOutUsers } = await supabase
  .from("email_preferences")
  .select("user_id, unsubscribe_token")
  .eq("automated_reminders", false);

const optedOutIds = new Set(optedOutUsers?.map(u => u.user_id) || []);

// 수신 동의한 사용자만 필터링
const filteredRecipients = recipients.filter(r => !optedOutIds.has(r.id));

console.log(`Filtered out ${recipients.length - filteredRecipients.length} opted-out users`);
```

**수신 거부 링크 변수 추가:**

```typescript
// 각 수신자에 대해 unsubscribe_token 조회
const { data: prefData } = await supabase
  .from("email_preferences")
  .select("unsubscribe_token")
  .eq("user_id", recipient.id)
  .single();

const unsubscribeToken = prefData?.unsubscribe_token || '';
const unsubscribeUrl = `${APP_URL}/email-preferences?token=${unsubscribeToken}`;
const preferencesUrl = `${APP_URL}/email-preferences?token=${unsubscribeToken}`;

// 변수에 추가
const variables = {
  ...existingVariables,
  unsubscribe_url: unsubscribeUrl,
  preferences_url: preferencesUrl,
};
```

### 6-2. `send-admin-email/index.ts`

동일한 필터링 로직 적용 (카테고리별 필터링):
- `marketing_emails` 체크 (마케팅 이메일 발송 시)
- `product_updates` 체크 (서비스 업데이트 발송 시)
- `community_updates` 체크 (커뮤니티 안내 발송 시)

---

## 7. Edge Function 신규 - 토큰 기반 설정 관리

### `manage-email-preferences/index.ts`

```typescript
// GET: 토큰으로 현재 설정 조회
// POST: 토큰으로 설정 업데이트
// 인증 불필요 (토큰이 인증 역할)

// 보안: unsubscribe_token은 UUID로 추측 불가능
```

---

## 8. 이메일 템플릿 수신 거부 푸터

### 모든 자동 이메일 템플릿에 추가

```html
<!-- 이메일 푸터 -->
<div style="background: #f8f9fa; padding: 24px; text-align: center; border-top: 1px solid #e9ecef; margin-top: 32px;">
  <p style="color: #666; font-size: 14px; margin: 0 0 8px;">감사합니다,<br><strong>K-Worship 팀</strong></p>
  <p style="color: #999; font-size: 12px; margin: 0 0 16px;">© 2026 K-Worship. All rights reserved.</p>
  
  <p style="color: #999; font-size: 11px; margin: 0;">
    <a href="{{preferences_url}}" style="color: #2b4b8a; text-decoration: underline;">이메일 수신 설정 변경</a>
    &nbsp;|&nbsp;
    <a href="{{unsubscribe_url}}" style="color: #999; text-decoration: underline;">수신 거부</a>
  </p>
</div>
```

---

## 파일 변경 요약

| 파일 | 작업 |
|------|------|
| **Database Migration** | `email_preferences` 테이블 + RLS + communications 문서 |
| `src/hooks/useLegalConsent.ts` | communications 타입 추가, 분기 처리 |
| `src/components/legal/LegalConsentModal.tsx` | 신규 유저용 커뮤니케이션 체크박스 추가 |
| `src/components/legal/CommunicationConsentModal.tsx` | **신규** - 기존 유저용 간소화 모달 |
| `src/pages/Settings.tsx` | 이메일 수신 설정 카드 추가 |
| `src/pages/EmailPreferences.tsx` | **신규** - 토큰 기반 수신 거부 페이지 |
| `src/App.tsx` | EmailPreferences 라우트 추가 |
| `supabase/functions/process-automated-emails/index.ts` | 수신 거부 필터링 + 링크 변수 |
| `supabase/functions/send-admin-email/index.ts` | 수신 거부 필터링 + 링크 변수 |
| `supabase/functions/manage-email-preferences/index.ts` | **신규** - 토큰 기반 API |

---

## 구현 순서

1. **DB 마이그레이션** - `email_preferences` 테이블 + communications 문서
2. **useLegalConsent + LegalConsentModal** - 신규 유저 동의 흐름
3. **CommunicationConsentModal** - 기존 유저 전용 모달
4. **Settings 이메일 설정 카드** - UI 구현
5. **EmailPreferences 페이지** - 토큰 기반 수신 거부
6. **manage-email-preferences Edge Function** - 토큰 API
7. **process-automated-emails / send-admin-email 수정** - 필터링 + 링크
8. **자동 이메일 템플릿 업데이트** - 수신 거부 푸터 추가

---

## 핵심 보안 사항

1. **unsubscribe_token**: UUID로 생성, 추측 불가능
2. **RLS 정책**: 사용자 본인 데이터만 접근 가능
3. **토큰 기반 API**: 이메일 링크에서 로그인 없이 설정 변경 가능
4. **Edge Function 권한**: service_role_key로 필터링 수행

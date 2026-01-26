
# 자동 이메일 발송 관리 시스템 구현

## 현재 상황 분석

### 기존 자동 이메일 종류 (3가지)
1. **미접속자 리마인더** (`inactive_user`)
   - 대상: 7일 이상 미접속 사용자
   - 제목: "그동안 뵙지 못했네요!"
   
2. **팀원 초대 리마인더** (`no_team_invite`)
   - 대상: 7일 이상 혼자인 커뮤니티 소유자
   - 제목: "팀원을 초대해 함께 협업하세요!"

3. **워십세트 생성 리마인더** (`no_worship_set`)
   - 대상: 14일 이상 세트 미생성 예배인도자
   - 제목: "새로운 예배를 준비하세요!"

### 현재 문제점
- 이메일 템플릿이 Edge Function에 **하드코딩**되어 있음
- 발송 시간/주기를 **변경할 수 없음** (00:00 UTC 고정)
- 자동 이메일 **발송 기록을 확인할 수 없음** (admin_email_logs와 분리됨)
- 대상 **수신자 명단을 미리 볼 수 없음**
- 자동 이메일을 **활성화/비활성화할 수 없음**

---

## 구현 계획

### 1. 자동 이메일 설정 테이블 생성

```sql
CREATE TABLE public.automated_email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_type TEXT UNIQUE NOT NULL,  -- 'inactive_user', 'no_team_invite', 'no_worship_set'
  enabled BOOLEAN DEFAULT true,
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  trigger_days INTEGER NOT NULL,     -- 발송 기준 일수
  schedule_hour INTEGER DEFAULT 0,   -- 0-23 (UTC)
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES profiles(id)
);
```

### 2. UI 구조 - 새로운 탭 추가

EmailSettings.tsx를 확장하여 자동 이메일 관리 섹션 추가:

```text
설정 탭
├── 📧 발신자 정보 (기존)
├── ✍️ 이메일 서명 (기존)
└── 🤖 자동 발송 설정 (NEW!)
    ├── 미접속자 리마인더
    │   ├── ✓ 활성화/비활성화
    │   ├── 발송 기준: [7]일 미접속
    │   ├── 발송 시간: [09:00] KST
    │   ├── 제목 템플릿: [...]
    │   ├── 본문 템플릿 편집
    │   └── [수신 대상 미리보기] → 30명
    │
    ├── 팀원 초대 리마인더
    │   ├── ✓ 활성화/비활성화
    │   ├── 발송 기준: [7]일 후
    │   ├── 제목/본문 템플릿
    │   └── [수신 대상 미리보기] → 12명
    │
    └── 워십세트 생성 리마인더
        ├── ✓ 활성화/비활성화
        ├── 발송 기준: [14]일 미생성
        ├── 제목/본문 템플릿
        └── [수신 대상 미리보기] → 8명
```

### 3. 자동 이메일 발송 기록 통합

EmailLogs.tsx에 자동 이메일 발송 기록 탭 추가:

```text
발송 기록 탭
├── 📧 수동 발송 (기존)
└── 🤖 자동 발송 (NEW!)
    ├── 필터: [전체 ▼] [이번 주 ▼]
    └── 발송 목록
        ├── 2026-01-26 09:00
        │   ├── inactive_user: 0명 발송
        │   ├── no_team_invite: 12명 발송
        │   └── no_worship_set: 4명 발송
        └── 2026-01-25 09:00
            └── ...
```

### 4. 수신자 명단 미리보기

각 자동 이메일 유형별로 현재 대상자를 조회하는 기능:

```text
┌──────────────────────────────────────────┐
│  📋 미접속자 리마인더 수신 대상 (30명)    │
├──────────────────────────────────────────┤
│  🔍 [검색...]                            │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ 김철수    kim@ex.com   8일 전 접속 │  │
│  │ 이영희    lee@ex.com   12일 전 접속│  │
│  │ ...                                │  │
│  └────────────────────────────────────┘  │
│                                          │
│  ⚠️ 이 사용자들에게 아직 발송되지 않았습니다│
│                                          │
│          [닫기]    [지금 테스트 발송]     │
└──────────────────────────────────────────┘
```

---

## 파일 변경 목록

| 파일 | 변경 내용 |
|------|----------|
| `src/components/admin/email/EmailSettings.tsx` | 자동 발송 설정 섹션 추가 |
| `src/components/admin/email/AutomatedEmailSettings.tsx` | 새 파일 - 자동 이메일 설정 컴포넌트 |
| `src/components/admin/email/AutomatedEmailPreviewDialog.tsx` | 새 파일 - 수신자 미리보기 다이얼로그 |
| `src/components/admin/email/EmailLogs.tsx` | 자동 이메일 발송 기록 탭 추가 |
| `supabase/functions/process-automated-emails/index.ts` | DB에서 설정 및 템플릿 로드하도록 수정 |

---

## DB 마이그레이션

### 1. 자동 이메일 설정 테이블

```sql
CREATE TABLE public.automated_email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_type TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT true,
  subject_template TEXT NOT NULL,
  body_template TEXT NOT NULL,
  trigger_days INTEGER NOT NULL,
  schedule_hour INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES profiles(id)
);

-- RLS
ALTER TABLE public.automated_email_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage automated email settings"
ON public.automated_email_settings FOR ALL TO authenticated
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
```

### 2. 초기 데이터 삽입

```sql
INSERT INTO public.automated_email_settings (email_type, subject_template, body_template, trigger_days) VALUES
('inactive_user', '그동안 뵙지 못했네요! - Kworship', '<HTML_TEMPLATE>', 7),
('no_team_invite', '팀원을 초대해 함께 협업하세요! - Kworship', '<HTML_TEMPLATE>', 7),
('no_worship_set', '새로운 예배를 준비하세요! - Kworship', '<HTML_TEMPLATE>', 14);
```

### 3. automated_email_log 테이블 확장

```sql
-- 발송 결과 상태 추가
ALTER TABLE public.automated_email_log ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'sent';
ALTER TABLE public.automated_email_log ADD COLUMN IF NOT EXISTS error_message TEXT;
```

---

## 기술 구현 세부사항

### AutomatedEmailSettings 컴포넌트

```typescript
interface AutomatedEmailConfig {
  id: string;
  email_type: 'inactive_user' | 'no_team_invite' | 'no_worship_set';
  enabled: boolean;
  subject_template: string;
  body_template: string;
  trigger_days: number;
  schedule_hour: number;
}

// 각 이메일 유형별 메타 정보
const emailTypeInfo = {
  inactive_user: {
    icon: <UserX />,
    title: "미접속자 리마인더",
    description: "일정 기간 로그인하지 않은 사용자에게 발송",
    previewRpc: "get_inactive_users",
  },
  no_team_invite: {
    icon: <Users />,
    title: "팀원 초대 리마인더",
    description: "혼자 운영 중인 커뮤니티 소유자에게 발송",
    previewRpc: "get_communities_with_single_owner",
  },
  no_worship_set: {
    icon: <Music />,
    title: "워십세트 생성 리마인더",
    description: "세트를 만들지 않은 예배인도자에게 발송",
    previewRpc: "get_inactive_worship_leaders",
  },
};
```

### 템플릿 변수 지원

```typescript
// 지원 변수
// {{user_name}} - 사용자 이름
// {{days}} - 경과 일수
// {{community_name}} - 커뮤니티 이름
// {{app_url}} - 앱 URL
// {{cta_url}} - CTA 링크
```

### Edge Function 수정

```typescript
// 기존: 하드코딩된 템플릿
// 변경: DB에서 설정 로드

const { data: settings } = await supabase
  .from("automated_email_settings")
  .select("*")
  .eq("enabled", true);

for (const setting of settings) {
  if (setting.email_type === "inactive_user") {
    const { data: users } = await supabase.rpc("get_inactive_users", { 
      days: setting.trigger_days 
    });
    // ... 템플릿 변수 치환 후 발송
  }
}
```

---

## 예상 결과

1. **자동 이메일 ON/OFF**: 개별 자동 이메일을 활성화/비활성화 가능
2. **발송 조건 조정**: 미접속 일수, 워십세트 미생성 일수 등 커스터마이징
3. **템플릿 편집**: 제목과 본문을 UI에서 직접 수정
4. **수신자 미리보기**: 발송 전 대상자 명단 확인
5. **발송 기록 통합**: 수동/자동 발송 기록을 한 곳에서 확인
6. **발송 시간 설정**: 발송 시각을 원하는 시간(KST)으로 변경

---

## UI 목업

### 자동 발송 설정 카드

```text
┌─────────────────────────────────────────────────────────┐
│  🤖 자동 발송 설정                                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  👤 미접속자 리마인더                    [✓ 활성화]│  │
│  │  ─────────────────────────────────────────────────│  │
│  │  발송 기준: [7] 일 미접속 시                       │  │
│  │  발송 시간: [09:00] KST (매일)                     │  │
│  │  ─────────────────────────────────────────────────│  │
│  │  제목: [그동안 뵙지 못했네요! - Kworship          ]│  │
│  │  [📝 본문 템플릿 편집]                             │  │
│  │  ─────────────────────────────────────────────────│  │
│  │  현재 대상: 30명  [👁️ 수신자 보기]                 │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  👥 팀원 초대 리마인더                   [✓ 활성화]│  │
│  │  ...                                               │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  🎵 워십세트 생성 리마인더               [✓ 활성화]│  │
│  │  ...                                               │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  마지막 실행: 2026-01-26 09:00 KST                      │
│  [🔄 지금 실행] [💾 설정 저장]                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

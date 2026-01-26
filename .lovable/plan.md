

# 자동 이메일 발송 주기 설정 및 템플릿 미리보기 기능

## 현재 상황 분석

### 발송 기록 현황
- **no_team_invite**: 18건 기록됨
- **no_worship_set**: 34건 기록됨
- 총 52건 (일부 중복 수신자가 있어서 로그 함수 실행 2번에 누적됨)

### 현재 중복 방지 로직 문제
현재 `get_automated_email_recipients` 함수는:
- `inactive_user`: 마지막 접속 이후 이메일을 받았는지 확인
- `no_team_invite`: 해당 커뮤니티에 대해 이메일을 받았는지 확인 (시간 제한 없음)
- `no_worship_set`: 마지막 세트 생성 이후 이메일을 받았는지 확인

**문제**: 조건 충족 상태가 유지되면 매일 이메일을 받을 수 있음

---

## 구현 계획

### 1. 발송 주기 설정 추가 (Cooldown Period)

DB 테이블에 `cooldown_days` 컬럼 추가:

```sql
ALTER TABLE automated_email_settings 
ADD COLUMN cooldown_days INTEGER DEFAULT 7;
```

이렇게 하면:
- **7일 쿨다운**: 한 사용자가 같은 유형의 이메일을 7일 내 다시 받지 않음
- 수신자 목록은 매일 갱신되지만, 최근 발송 기록이 있는 사용자는 제외

### 2. UI 업데이트

```text
┌───────────────────────────────────────────────────┐
│  🎵 워십세트 생성 리마인더              [✓ 활성화]│
├───────────────────────────────────────────────────│
│  발송 조건: [14]일 이상 미생성 시                 │
│  발송 주기: [7]일 마다 (쿨다운)          ← NEW!  │
│  발송 시간: [09:00] KST                           │
├───────────────────────────────────────────────────│
│  제목: [새로운 예배를 준비하세요!...]             │
│  [📝 본문 편집]   [👁️ 템플릿 미리보기]   ← NEW!  │
├───────────────────────────────────────────────────│
│  현재 대상: 8명  [👁️ 수신자 보기]                 │
└───────────────────────────────────────────────────┘
```

### 3. RPC 함수 수정

`get_automated_email_recipients` 함수에 쿨다운 로직 추가:

```sql
-- 기존: sent_at > p.last_active_at
-- 변경: sent_at > now() - (cooldown_days || ' days')::INTERVAL
```

### 4. 템플릿 미리보기 다이얼로그

```text
┌──────────────────────────────────────────────────────┐
│  👁️ 이메일 템플릿 미리보기                           │
├──────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────┐  │
│  │  제목: 새로운 예배를 준비하세요! - Kworship    │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌────────────────────────────────────────────────┐  │
│  │                                                │  │
│  │  안녕하세요, [사용자 이름]님!                   │  │
│  │                                                │  │
│  │  마지막 워십세트를 만드신 지 [14]일이         │  │
│  │  지났습니다.                                   │  │
│  │                                                │  │
│  │  ┌──────────────────────┐                      │  │
│  │  │   워십세트 만들기    │                      │  │
│  │  └──────────────────────┘                      │  │
│  │                                                │  │
│  │  감사합니다,                                   │  │
│  │  Kworship 팀                                   │  │
│  │                                                │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ⚠️ 변수는 실제 발송 시 각 수신자 정보로 치환됩니다  │
│                                                      │
│                              [닫기]                  │
└──────────────────────────────────────────────────────┘
```

---

## 파일 변경 목록

| 파일 | 변경 내용 |
|------|----------|
| `supabase/migrations/` | `cooldown_days` 컬럼 추가 및 RPC 함수 수정 |
| `src/components/admin/email/AutomatedEmailSettings.tsx` | 발송 주기 설정 UI 및 템플릿 미리보기 버튼 추가 |
| `src/components/admin/email/AutomatedEmailPreviewDialog.tsx` | 템플릿 미리보기 기능 추가 (기존 수신자 미리보기와 통합 또는 별도 다이얼로그) |

---

## 기술 세부사항

### 1. DB 마이그레이션

```sql
-- 쿨다운 컬럼 추가
ALTER TABLE public.automated_email_settings 
ADD COLUMN IF NOT EXISTS cooldown_days INTEGER DEFAULT 7;

-- 기존 데이터 업데이트
UPDATE public.automated_email_settings 
SET cooldown_days = 7;
```

### 2. RPC 함수 업데이트

```sql
CREATE OR REPLACE FUNCTION public.get_automated_email_recipients(
  p_email_type TEXT,
  p_trigger_days INTEGER,
  p_cooldown_days INTEGER DEFAULT 7  -- NEW PARAMETER
)
...
  -- 쿨다운 조건 추가
  AND NOT EXISTS (
    SELECT 1 FROM automated_email_log ael
    WHERE ael.user_id = p.id
      AND ael.email_type = p_email_type
      AND ael.sent_at > now() - (p_cooldown_days || ' days')::INTERVAL
  )
```

### 3. AutomatedEmailSettings UI 업데이트

```typescript
// 쿨다운 입력 필드 추가
<div className="space-y-2">
  <Label>{language === "ko" ? "발송 주기 (일)" : "Cooldown Period (days)"}</Label>
  <Input
    type="number"
    min={1}
    max={30}
    value={getEditedValue(setting, "cooldown_days")}
    onChange={(e) => updateEditedSetting(setting.email_type, "cooldown_days", parseInt(e.target.value) || 7)}
  />
  <p className="text-xs text-muted-foreground">
    {language === "ko" 
      ? `동일 사용자에게 ${getEditedValue(setting, "cooldown_days")}일 내 재발송하지 않음`
      : `Won't re-send to same user within ${getEditedValue(setting, "cooldown_days")} days`}
  </p>
</div>

// 템플릿 미리보기 버튼 추가
<Button variant="outline" size="sm" onClick={() => setTemplatePreviewType(setting.email_type)}>
  <Eye className="w-4 h-4 mr-2" />
  {language === "ko" ? "템플릿 미리보기" : "Preview Template"}
</Button>
```

### 4. 템플릿 미리보기 컴포넌트

```typescript
// AutomatedEmailTemplatePreviewDialog.tsx
interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subject: string;
  body: string;
  triggerDays: number;
}

// 변수를 샘플 값으로 치환하여 렌더링
const sampleVariables = {
  user_name: "홍길동",
  days: triggerDays.toString(),
  community_name: "샘플 교회",
  app_url: "https://kworship.app",
  cta_url: "https://kworship.app/set-builder",
};

// dangerouslySetInnerHTML로 HTML 렌더링
<div dangerouslySetInnerHTML={{ __html: replaceVariables(body, sampleVariables) }} />
```

---

## 예상 결과

1. **발송 주기 설정**: 7일 쿨다운 설정 시, 한 사용자가 같은 유형의 이메일을 7일 내 다시 받지 않음
2. **수신자 목록 자동 갱신**: 매일 새로운 조건 충족자가 추가되고, 쿨다운 기간 내 발송받은 사용자는 제외
3. **템플릿 미리보기**: HTML 본문을 실제 렌더링하여 미리 확인 가능
4. **발송 기록**: 모든 발송 기록이 자동 발송 탭에서 조회 가능

---

## 로직 흐름 요약

```text
[매일 09:00 KST 또는 "지금 실행" 클릭]
          │
          ▼
┌─────────────────────────────────┐
│ 1. 조건 충족자 조회              │
│    (trigger_days 이상 미활동)    │
└─────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────┐
│ 2. 쿨다운 필터링                 │
│    (cooldown_days 내 발송자 제외)│
└─────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────┐
│ 3. 최종 수신자 목록              │
│    → 이들에게만 이메일 발송      │
└─────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────┐
│ 4. 발송 기록 저장                │
│    (automated_email_log)         │
└─────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────┐
│ 5. 다음 실행 시                  │
│    쿨다운 기간 내 발송자 제외    │
│    → 새로운 조건 충족자만 발송   │
└─────────────────────────────────┘
```


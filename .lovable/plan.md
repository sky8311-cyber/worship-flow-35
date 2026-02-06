

# 자동 이메일 개별 관리 UI 개선

## 요청 사항
1. ✅ 이메일 종류마다 활성/비활성 토글 - **이미 구현됨**
2. ✅ 기본값 모두 비활성 - **이미 데이터베이스에서 비활성화됨**
3. ❌ 각 항목별 수동 이메일 푸시 버튼 - **추가 필요**

현재는 하나의 "수동 실행" 버튼으로 **모든 활성화된 이메일 타입**을 한번에 발송하는 구조입니다.

---

## 변경 내용

### 1. Edge Function 수정: 특정 타입만 발송 지원

`supabase/functions/process-automated-emails/index.ts`:

```typescript
// Request body로 특정 email_type 받기
const body = await req.json().catch(() => ({}));
const targetEmailType = body.emailType; // 특정 타입만 발송

// 설정 조회 시 필터 적용
let query = supabase
  .from("automated_email_settings")
  .select("*")
  .eq("enabled", true);

// 특정 타입 지정 시 해당 타입만 처리
if (targetEmailType) {
  query = query.eq("email_type", targetEmailType);
}
```

### 2. UI 수정: 각 항목에 개별 발송 버튼 추가

`src/components/admin/email/AutomatedEmailSettings.tsx`:

각 이메일 타입 카드에 **"이 타입만 발송"** 버튼 추가:

```tsx
// 각 카드의 액션 영역에 추가
<Button
  variant="outline"
  size="sm"
  onClick={() => handleRunSingleType(setting.email_type)}
  disabled={!setting.enabled || singleRunMutation.isPending}
>
  <Send className="w-4 h-4 mr-2" />
  {language === "ko" ? "지금 발송" : "Send Now"}
</Button>
```

### 3. 개별 발송 확인 다이얼로그

발송 전 해당 타입의 수신자 수를 확인하는 다이얼로그:

```
┌────────────────────────────────────────┐
│ ⚠️ 이메일 발송 확인                      │
├────────────────────────────────────────┤
│                                        │
│ "미접속자 리마인더" 이메일을 발송합니다.   │
│                                        │
│ ┌──────────────────────────────────┐   │
│ │ 발송 대상: 42명                   │   │
│ └──────────────────────────────────┘   │
│                                        │
│              [취소]  [발송 실행]        │
└────────────────────────────────────────┘
```

---

## 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `supabase/functions/process-automated-emails/index.ts` | `emailType` 파라미터 추가, 특정 타입만 필터링 |
| `src/components/admin/email/AutomatedEmailSettings.tsx` | 개별 발송 버튼 추가, 확인 다이얼로그 |

---

## UI 레이아웃 변경

### 변경 전 (현재)
```
┌─────────────────────────────────────────────────────┐
│ 🔔 미접속자 리마인더                    [활성] [◀▶] │
│    일정 기간 로그인하지 않은 사용자에게 발송          │
│    대상: 25명                                       │
│                                                     │
│    [수신자 보기] [템플릿 미리보기]          [저장]    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│ ⚠️ 자동 발송이 비활성화되었습니다. 수동으로만 실행    │
│    가능합니다.                                       │
│                                                     │
│    마지막 실행: 2025-02-05 16:01               [수동 실행] │
└─────────────────────────────────────────────────────┘
```

### 변경 후 (제안)
```
┌─────────────────────────────────────────────────────┐
│ 🔔 미접속자 리마인더                    [활성] [◀▶] │
│    일정 기간 로그인하지 않은 사용자에게 발송          │
│    대상: 25명                                       │
│                                                     │
│    [수신자 보기] [템플릿 미리보기] [지금 발송]  [저장] │
│                                   ^^^^^^^^^^        │
│                                   새로 추가!        │
└─────────────────────────────────────────────────────┘
```

---

## 기술 상세

### Edge Function 변경사항

```typescript
// process-automated-emails/index.ts

const handler = async (req: Request): Promise<Response> => {
  // ... MANUAL_MODE_ONLY 체크 유지

  // Request body에서 특정 타입 추출
  let targetEmailType: string | null = null;
  try {
    const body = await req.json();
    targetEmailType = body.emailType || null;
  } catch {
    // No body or invalid JSON - process all enabled types
  }

  // 설정 조회
  let settingsQuery = supabase
    .from("automated_email_settings")
    .select("*")
    .eq("enabled", true);
  
  if (targetEmailType) {
    settingsQuery = settingsQuery.eq("email_type", targetEmailType);
    console.log(`Single type mode: processing only ${targetEmailType}`);
  }
  
  const { data: settings } = await settingsQuery;
  // ... 나머지 로직 동일
};
```

### UI 변경사항

```tsx
// AutomatedEmailSettings.tsx

// 개별 발송 상태
const [singleRunType, setSingleRunType] = useState<string | null>(null);

// 개별 발송 mutation
const singleRunMutation = useMutation({
  mutationFn: async (emailType: string) => {
    const response = await supabase.functions.invoke("process-automated-emails", {
      body: { emailType },
    });
    if (response.error) throw response.error;
    return response.data;
  },
  onSuccess: (data, emailType) => {
    const count = data.results?.[emailType]?.sent || 0;
    toast.success(
      language === "ko" 
        ? `${emailTypeInfo[emailType]?.titleKo} 발송 완료: ${count}명`
        : `${emailTypeInfo[emailType]?.title} sent: ${count} recipients`
    );
    queryClient.invalidateQueries({ queryKey: ["automated-email-log"] });
  },
});

// 카드 액션 영역에 버튼 추가
<Button
  variant="outline"
  size="sm"
  onClick={() => setSingleRunType(setting.email_type)}
  disabled={!setting.enabled || singleRunMutation.isPending}
>
  <Send className="w-4 h-4 mr-2" />
  {language === "ko" ? "지금 발송" : "Send Now"}
</Button>
```

---

## 기대 결과

| 기능 | 변경 전 | 변경 후 |
|-----|--------|--------|
| 개별 활성/비활성 | ✅ 지원 | ✅ 유지 |
| 기본 비활성 | ✅ DB에서 비활성화 | ✅ 유지 |
| 개별 수동 발송 | ❌ 불가 (전체만 가능) | ✅ 각 타입별 버튼 |
| 전체 수동 발송 | ✅ 하단 버튼 | ✅ 유지 (선택적) |


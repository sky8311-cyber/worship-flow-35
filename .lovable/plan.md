
# 수동 이메일 주소 입력 기능 추가 계획

## 현재 상황
- 이메일 발송 시 세그먼트(티어별, 활동 상태별 등)를 선택해야만 수신자 지정 가능
- 특정 이메일 주소(예: `sky@goodpapa.org`)를 직접 입력하는 방법이 없음
- 데이터베이스에 등록되지 않은 사용자에게는 이메일 발송 불가

## 구현 계획

### 1. UI 변경 - RecipientSelector.tsx

**새로운 카테고리 추가: "수동 입력"**

```text
📋 수신자 선택
├── 👥 전체 사용자
├── 🎫 플랫폼 티어별
├── 📈 활동 상태별
├── 🏠 커뮤니티 참여 상태별
├── ⚡ 특정 활동별
├── 🏢 특정 커뮤니티
└── ✍️ 수동 입력 (NEW!)
```

**수동 입력 UI:**
- 이메일 주소 입력 필드 (Textarea)
- 콤마(,) 또는 줄바꿈으로 여러 이메일 구분
- 입력된 이메일 수 실시간 표시
- 잘못된 형식의 이메일 경고 표시

### 2. 인터페이스 확장 - RecipientFilter 타입

```typescript
// 기존
interface RecipientFilter {
  type: "segment" | "specific_community";
  rpcFunction?: string;
  rpcParam?: string;
  communityId?: string;
}

// 확장
interface RecipientFilter {
  type: "segment" | "specific_community" | "manual";  // ← "manual" 추가
  rpcFunction?: string;
  rpcParam?: string;
  communityId?: string;
  manualEmails?: string[];  // ← 수동 입력 이메일 배열 추가
}
```

### 3. Edge Function 수정 - send-admin-email/index.ts

**수동 이메일 처리 로직 추가:**

```typescript
// recipientFilter.type === "manual" 인 경우
if (recipientFilter.type === "manual" && recipientFilter.manualEmails) {
  // DB에서 해당 이메일의 프로필 정보 조회 (있으면 이름 사용)
  const { data: existingProfiles } = await supabaseClient
    .from("profiles")
    .select("id, email, full_name")
    .in("email", recipientFilter.manualEmails);
  
  const existingEmailMap = new Map(
    (existingProfiles || []).map(p => [p.email, p])
  );
  
  // 모든 수동 입력 이메일을 수신자로 추가
  recipients = recipientFilter.manualEmails.map(email => {
    const profile = existingEmailMap.get(email);
    return {
      user_id: profile?.id || null,
      id: profile?.id || null,
      email: email,
      full_name: profile?.full_name || null,
    };
  });
}
```

### 4. 파일 변경 목록

| 파일 | 변경 내용 |
|------|----------|
| `src/components/admin/email/RecipientSelector.tsx` | 수동 입력 카테고리 및 Textarea UI 추가 |
| `src/components/admin/email/EmailComposer.tsx` | 수동 이메일 수 계산 로직 추가 |
| `supabase/functions/send-admin-email/index.ts` | `type: "manual"` 처리 로직 추가 |

---

## UI 디자인 (RecipientSelector)

```text
┌─────────────────────────────────────────────┐
│  👤 수신자 선택                              │
├─────────────────────────────────────────────┤
│                                             │
│  카테고리: [수동 입력 ▼]                     │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │ 이메일 주소 입력                      │    │
│  │ (콤마 또는 줄바꿈으로 구분)            │    │
│  ├─────────────────────────────────────┤    │
│  │ sky@goodpapa.org                    │    │
│  │ user1@example.com                   │    │
│  │ test@test.com                       │    │
│  │                                     │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ⚠️ 1개 형식 오류: "invalid-email"          │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │               3                      │    │
│  │            수신자                     │    │
│  └─────────────────────────────────────┘    │
│                                             │
└─────────────────────────────────────────────┘
```

---

## 이메일 유효성 검사

```typescript
const validateEmails = (input: string): { valid: string[]; invalid: string[] } => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const emails = input
    .split(/[,\n]/)
    .map(e => e.trim())
    .filter(e => e.length > 0);
  
  const valid = emails.filter(e => emailRegex.test(e));
  const invalid = emails.filter(e => !emailRegex.test(e));
  
  return { valid, invalid };
};
```

---

## 예상 결과

1. **수동 이메일 발송 가능**: `sky@goodpapa.org` 같은 특정 이메일 직접 입력 가능
2. **외부 이메일도 발송 가능**: DB에 등록되지 않은 이메일도 발송 가능
3. **기존 기능 유지**: 세그먼트 기반 발송 기능은 그대로 유지
4. **유효성 검사**: 잘못된 형식의 이메일은 경고 표시

---

## 보안 고려사항

- 관리자 권한 확인은 기존과 동일하게 유지
- 수동 입력 이메일도 동일한 발송 로그에 기록
- 이메일 형식 유효성 검사로 잘못된 입력 방지

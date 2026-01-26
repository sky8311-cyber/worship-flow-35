
# 이메일 발송 전 수신자 명단 확인 기능

## 현재 상황
- 수신자 선택 시 **숫자만** 표시됨 (예: "95 수신자")
- 발송 확인 다이얼로그에서도 **명단 확인 불가**
- 어떤 사용자에게 발송되는지 정확히 알 수 없음

## 구현 계획

### 1. 수신자 명단 미리보기 버튼 추가

RecipientSelector 하단에 "수신자 명단 보기" 버튼을 추가합니다.

```text
┌─────────────────────────────────┐
│  👤 수신자 선택                  │
├─────────────────────────────────┤
│  카테고리: [플랫폼 티어별 ▼]     │
│  세부 그룹: [예배인도자 ▼]       │
│                                 │
│        ┌─────────┐              │
│        │   95    │              │
│        │  수신자  │              │
│        └─────────┘              │
│                                 │
│  [👁️ 수신자 명단 보기]          │  ← NEW!
└─────────────────────────────────┘
```

### 2. 수신자 명단 다이얼로그

버튼 클릭 시 수신자 전체 목록을 표시하는 다이얼로그:

```text
┌──────────────────────────────────────────┐
│  📋 수신자 명단 (95명)                    │
├──────────────────────────────────────────┤
│  🔍 [검색...]                            │
│                                          │
│  ┌────────────────────────────────────┐  │
│  │ ☑ 전체 선택                        │  │
│  ├────────────────────────────────────┤  │
│  │ ☑ 김철수    kim@example.com       │  │
│  │ ☑ 이영희    lee@example.com       │  │
│  │ ☑ 박민수    park@example.com      │  │
│  │ ☑ 최광은    sky@goodpapa.org      │  │
│  │ ...                                │  │
│  └────────────────────────────────────┘  │
│                                          │
│  선택됨: 95/95                           │
│                                          │
│           [취소]    [확인]               │
└──────────────────────────────────────────┘
```

### 3. 수신자 개별 제외 기능

- 체크박스로 특정 수신자를 제외 가능
- 검색 필터로 이름/이메일 검색
- "전체 선택/해제" 기능

### 4. 발송 확인 다이얼로그 개선

기존 확인 다이얼로그에도 수신자 요약 추가:

```text
┌──────────────────────────────────────────┐
│  ⚠️ 이메일 발송 확인                      │
├──────────────────────────────────────────┤
│  95명에게 이메일을 발송합니다.            │
│                                          │
│  ▼ 수신자 목록 미리보기                   │
│  ┌────────────────────────────────────┐  │
│  │ kim@example.com                    │  │
│  │ lee@example.com                    │  │
│  │ park@example.com                   │  │
│  │ ... 외 92명                        │  │
│  └────────────────────────────────────┘  │
│                                          │
│  예상 소요 시간: 약 2초                  │
│  ⚠️ 발송 후 취소할 수 없습니다.           │
│                                          │
│           [취소]    [발송]               │
└──────────────────────────────────────────┘
```

---

## 파일 변경 목록

| 파일 | 변경 내용 |
|------|----------|
| `src/components/admin/email/RecipientSelector.tsx` | 수신자 명단 보기 버튼 및 다이얼로그 추가 |
| `src/components/admin/email/EmailComposer.tsx` | 확인 다이얼로그에 수신자 미리보기 추가 |
| `src/components/admin/email/RecipientListDialog.tsx` | 새 파일 - 수신자 명단 다이얼로그 컴포넌트 |

---

## 기술 구현 세부사항

### RecipientListDialog 컴포넌트

```typescript
interface Recipient {
  id: string;
  email: string;
  full_name: string | null;
}

interface RecipientListDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filter: RecipientFilter;
  onConfirm?: (selectedEmails: string[]) => void;  // 선택적: 제외 기능 사용 시
}
```

### 수신자 목록 조회 로직

현재 `recipient-count` 쿼리를 확장하여 실제 수신자 데이터를 가져옵니다:

```typescript
// 세그먼트 타입별 수신자 조회
if (filter.type === "segment") {
  const result = await supabase.rpc(filter.rpcFunction, { 
    tier_type: filter.rpcParam 
  });
  return result.data; // [{id, email, full_name}, ...]
}

// 특정 커뮤니티
if (filter.type === "specific_community") {
  const { data } = await supabase
    .from("community_members")
    .select("profiles(id, email, full_name)")
    .eq("community_id", filter.communityId);
  return data.map(m => m.profiles);
}

// 수동 입력
if (filter.type === "manual") {
  return filter.manualEmails.map(email => ({ 
    id: null, 
    email, 
    full_name: null 
  }));
}
```

### 검색 및 필터링

```typescript
const filteredRecipients = recipients.filter(r => 
  r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
  r.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
);
```

---

## 예상 결과

1. **수신자 명단 확인**: 발송 전 정확히 누구에게 발송되는지 확인 가능
2. **개별 제외**: 특정 수신자를 발송 대상에서 제외 가능
3. **검색 기능**: 대량 수신자 중 특정 사용자 검색 가능
4. **발송 확인 개선**: 최종 확인 단계에서 요약 목록 표시

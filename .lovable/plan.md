

# 어드민 고객상담 모바일 채팅 UI 수정

## 문제 분석

스크린샷에서 확인된 현상:
1. **입력창이 화면 하단에 가려짐** - BottomTabNavigation과 AdminLayout의 패딩으로 인해 채팅 입력창이 보이지 않음
2. **키보드 올라올 때 화면 위로 튐** - 모바일 뷰포트 처리가 제대로 되지 않음

**원인 분석:**
```text
┌─────────────────────────────────────┐
│ AdminNav (상단 탭 바)               │
├─────────────────────────────────────┤
│ 헤더 (임채현 정보)                  │
├─────────────────────────────────────┤
│                                     │
│      메시지가 없습니다              │  ← 채팅 영역
│                                     │
├─────────────────────────────────────┤
│ (입력창 - 보이지 않음)              │  ← ❌ pb-36 패딩에 의해 가려짐
├─────────────────────────────────────┤
│ BottomTabNavigation                 │
└─────────────────────────────────────┘
```

현재 코드 문제:
```tsx
// AdminSupport.tsx 라인 285-288
<div className={cn(
  "flex h-[calc(100vh-8rem)]",  // 고정 높이, 모바일 고려 안됨
  isMobile ? "flex-col" : "flex-row gap-4"
)}>
```

---

## 해결 방안

### 1. 모바일 채팅 패널 전체화면 처리

모바일에서 대화 선택 시 채팅 패널을 **전체 화면 오버레이**로 표시하여 BottomTabNavigation과 패딩 문제를 해결합니다.

```tsx
// AdminSupport.tsx

// 모바일에서 대화 선택 시 - 전체화면 오버레이로 표시
{isMobile && selectedConversation && (
  <div className="fixed inset-0 z-50 bg-background flex flex-col">
    {/* 채팅 헤더 */}
    <div className="p-3 border-b flex items-center gap-3 shrink-0">
      <Button variant="ghost" size="icon" onClick={() => setSelectedConversation(null)}>
        <ChevronLeft className="h-5 w-5" />
      </Button>
      {/* 사용자 정보 */}
    </div>
    
    {/* 메시지 영역 - flex-1로 남은 공간 차지 */}
    <div className="flex-1 overflow-y-auto p-4 min-h-0 overscroll-contain">
      {/* 메시지들 */}
    </div>
    
    {/* 입력 영역 - 하단에 고정 */}
    <div className="border-t bg-background shrink-0 pb-safe">
      <SupportChatInput />
    </div>
  </div>
)}
```

### 2. SupportChatInput 키보드 처리 개선

```tsx
// SupportChatInput.tsx

<Input
  // ...
  onFocus={(e) => {
    // 모바일 키보드가 올라오면 입력창이 보이도록 스크롤
    setTimeout(() => {
      e.target.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 350);  // 키보드 애니메이션 대기
  }}
/>
```

### 3. AdminLayout에서 모바일 채팅 시 패딩 조절

```tsx
// AdminLayout.tsx 또는 AdminSupport.tsx

// 채팅 전체화면 모드에서는 BottomTabNavigation 숨김 처리
```

---

## 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/pages/AdminSupport.tsx` | 모바일 채팅 뷰를 전체화면 오버레이로 변경, dvh 단위 사용 |
| `src/components/support/SupportChatInput.tsx` | 키보드 포커스 처리 개선 |

---

## 예상 결과

```text
수정 전:
┌─────────────────────────┐
│ 어드민 탭              │
│ 헤더 (임채현)          │
│                        │
│   메시지가 없습니다    │
│                        │
│   (입력창 가려짐)      │ ← ❌
│ BottomNav              │
└─────────────────────────┘

수정 후:
┌─────────────────────────┐
│ ← 임채현               │  ← 전체화면 오버레이
│   lbarham31@gmail.com  │
├─────────────────────────┤
│                        │
│   메시지가 없습니다    │  ← 메시지 영역 (스크롤)
│                        │
├─────────────────────────┤
│ [📷] 메시지 입력... [→]│  ← ✅ 입력창 항상 보임
└─────────────────────────┘
```

키보드 올라올 때:
```text
┌─────────────────────────┐
│ ← 임채현               │
├─────────────────────────┤
│   이전 메시지들...     │
├─────────────────────────┤
│ [📷] 메시지 입력... [→]│  ← 키보드 위에 고정
├─────────────────────────┤
│                        │
│      키보드 영역       │
│                        │
└─────────────────────────┘
```

이 수정으로 모바일에서 채팅 입력창이 항상 보이고, 키보드가 올라와도 화면이 위로 튀지 않게 됩니다.


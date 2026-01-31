
# 모바일 키보드 동작 개선 - 채팅 콘텐츠 고정

## 문제 분석

현재 동작:
- 모바일에서 채팅 입력창 포커스 시 키보드가 **화면 전체를 위로 밀어올림**
- 이로 인해 채팅 콘텐츠가 위로 튀어오르는 현상 발생

원하는 동작:
- 채팅 콘텐츠는 **고정된 상태로 유지**
- 키보드만 화면 하단에서 올라옴

## 원인

iOS Safari와 일부 Android 브라우저에서는 기본적으로 input 포커스 시:
1. 뷰포트 전체가 키보드 높이만큼 축소됨
2. `scrollIntoView`가 호출되면 추가로 화면이 이동함

현재 코드 문제점:
```tsx
// ChatInput.tsx (라인 225-229)
onFocus={(e) => {
  setTimeout(() => {
    e.target.scrollIntoView({ block: "end", behavior: "smooth" });
  }, 300);
}}

// SupportChatInput.tsx (라인 117-123)
onFocus={(e) => {
  const isInsideOverlay = e.target.closest('[data-support-overlay]');
  if (!isInsideOverlay) {
    setTimeout(() => {
      e.target.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 300);
  }
}}
```

## 해결 방안

### 1. `scrollIntoView` 제거/조건부 적용

채팅 UI에서는 입력창이 이미 하단에 고정되어 있으므로 `scrollIntoView`가 불필요합니다.
- 채팅/고객상담 화면에서는 `scrollIntoView` 비활성화
- 일반 페이지에서만 필요시 활성화

### 2. CSS `position: fixed` + `bottom: 0` 활용

입력창이 키보드 위에 자연스럽게 위치하도록:
- 입력 영역에 `position: sticky` 또는 `fixed` 사용
- iOS에서는 `visualViewport` API를 활용하여 키보드 높이에 맞춤

### 3. 채팅 영역 레이아웃 개선

```text
┌─────────────────────────────┐
│ 헤더                        │ ← shrink-0
├─────────────────────────────┤
│                             │
│   채팅 메시지들             │ ← flex-1 overflow-y-auto
│   (스크롤 가능)             │
│                             │
├─────────────────────────────┤
│ 입력창                      │ ← shrink-0, 하단 고정
└─────────────────────────────┘
     ↑
     키보드가 이 아래에서 올라옴
     (콘텐츠는 움직이지 않음)
```

---

## 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/components/dashboard/ChatInput.tsx` | `scrollIntoView` 제거, 채팅 drawer 내부에서는 스크롤 트리거 비활성화 |
| `src/components/support/SupportChatInput.tsx` | 고객상담 오버레이 내부에서도 동일하게 처리 (이미 일부 적용됨, 추가 보완) |
| `src/components/chat/ChatFullScreenOverlay.tsx` | DrawerContent에 data attribute 추가하여 내부 입력창 감지 가능하게 함 |
| `src/components/dashboard/ChatFeed.tsx` | 스크롤 컨테이너에 overscroll-behavior 추가로 전파 방지 |
| `src/pages/AdminSupport.tsx` | 모바일 오버레이 입력 영역 레이아웃 최적화 |

---

## 구현 세부 사항

### ChatInput.tsx 수정

```tsx
<Input
  // ...
  onFocus={(e) => {
    // 채팅 drawer/overlay 내부에서는 scrollIntoView 스킵
    const isInsideChatOverlay = e.target.closest('[data-chat-overlay]');
    if (isInsideChatOverlay) return;
    
    // 일반 페이지에서만 필요시 적용 (선택적)
    // setTimeout(() => {
    //   e.target.scrollIntoView({ block: "center", behavior: "smooth" });
    // }, 300);
  }}
/>
```

### ChatFullScreenOverlay.tsx 수정

```tsx
<DrawerContent 
  className="h-[85dvh] max-h-[85dvh] flex flex-col"
  data-chat-overlay  // ← 추가
>
```

### SupportChatInput.tsx 수정

```tsx
onFocus={(e) => {
  // 고객상담 오버레이 내부면 스킵 (기존 로직 유지)
  const isInsideOverlay = e.target.closest('[data-support-overlay]');
  if (isInsideOverlay) return;
  
  // 채팅 drawer 내부도 스킵
  const isInsideChatOverlay = e.target.closest('[data-chat-overlay]');
  if (isInsideChatOverlay) return;
  
  // 그 외에는 스크롤 (필요시)
}}
```

---

## 예상 결과

```text
수정 전:
┌──────────────────┐
│ 헤더            │
│                 │  ← 키보드가 올라오면 전체가 위로 튐
│ 메시지들        │
│                 │
│ 입력창          │
├──────────────────┤
│    키보드       │
└──────────────────┘

수정 후:
┌──────────────────┐
│ 헤더            │  ← 고정
│                 │
│ 메시지들        │  ← 고정 (필요시 스크롤만)
│                 │
│ 입력창          │  ← 고정
├──────────────────┤
│    키보드       │  ← 키보드만 올라옴
└──────────────────┘
```

이 수정으로 채팅/고객상담 화면에서 키보드가 올라와도 콘텐츠가 위로 튀지 않고 안정적으로 유지됩니다.

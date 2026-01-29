

# 모바일 키보드 뷰포트 밀림 방지 수정

## 문제 분석

스크린샷에서 확인된 현상:
- iOS Safari에서 키보드가 열리면 전체 뷰포트가 위로 밀려 올라감
- 드로어의 상단(탭 헤더 포함)이 화면 밖으로 사라짐
- 메시지 영역 상단이 잘려 보이지 않음

**원인:**
iOS Safari의 기본 동작으로, 입력 필드에 포커스가 가면 해당 요소가 화면 중앙에 오도록 뷰포트 전체를 스크롤합니다. 드로어가 `h-[85vh]`로 설정되어 있어 키보드 높이만큼 위로 밀려버립니다.

---

## 해결 방안

### 1. 드로어 컨테이너에 고정 포지셔닝 강화

`ChatFullScreenOverlay.tsx`의 드로어 컨텐츠에 키보드 대응 스타일 적용:

**변경 내용:**
```typescript
// 변경 전
<DrawerContent className="h-[85vh] max-h-[85vh]">

// 변경 후
<DrawerContent className="h-[85dvh] max-h-[85dvh]">
```

`vh` 대신 `dvh` (dynamic viewport height) 사용 - 키보드 포함 동적 뷰포트 높이

### 2. 입력 필드에 키보드 스크롤 방지 속성 추가

`SupportChatInput.tsx`와 `ChatInput.tsx`의 Input에 `enterKeyHint` 및 포커스 핸들러 추가:

**변경 내용:**
```typescript
<Input
  ...
  enterKeyHint="send"
  onFocus={(e) => {
    // 약간의 딜레이 후 입력 필드가 보이도록 스크롤 위치 조정
    setTimeout(() => {
      e.target.scrollIntoView({ block: "end", behavior: "smooth" });
    }, 300);
  }}
/>
```

### 3. 드로어 레이아웃 개선

드로어 내부 구조를 flex 기반으로 최적화하여 키보드가 열려도 헤더가 항상 보이도록 함:

**`ChatFullScreenOverlay.tsx` 변경:**
```typescript
<DrawerContent className="h-[85dvh] max-h-[85dvh] flex flex-col">
  <DrawerHeader className="border-b py-0 px-0 shrink-0">
    {/* 헤더 내용 */}
  </DrawerHeader>
  <div className="flex-1 overflow-hidden min-h-0 flex flex-col">
    {activeTab === "community" ? <ChatFeed /> : <SupportChatFeed />}
  </div>
</DrawerContent>
```

### 4. 메시지 영역에 overscroll-behavior 추가

**`SupportChatFeed.tsx` 변경:**
```typescript
// 변경 전
<div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">

// 변경 후
<div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0 overscroll-contain">
```

`overscroll-contain`으로 스크롤이 상위 요소로 전파되는 것을 방지

---

## 파일 변경 요약

| 파일 | 변경 내용 |
|------|----------|
| `src/components/chat/ChatFullScreenOverlay.tsx` | `vh` → `dvh` 단위 변경, flex 레이아웃 강화 |
| `src/components/support/SupportChatFeed.tsx` | `overscroll-contain` 추가 |
| `src/components/support/SupportChatInput.tsx` | 포커스 시 스크롤 위치 조정 핸들러 추가 |
| `src/components/dashboard/ChatFeed.tsx` | `overscroll-contain` 추가 |
| `src/components/dashboard/ChatInput.tsx` | 포커스 시 스크롤 위치 조정 핸들러 추가 |

---

## 예상 결과

```text
수정 후:

1. 채팅 드로어 열기
2. 입력 필드 탭 → 키보드 열림
3. 드로어 헤더 (커뮤니티/고객지원 탭) → 계속 화면에 표시됨 ✓
4. 메시지 영역 → 키보드 위에 올바르게 표시됨 ✓
5. 스크롤 → 메시지 전체 확인 가능 ✓
```


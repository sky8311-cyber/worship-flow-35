
## Goals
1) Admin 계정에서 하단 네비게이션 “채팅” 라벨을 “고객상담”으로 변경  
2) 모바일 `/admin/support` 고객상담 화면에서 **채팅 입력창이 하단 네비게이션에 가려지는 문제**를 확실히 해결 (현재 스크린샷처럼 BottomNav가 위에 떠서 입력창이 가려짐)

---

## What’s happening (root cause)
### A) 라벨 문제
- `BottomTabNavigation.tsx`의 채팅 탭 라벨이 항상 `chatItem.label_key`(= `navigation.chat` → “채팅”)를 사용하고 있음.
- Admin일 때만 라벨을 override 해야 함.

### B) 입력창이 가려지는 문제 (중요)
- `AdminSupport.tsx` 모바일 전체화면 오버레이가 `z-50`이고,
- `BottomTabNavigation`도 `z-50`인데, **DOM 상 BottomNav가 뒤에서 렌더링되어(레이아웃에서 children 다음에 BottomNav 렌더)** 동일 z-index일 경우 BottomNav가 오버레이 위로 올라와 입력창을 덮을 수 있음.
- 스크린샷 상황이 정확히 이 케이스로 보임.

---

## Implementation Plan

### 1) Admin 하단 탭 라벨을 “고객상담”으로 표시 (Admin only)
**파일:** `src/components/layout/BottomTabNavigation.tsx`

- 채팅 탭 라벨 렌더링 부분을 아래처럼 변경:
  - `isAdmin === true` → `t("navigation.customerSupport")`
  - 그 외 → 기존대로 `t(chatItem.label_key)`

이렇게 하면 “채팅” UI는 일반 유저 유지, 어드민만 “고객상담” 표시.

---

### 2) 번역 키 추가 (KOR/ENG)
**파일:** `src/lib/translations.ts`

- `navigation.customerSupport` 키를 추가:
  - ko: `"고객상담"`
  - en: `"Support"` (또는 원하시면 `"Customer Support"`)

이렇게 하면 다국어 구조/타이핑(`TranslationPath`)도 깔끔하게 유지됩니다.

---

### 3) AdminSupport 모바일 전체화면 오버레이가 BottomNav보다 항상 위에 오도록 보장
**파일:** `src/pages/AdminSupport.tsx`

- 모바일 오버레이 컨테이너:
  ```tsx
  <div className="fixed inset-0 z-50 ...">
  ```
  를 **z-index를 더 높게** 바꿉니다. 예:
  - `z-[60]` 또는 `z-[100]`

이 변경으로:
- 오버레이가 BottomNav를 완전히 덮어서 입력창이 가려지지 않음
- 고객상담 대화에 들어가면 “채팅 앱”처럼 자연스럽게 전체화면 경험이 됨

---

### 4) (권장) 입력 포커스 시 화면이 튀는 문제 완화 (iOS Safari 대응)
**파일:** `src/components/support/SupportChatInput.tsx` (+ `AdminSupport.tsx`에 data attribute 1줄 추가)

현재 `SupportChatInput`은 `onFocus`에서 `scrollIntoView({ block: "end" })`를 호출하고 있어, 고정 오버레이 UI에서는 오히려 “화면이 위로 튀는” 느낌을 만들 수 있습니다.

- `AdminSupport` 모바일 오버레이 최상단에 `data-support-overlay` 같은 attribute를 추가
- `SupportChatInput`의 `onFocus`에서:
  - 입력창이 `data-support-overlay` 내부면 `scrollIntoView`를 **스킵**
  - 그 외 일반 페이지에서는 `block: "center"` 정도로 완화하거나(필요시) 유지

이렇게 하면:
- 고객상담 오버레이 내부에서는 불필요한 스크롤 트리거가 사라져 안정적
- 다른 화면에서 “입력창이 화면 아래로 숨어서 안 보이는” 케이스에는 기존 동작을 일부 유지 가능

---

## Files to change
1) `src/components/layout/BottomTabNavigation.tsx`
2) `src/lib/translations.ts`
3) `src/pages/AdminSupport.tsx`
4) `src/components/support/SupportChatInput.tsx` (권장 안정화)

---

## Acceptance checklist (what you should verify after implementation)
1) Admin 계정: BottomNav 채팅 아이콘 텍스트가 “고객상담”으로 보임  
2) 일반 계정: 기존처럼 “채팅” 유지  
3) 모바일 `/admin/support`에서 대화 선택 시:
   - 입력창이 **절대** BottomNav에 가려지지 않음
   - (가능하면) 키보드 올릴 때 화면이 불필요하게 위로 “튐”이 줄어듦  
4) 뱃지(unread) 스타일/위치는 지금과 동일하게 유지되며 숫자만 정상 표시

---

## Technical notes (why this is the safest fix)
- z-index 충돌은 “가끔”이 아니라 **환경/브라우저/렌더 순서에 따라 항상 재현 가능한 구조적 문제**라서, 오버레이 z-index를 확실히 높이는 게 가장 안정적입니다.
- 라벨 변경은 DB 네비게이션 구조를 건드리지 않고, UI에서만 Admin 조건으로 override 하므로 리스크가 낮습니다.

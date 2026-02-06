

# 하단 네비게이션 위치 이탈 + 악보 미리보기 X 버튼 안보임 수정

## 문제 분석

### 스크린샷에서 확인된 문제
1. **BottomTabNavigation이 화면 바닥에서 떨어짐**: iOS Safari에서 스크롤 시 주소창이 나타났다 사라지면서 `fixed bottom-0`가 실제 화면 바닥이 아닌 곳에 위치
2. **ScorePreviewDialog가 전체화면을 덮지 못함**: 요약 바와 하단 네비게이션이 악보 미리보기 뒤에 보이며, X 버튼이 화면 밖으로 밀려남

### 근본 원인

**Dialog.tsx 기본 스타일 충돌:**
```tsx
// 기본 스타일 (line 43)
"fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]"

// ScorePreviewDialog에서 오버라이드 시도
"inset-0 translate-x-0 translate-y-0"
```

Tailwind에서 `inset-0`과 `left-[50%]`가 동시에 적용되면, 마지막에 정의된 값이 우선하지만 **클래스 순서**에 따라 예측 불가능한 결과 발생.

**BottomTabNavigation iOS 문제:**
- `fixed bottom-0`는 iOS Safari의 동적 뷰포트(주소창 표시/숨김)에서 불안정
- `env(safe-area-inset-bottom)`만으로는 해결되지 않음

---

## 해결 방안

### 1. ScorePreviewDialog - 명시적 CSS 속성으로 재정의

`inset-0`이 아닌 **명시적인 `top-0 left-0 right-0 bottom-0`**를 사용하고, 중요도를 높이기 위해 인라인 스타일 병행:

```tsx
// ScorePreviewDialog.tsx
<DialogContent 
  hideCloseButton={isMobile}
  className={cn(
    "flex flex-col",
    // Mobile: 명시적 fullscreen 
    "!fixed !top-0 !left-0 !right-0 !bottom-0",
    "!translate-x-0 !translate-y-0",
    "w-full h-[100dvh] max-w-full max-h-[100dvh] rounded-none p-4",
    // Desktop
    "sm:!left-[50%] sm:!top-[50%] sm:!right-auto sm:!bottom-auto",
    "sm:!translate-x-[-50%] sm:!translate-y-[-50%]",
    "sm:max-w-4xl sm:max-h-[90vh] sm:h-auto sm:rounded-xl sm:p-6"
  )}
>
```

**`!important` 사용 이유**: 기본 DialogContent의 `left-[50%] top-[50%]`를 확실히 재정의하기 위함.

### 2. BottomTabNavigation - iOS Safari 안정화

`position: fixed`와 `bottom: 0`를 유지하면서 iOS의 동적 뷰포트 문제를 해결:

```tsx
// BottomTabNavigation.tsx
<nav 
  className="fixed inset-x-0 bottom-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border/50"
  style={{
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    // iOS Safari 안정화: GPU 가속 + 위치 고정
    transform: 'translate3d(0, 0, 0)',
    WebkitTransform: 'translate3d(0, 0, 0)',
    // 동적 뷰포트에서 항상 바닥에 고정
    position: 'fixed',
    bottom: 0,
  }}
>
```

추가로 `100dvh` 사용 고려 (Dynamic Viewport Height - iOS Safari에서 주소창 상태에 따라 자동 조정).

### 3. AppLayout - 하단 여백 조정

현재 AppLayout에서 main의 `paddingBottom`이 고정값을 사용 중:

```tsx
// 현재
return 'max(9rem, calc(6rem + env(safe-area-inset-bottom, 0px)))';
```

이 값이 BottomTabNavigation의 실제 높이와 동기화되어야 함. 네비게이션 높이(h-14 = 3.5rem)와 safe area를 반영:

```tsx
// 개선
return 'calc(3.5rem + env(safe-area-inset-bottom, 0px) + 1rem)'; // nav + safe area + margin
```

---

## 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/components/ScorePreviewDialog.tsx` | `!important` prefix로 모바일 전체화면 스타일 강제 적용 |
| `src/components/layout/BottomTabNavigation.tsx` | `translate3d` 사용 및 인라인 스타일 강화 |
| `src/components/ui/dialog.tsx` | 모바일 전체화면 케이스를 위한 조건부 스타일 지원 (선택적) |

---

## 기대 결과

| 항목 | 수정 전 | 수정 후 |
|-----|--------|--------|
| BottomNav 위치 | 스크롤 시 화면에서 떨어짐 | 항상 화면 바닥에 고정 |
| 악보 미리보기 | 하단 요약바/네비게이션이 보임 | 전체화면으로 모든 요소 가림 |
| X 닫기 버튼 | 화면 밖으로 밀려남 | 항상 우측 상단에 표시 |

---

## 코드 변경 상세

### ScorePreviewDialog.tsx (lines 118-131)

```tsx
<DialogContent 
  hideCloseButton={isMobile}
  className={cn(
    "flex flex-col",
    // Mobile: force fullscreen with !important to override base dialog styles
    "!fixed !top-0 !left-0 !right-0 !bottom-0",
    "!translate-x-0 !translate-y-0",
    "w-full h-[100dvh] max-w-full max-h-full rounded-none p-4",
    // Desktop: restore centered modal positioning
    "sm:!left-[50%] sm:!top-[50%] sm:!right-auto sm:!bottom-auto",
    "sm:!translate-x-[-50%] sm:!translate-y-[-50%]",
    "sm:max-w-4xl sm:max-h-[90vh] sm:h-auto sm:rounded-xl sm:p-6"
  )}
>
```

### BottomTabNavigation.tsx (lines 156-162)

```tsx
<nav 
  className="fixed inset-x-0 bottom-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border/50"
  style={{
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    transform: 'translate3d(0, 0, 0)',
    WebkitTransform: 'translate3d(0, 0, 0)',
    willChange: 'transform',
  }}
>
```


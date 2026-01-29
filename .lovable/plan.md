
# 채팅 드로어 내 입력 필드 포커스 시 하단 네비게이션 사라지는 버그 수정

## 문제 원인

`BottomTabNavigation.tsx`에서 키보드 감지를 위해 document 레벨에서 `focusin`/`focusout` 이벤트를 감지합니다:

```typescript
const handleFocusIn = (e: FocusEvent) => {
  const target = e.target as HTMLElement;
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
    setKeyboardVisible(true);  // ← 모든 입력 필드에서 발생
  }
};
```

그리고 `keyboardVisible`이 `true`가 되면 네비게이션을 완전히 언마운트합니다:

```typescript
if (keyboardVisible) {
  return null;  // ← 네비게이션 완전 제거
}
```

**문제점:** 드로어(Drawer) 내부의 입력 필드에 포커스가 가도 이 이벤트가 발생합니다. 드로어가 이미 네비게이션을 덮고 있으므로 숨길 필요가 없는데 숨겨버립니다.

---

## 해결 방안

입력 필드가 드로어/다이얼로그/오버레이 **내부**에 있는지 확인하여, 해당 경우에는 네비게이션을 숨기지 않도록 합니다.

### 수정 파일: `src/components/layout/BottomTabNavigation.tsx`

**변경 내용:**

```typescript
// 변경 전
const handleFocusIn = (e: FocusEvent) => {
  const target = e.target as HTMLElement;
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
    setKeyboardVisible(true);
  }
};

// 변경 후
const handleFocusIn = (e: FocusEvent) => {
  const target = e.target as HTMLElement;
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
    // 드로어, 다이얼로그, 또는 오버레이 내부의 입력 필드인지 확인
    // 이런 경우 네비게이션은 이미 덮여 있으므로 숨길 필요 없음
    const isInsideOverlay = target.closest('[role="dialog"]') || 
                            target.closest('[data-vaul-drawer]') ||
                            target.closest('[data-radix-portal]');
    
    if (!isInsideOverlay) {
      setKeyboardVisible(true);
    }
  }
};
```

---

## 동작 방식

| 상황 | 현재 동작 | 수정 후 동작 |
|------|----------|-------------|
| 일반 페이지의 입력 필드 클릭 | 네비게이션 숨김 ✓ | 네비게이션 숨김 ✓ |
| 드로어 내 입력 필드 클릭 | 네비게이션 숨김 (버그) | 네비게이션 유지 ✓ |
| 다이얼로그 내 입력 필드 클릭 | 네비게이션 숨김 (버그) | 네비게이션 유지 ✓ |

---

## 파일 변경 요약

| 파일 | 변경 내용 |
|------|----------|
| `src/components/layout/BottomTabNavigation.tsx` | `handleFocusIn` 함수에서 드로어/다이얼로그 내부 입력 필드 감지 로직 추가 |

---

## 예상 결과

```text
수정 후:

1. 채팅 버튼 클릭 → 드로어 열림
2. 고객지원 탭 클릭 → 지원 채팅 표시
3. 입력 필드 클릭 → 키보드 열림
4. 하단 네비게이션 → 드로어 뒤에 그대로 유지됨 ✓
5. 드로어 닫기 → 네비게이션 정상 표시 ✓
```

이 수정은 기존 키보드 감지 동작을 유지하면서, 오버레이 내부 입력 시에만 숨기지 않도록 제한합니다.

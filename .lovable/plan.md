
# 생년월일 년도 선택 버그 긴급 수정

## 문제 분석

사용자가 회원가입 시 생년월일 년도를 선택할 수 없다는 긴급 버그입니다.

### 근본 원인

`SelectContent` 컴포넌트의 Viewport 설정 문제:

```tsx
// 현재 코드 (select.tsx 라인 78-85)
<SelectPrimitive.Viewport
  className={cn(
    "p-1",
    position === "popper" &&
      "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
  )}
>
```

`h-[var(--radix-select-trigger-height)]`가 Viewport 높이를 트리거 높이(약 40px)로 제한해버려서, 126개 년도 옵션이 있는 드롭다운에서 스크롤이 불가능합니다.

### 추가 문제

1. **모바일 터치 스크롤**: Radix Select는 모바일에서 터치 스크롤이 원활하지 않을 수 있음
2. **Viewport overflow**: 높이 제한과 overflow 설정 충돌

---

## 해결 방안

### 1단계: SelectContent Viewport 높이 수정

```tsx
// 수정 전
h-[var(--radix-select-trigger-height)]

// 수정 후 - 높이 제한 제거, max-height만 유지
// Viewport에서 height 제한 제거
```

### 2단계: DateDropdownPicker 모바일 최적화

년도 드롭다운의 `max-h-[200px]`를 유지하되, 모바일에서 더 큰 높이 허용:

```tsx
// max-h-[200px] → max-h-[280px] 또는 max-h-[60vh]
// 모바일에서도 충분한 스크롤 영역 확보
```

### 3단계: overflow-y-auto 명시적 추가

SelectContent에 스크롤 가능하도록 명시:

```tsx
className={cn(
  "relative z-50 max-h-96 min-w-[8rem] overflow-hidden ...",
  // overflow-y-auto 추가 고려
)}
```

---

## 파일 변경

| 파일 | 변경 내용 |
|------|----------|
| `src/components/ui/select.tsx` | Viewport height 제한 제거 |
| `src/components/ui/date-dropdown-picker.tsx` | 모바일 최적화, max-height 조정 |

---

## 기술 세부사항

### SelectContent 수정 (라인 78-85)

```tsx
// 변경 전
<SelectPrimitive.Viewport
  className={cn(
    "p-1",
    position === "popper" &&
      "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]",
  )}
>

// 변경 후
<SelectPrimitive.Viewport
  className={cn(
    "p-1 max-h-[inherit] overflow-y-auto",
    position === "popper" &&
      "w-full min-w-[var(--radix-select-trigger-width)]",
  )}
>
```

핵심: `h-[var(--radix-select-trigger-height)]` 제거

### DateDropdownPicker 수정 (라인 124, 162)

```tsx
// 변경 전
<SelectContent className="max-h-[200px]">

// 변경 후 - 모바일에서 더 많은 공간 확보
<SelectContent className="max-h-[280px] overflow-y-auto">
```

---

## 테스트 체크리스트

- [ ] 모바일에서 년도 드롭다운 열림
- [ ] 년도 목록 스크롤 가능 (1900년까지)
- [ ] 년도 선택 시 정상 반영
- [ ] 월/일 드롭다운도 정상 작동
- [ ] 데스크톱에서도 동일하게 작동

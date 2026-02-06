

# 모바일 악보 미리보기 닫기 버튼 수정

## 문제 분석

스크린샷에서 닫기 버튼(X)이 화면 밖으로 밀려나 보이지 않음:

### 현재 코드 구조
```tsx
<DialogContent hideCloseButton={isMobile} className="p-4 ...">
  <DialogHeader>
    <div className="flex items-center justify-between">
      <DialogTitle>...</DialogTitle>
      {isMobile && (
        <Button className="absolute right-2 top-2">  ← 문제: DialogHeader 기준 absolute
          <X />
        </Button>
      )}
    </div>
  </DialogHeader>
</DialogContent>
```

### 문제 원인
1. `DialogHeader`는 `position: relative`가 없어서 `absolute` 위치가 `DialogContent` 기준으로 계산됨
2. `DialogContent`의 `translate-x-[-50%] translate-y-[-50%]` 변환과 충돌
3. 모바일 전체화면 모드에서 `left-[50%] top-[50%]` 설정이 여전히 적용되어 혼란 발생

---

## 해결 방안

### 방법 1: 닫기 버튼을 flex 레이아웃으로 변경 (추천)

`absolute` 대신 `flex`로 제목과 버튼을 배치:

```tsx
<DialogHeader className="flex-shrink-0 relative">
  <div className="flex items-center justify-between gap-4">
    <DialogTitle className="text-base sm:text-lg flex-1 min-w-0">
      {t("songLibrary.previewScore")} - {songTitle}
    </DialogTitle>
    {isMobile && (
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0"  // absolute 제거, shrink-0으로 변경
        onClick={() => onOpenChange(false)}
      >
        <X className="h-5 w-5" />
      </Button>
    )}
  </div>
</DialogHeader>
```

### 방법 2: DialogContent에서 모바일 위치 초기화

모바일 전체화면일 때 `left-0 top-0 translate-x-0 translate-y-0` 추가:

```tsx
<DialogContent 
  hideCloseButton={isMobile}
  className={cn(
    "flex flex-col",
    // Mobile: fullscreen - 위치 변환 초기화
    "w-full h-[100dvh] max-w-full max-h-[100dvh] rounded-none p-4",
    "left-0 top-0 translate-x-0 translate-y-0",  // 새로 추가
    // Desktop: centered modal
    "sm:left-[50%] sm:top-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%]",
    "sm:max-w-4xl sm:max-h-[90vh] sm:h-auto sm:rounded-xl sm:p-6"
  )}
>
```

---

## 선택한 해결책: 방법 1 + 방법 2 결합

가장 안정적인 해결책:

1. **DialogContent**: 모바일에서 `inset-0`으로 전체화면 설정하고 transform 제거
2. **닫기 버튼**: `absolute` 대신 `flex` 레이아웃 사용

---

## 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/components/ScorePreviewDialog.tsx` | 1. DialogContent 모바일 위치 속성 수정 (inset-0)<br>2. 닫기 버튼을 flex 레이아웃으로 변경 |

---

## 수정 후 레이아웃

```
┌────────────────────────────────────────┐
│ 악보 미리보기 - 다시 일어나      [X]   │  ← 닫기 버튼 항상 보임
├────────────────────────────────────────┤
│ 키: [F (1 페이지) ▼]                   │
│                                        │
│ ┌────────────────────────────────────┐ │
│ │                                    │ │
│ │           악보 이미지              │ │
│ │                                    │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

---

## 코드 변경 상세

```tsx
// ScorePreviewDialog.tsx

<DialogContent 
  hideCloseButton={isMobile}
  className={cn(
    "flex flex-col",
    // Mobile: true fullscreen with inset-0 (no transform)
    "inset-0 w-full h-[100dvh] max-w-full max-h-[100dvh] rounded-none p-4",
    "translate-x-0 translate-y-0",
    // Desktop: centered modal with transform
    "sm:inset-auto sm:left-[50%] sm:top-[50%]",
    "sm:translate-x-[-50%] sm:translate-y-[-50%]",
    "sm:max-w-4xl sm:max-h-[90vh] sm:h-auto sm:rounded-xl sm:p-6"
  )}
>
  <DialogHeader className="flex-shrink-0">
    <div className="flex items-center justify-between gap-4">
      <DialogTitle className="text-base sm:text-lg flex-1 min-w-0 truncate">
        {t("songLibrary.previewScore")} - {songTitle}
      </DialogTitle>
      {isMobile && (
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 -mr-2 -mt-2"
          onClick={() => onOpenChange(false)}
        >
          <X className="h-5 w-5" />
        </Button>
      )}
    </div>
  </DialogHeader>
  ...
</DialogContent>
```


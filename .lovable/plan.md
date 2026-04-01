

# AI 세트 빌더 패널 잘림 수정

## 문제
스크린샷에서 필드와 버튼이 오른쪽으로 잘리고 있음. `ScrollArea`에 `-mx-6 px-6`과 `overflow-x-hidden` 조합이 우측 콘텐츠를 클리핑함.

## 변경 (`AISetBuilderPanel.tsx`)

### ScrollArea 오버플로우 수정
- `-mx-6 px-6` 패턴 제거 → 단순히 `flex-1 min-h-0`으로 변경
- `overflow-x-hidden` 제거
- 이렇게 하면 SheetContent의 기본 패딩 안에서 콘텐츠가 정상 렌더링됨

```
// Before (L225)
<ScrollArea className="flex-1 -mx-6 px-6 overflow-x-hidden">

// After
<ScrollArea className="flex-1 min-h-0">
```

### AISetBuilderForm 하단 여백
- 버튼이 스크롤 영역 하단에서 잘리지 않도록 `pb-4` 추가

```
// Before (L47 in AISetBuilderForm.tsx)
<div className="space-y-4 py-4">

// After
<div className="space-y-4 py-4 pb-6">
```

### 변경 파일
1. `src/components/AISetBuilderPanel.tsx` — ScrollArea 클래스 수정
2. `src/components/ai-set-builder/AISetBuilderForm.tsx` — 하단 패딩 추가


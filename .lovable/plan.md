

# 이전/완료 & 다음 바 위치 수정

## 문제
`InstituteBottomNav`은 `fixed inset-x-0 bottom-0`으로 고정되어 있어, `fullHeight` 레이아웃의 `main` 영역 하단을 가립니다. 챕터 페이지의 "이전/완료 & 다음" 바가 이 고정 네비게이션 뒤에 숨겨집니다.

## 해결
`InstituteLayout`의 `fullHeight` 모드에서 `main` 영역에 하단 패딩을 추가하여 고정된 `InstituteBottomNav`(h-14 + safe-area)만큼의 공간을 확보합니다.

## 변경 내용

**파일: `src/layouts/InstituteLayout.tsx`**
- `fullHeight` 분기의 `<main>` 태그에 `pb-[calc(3.5rem+env(safe-area-inset-bottom,0px))]` 추가
- 이렇게 하면 챕터 하단 네비 바가 InstituteBottomNav 바로 위에 항상 표시됨

```text
Before: <main className="flex-1 flex flex-col overflow-hidden">
After:  <main className="flex-1 flex flex-col overflow-hidden" 
              style={{ paddingBottom: "calc(3.5rem + env(safe-area-inset-bottom, 0px))" }}>
```

이 한 줄 변경으로 모든 Institute `fullHeight` 페이지에 일괄 적용됩니다.


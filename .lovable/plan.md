

# 변경 사항 3가지

## 1. 빌딩 간판 텍스트 변경
**파일:** `src/components/worship-studio/StudioSidePanel.tsx` (line 270)
- `"Worship Atelier"` → `"Worship Atelier by K-Worship"`

## 2. 새 페이지 추가 버튼 버그 수정
**파일:** `src/components/worship-studio/spaces/SpaceCanvas.tsx`
- **원인:** `useStudioSpaces(undefined)`로 호출하여 spaces 데이터가 항상 빈 배열 → `currentSpaceData`가 `undefined` → `handleAddPage`가 즉시 return
- **수정:** `handleAddPage`에서 `currentSpaceData` 체크를 제거하고, `pageCount`만으로 동작하도록 변경 (이미 `pageCount`는 fallback `?? 2`로 안전)

## 3. Bottom bar 넓이 확장 + 모바일 텍스트 넘침 방지
**파일:** `src/pages/WorshipStudio.tsx` (line 128-153)
- 바 스타일: `px-4` → `px-5`, 전체에 `min-w-[280px]` 추가
- "새 페이지" 버튼: `whitespace-nowrap` 추가하여 줄바꿈 방지


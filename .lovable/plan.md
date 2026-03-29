

# 새 페이지 추가 버그 수정 + 2페이지씩 추가

## 문제 원인
`SpaceCanvas`에서 `useStudioSpaces(undefined)`를 호출하여 spaces 데이터가 항상 빈 배열 → `currentSpaceData`가 항상 `undefined` → `handleAddPage`의 `updateSpace.mutate`가 잘못된 ID로 호출됨.

## 수정 방안

### 파일: `src/components/worship-studio/StudioMainPanel.tsx`
- `StudioMainPanel`은 이미 올바른 `spaces` 데이터를 보유. 여기서 `handleAddPage` 로직을 구현하고, `onPageNavInfo`에 포함하여 상위로 전달.
- `SpaceCanvas`의 `onPageNavInfo` 콜백에서 올라오는 `handleAddPage`를 덮어쓰기: activeSpace의 `page_count`를 기반으로 `updateSpace.mutate({ id: activeSpaceId, page_count: currentPageCount + 2 })` 호출.

### 파일: `src/components/worship-studio/spaces/SpaceCanvas.tsx`
- `useStudioSpaces(undefined)` 및 `useUpdateSpace()` 호출 제거 (불필요한 중복 쿼리).
- `handleAddPage`를 props로 받거나, `pageCount`를 props로 받아서 SpaceCanvas는 표시/네비게이션만 담당.
- 가장 깔끔한 접근: SpaceCanvas props에 `pageCount`를 추가하고, `handleAddPage`는 SpaceCanvas에서 제거. `onPageNavInfo` 콜백에서 `handleAddPage`는 StudioMainPanel에서 주입.

### 2페이지씩 추가
- 새 페이지 추가 시 `page_count + 2`로 변경 (데스크톱에서 2페이지가 한 스프레드).

## 변경 요약

| 파일 | 변경 |
|------|------|
| `SpaceCanvas.tsx` | `useStudioSpaces`, `useUpdateSpace` 제거. `pageCount`를 props로 받음. `handleAddPage`를 내부에서 제거 |
| `StudioMainPanel.tsx` | `handleAddPage` 로직 추가 (activeSpace 기반, +2 페이지). `onPageNavInfo`에서 SpaceCanvas가 올려주는 nav info에 이 함수를 오버라이드하여 상위로 전달 |


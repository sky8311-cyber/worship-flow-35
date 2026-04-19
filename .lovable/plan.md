
## 5가지 이슈 종합 수정 계획

### 1. 악보 선택 다이얼로그 느린 로딩 (모바일 + iPad)
**원인 추정**: `SetSongScoreDialog` 열릴 때 모든 악보 후보의 서명 URL을 동기적으로 발급/이미지 로드. 캐시 미스 + 직렬 처리.
**조사**: `SetSongScoreDialog.tsx`, 썸네일 리스트 렌더링 부분.
**수정**:
- 다이얼로그 콘텐츠를 `open=true`일 때만 마운트 (lazy)
- 썸네일을 `IntersectionObserver` 기반 lazy load (또는 `loading="lazy"` 충분)
- 서명 URL 발급 병렬화 (`Promise.all`) + 캐시 hit 체크 우선

### 2. iPad 악보검색 시 하단 저장/취소 버튼 가려짐
**원인**: iPad에서 검색 input focus → 가상 키보드가 뜨지 않거나 `100dvh`가 키보드 영역 미반영. DialogContent의 `max-h-[calc(100dvh-...)]` 가 sticky footer 보장 안 함.
**수정**: `SetSongScoreDialog`를 flex column 구조로 — `DialogHeader` (shrink-0) + `검색/리스트 영역` (flex-1 overflow-auto) + `DialogFooter` (sticky bottom, shrink-0). 푸터는 `safe-area-inset-bottom` 패딩 포함.

### 3. iPad 악보 미리보기 — 이미지 작고 하단 disclaimer 안 보임
**원인**: `ScorePreviewDialog`가 fullscreen이지만 이미지 컨테이너가 충분히 안 늘어나거나, disclaimer가 `max-h` 밖으로 밀림.
**수정**:
- 이미지 영역 `flex-1 min-h-0`로 남은 공간 모두 차지, `object-contain`은 `w-full h-full` 보장
- iPad에서 disclaimer가 항상 보이도록 footer를 `flex-shrink-0` + safe-area-bottom 패딩
- 헤더/푸터 높이 확정 후 가운데 영역만 flex-1로 배분

### 4. 모바일에서도 드래그&드롭 추가
**현재**: `ReorderItemsDialog`는 모바일이면 화살표만, 데스크톱이면 dnd-kit.
**수정**: `isMobile` 분기 제거 → 항상 `DndContext` 사용 + 화살표 버튼도 같이 표시 (이중 UX). PointerSensor에 `activationConstraint: { delay: 200, tolerance: 5 }` 추가해 스크롤과 드래그 구분.

### 5. 모바일 SetBuilder 최적화 — 진행설정 박스 메트로놈/체크 넘침
**조사 필요**: `SongProgressionSettings.tsx` (메트로놈 + 체크 버튼이 한 행에 있는 영역).
**수정**:
- 좁은 폭에서 컨트롤들이 한 줄에 안 들어가면 `flex-wrap` 또는 grid로 재배치
- 박스 패딩 `p-4` → 모바일 `p-3`, 컨트롤 간격 `gap-2`
- 메트로놈/체크 버튼 크기 축소 (`size="sm"` 또는 `h-9 w-9`) 및 `flex-shrink-0`
- 라벨/값 영역 `min-w-0 truncate`

### 영향 파일
1. `src/components/SetSongScoreDialog.tsx` — flex layout, lazy 마운트, 푸터 sticky (이슈 1, 2)
2. `src/components/ScorePreviewDialog.tsx` — iPad 이미지/disclaimer 레이아웃 (이슈 3)
3. `src/components/set-builder/ReorderItemsDialog.tsx` — 모바일에도 dnd 적용 (이슈 4)
4. `src/components/set-builder/SongProgressionSettings.tsx` — 모바일 레이아웃 최적화 (이슈 5)

### 진행
승인 시 default 모드에서 위 4개 파일을 순차 수정. DB/데이터 변경 없음. iPad + 모바일 재테스트 요청.

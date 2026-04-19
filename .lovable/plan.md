
## iPad 악보 미리보기 — 이미지 위쪽 빈 공간 + 하단 잘림 수정

### 진단 (스크린샷 기준)
- iPad 세로 화면에서 악보가 화면 중앙~하단에만 표시되고 위쪽 절반이 비어있음
- 하단 disclaimer ("본 자료는 사용자가 업로드한 콘텐츠")가 화면 밖으로 잘림
- 원인: `ScorePreviewDialog`의 이미지 컨테이너가 `flex-1`로 공간을 차지하지만 이미지가 `object-contain`으로 비율 유지하면서 컨테이너 높이가 실제 사용 가능한 높이보다 큼 → disclaimer가 viewport 밖으로 밀려나고, 이미지는 컨테이너 안에서 중앙 정렬되어 위쪽이 비어 보임

### 가설
`DialogContent`가 `h-[100dvh]`이지만 내부 flex 레이아웃이 헤더(타이틀+컨트롤) + 이미지(flex-1) + disclaimer 구조에서 disclaimer 높이가 계산에 포함되지 않거나, iPad Safari의 `100dvh`가 주소창/탭바 높이 변동 시 잘못 계산됨.

### 수정 방안
1. **`DialogContent` 높이 제약 강화**: `h-[100dvh]` → `h-[100svh]` (small viewport height: 주소창 펼쳤을 때 기준 — 항상 안전한 최소 높이). iPad Safari/Chrome에서 `100svh`가 100dvh보다 안정적.
2. **레이아웃 구조 정리**:
   - 컨테이너: `flex flex-col h-[100svh] overflow-hidden`
   - Header (`flex-shrink-0`): 타이틀 + 닫기 버튼
   - Controls (`flex-shrink-0`): Key/Page selector
   - Image area (`flex-1 min-h-0 overflow-hidden flex items-center justify-center`)
   - Disclaimer (`flex-shrink-0`): 항상 보이도록 마지막에 배치
3. **이미지**: `max-w-full max-h-full w-auto h-auto object-contain` 유지 — 컨테이너가 정확히 남은 공간이 되면 자연스럽게 fit
4. **iPad Disclaimer 가시성**: disclaimer 컴포넌트에 mobile에서 더 컴팩트한 패딩 적용 (이미 적용됐는지 확인 후 조정)

### 영향 파일
1. `src/components/ScorePreviewDialog.tsx` — `h-[100dvh]` → `h-[100svh]` 교체, flex 구조 재확인
2. (필요 시) `src/components/copyright/ScoreViewerDisclaimer.tsx` — iPad에서 한 줄로 줄어들도록 컴팩트 모드

### 진행
승인 시 default 모드에서 `ScorePreviewDialog` 레이아웃을 svh 기반으로 교체하고 disclaimer가 항상 viewport 안에 보이도록 보정. 데이터 변경 없음. iPad Safari/Chrome에서 재테스트 요청.

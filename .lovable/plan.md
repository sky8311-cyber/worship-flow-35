

# 모바일 빌딩 패널 수정 — 스와이프, X버튼, 잘림, 차량 레이어

## 문제 4가지

1. **스와이프 닫기 없음**: Radix Sheet는 기본적으로 스와이프 제스처를 지원하지 않음. 드래그 핸들(pill)이 있지만 장식용일 뿐.
2. **X 버튼 위치**: Sheet의 X 버튼이 `right-4 top-4`로 드래그 핸들 위쪽 라인과 겹침.
3. **카페/도로 잘림**: 모바일에서 건물 본체가 공간을 다 차지하여 상가+도로가 뷰포트 밖으로 밀림.
4. **자동차가 인도에 가려짐**: 도로(`AnimatedRoad`)와 인도의 z-index가 차량 이모지보다 높아 가려짐.

## 변경 사항

### 1. `WorshipStudio.tsx` — 모바일 Sheet에 스와이프 닫기 추가
- 드래그 핸들(pill div)에 `onTouchStart`/`onTouchMove`/`onTouchEnd` 핸들러 추가.
- 아래로 80px 이상 스와이프하면 `setMobileAptOpen(false)` 호출.
- Sheet 전체가 아닌 상단 핸들 영역에서만 스와이프 감지 (내부 스크롤과 충돌 방지).

### 2. `WorshipStudio.tsx` — X 버튼 위치 조정
- SheetContent에 커스텀 클래스로 X 버튼 위치를 `top-2 right-3`으로 조정하거나, Sheet의 기본 X 버튼을 숨기고 드래그 핸들 옆에 커스텀 X 버튼 배치.

### 3. `StudioSidePanel.tsx` — 모바일 건물 높이 축소
- `mode="mobile"` (Sheet 내부)일 때 건물 본체 ScrollArea에 `max-h` 제한 추가 (예: `max-h-[50vh]`).
- 이렇게 하면 상가(GroundFloorShops)와 도로(AnimatedRoad)가 스크롤 없이도 보임.
- 또는 `isSheet` 경로에서도 상가+도로를 렌더링하도록 수정 (현재 `isSheet`일 때는 ScrollArea만 렌더링하고 건물 외관을 생략함).

### 4. `StudioSidePanel.tsx` — 자동차 z-index 최상위
- AnimatedRoad 컨테이너에 `z-20` 추가.
- 도로 내 차량 span에 `z-30` 적용.
- 인도(sidewalk) div에는 `z-10` 유지하여 차량이 인도 위를 지나가도 보이도록.

## 변경 파일
- `src/pages/WorshipStudio.tsx`
- `src/components/worship-studio/StudioSidePanel.tsx`




# 빌딩 비주얼 수정 — 폴대, 차량, 하늘, 카페

## 변경 사항

### 1. `StudioSidePanel.tsx` — 스트링 라이트 폴대 1.5x 높이 + 기울기 조정

현재 `poleHeight = 34`. → `poleHeight = 51` (1.5x). SVG 높이도 같이 증가. 스트링 곡선의 제어점(cp)을 조정해 폴 상단에서 건물 왼편 상단으로 자연스럽게 기울어지도록 수정. `bottom: '100%'` + `marginBottom: '-1px'` 유지 — 이 앵커링은 건물 body `border-t` 상단에 붙이는 것이므로 정상 작동해야 함.

핵심: 현재 SVG에 `preserveAspectRatio="none"`이 설정되어 있는데, 이것이 비율을 왜곡시킬 수 있음. `"xMidYMax meet"`로 변경하여 SVG가 하단 정렬되도록 수정.

### 2. `StudioSidePanel.tsx` — 상단 차량 Y축 15px 상향

현재 `top: '2px'` → `top: '-13px'` (약 15px 상향). 빨강/파랑 차량 모두 동일 적용.

### 3. `tailwind.config.ts` + `StudioSidePanel.tsx` — 구름 폭 확장 + 비행기 추가

**구름**: `cloud-drift` 키프레임을 차량처럼 넓은 범위로 변경 (`translateX(-200%)` → `translateX(600%)`). 구름 초기 위치를 `left: 0`으로 설정하여 전체 가로폭 활용.

**비행기**: 새로운 `airplane-fly` 키프레임 추가 (우→좌, `translateX(2000%)` → `translateX(-500%)`). 하늘 영역에 `✈️` 이모지를 작은 사이즈로 배치, 약 40초 주기.

### 4. `StudioSidePanel.tsx` — 카페 리뉴얼

- 간판 텍스트: `CAFÉ` → `CAFÉ & BOOKS`
- Awning 높이: `h-1.5` → `h-3` (더 길게 늘어지는 효과)로 확대 + 삼각형 패턴 SVG 추가
- 인도(sidewalk) 위에 패티오 세트 추가: 작은 테이블 + 의자 2개를 SVG로 인도 영역(카페 앞)에 배치

### 5. `StudioSidePanel.tsx` — 드럼 크기 확대

드럼 세트의 킥/탐/심벌을 추가 확대 (현재 대비 약 1.3x). Y 위치를 더 위로 올려 파라솔보다 명확히 높게 보이도록 조정 (`drumY = stageY - 22` 수준).

## 변경 파일
- `src/components/worship-studio/StudioSidePanel.tsx`
- `tailwind.config.ts`


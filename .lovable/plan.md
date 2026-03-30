# 루프탑 / 간판 / 도로 / 상가 대규모 수정

## 변경 사항

### 1. 루프탑 RooftopScene 재디자인

- 나무 2그루 → **5~6그루** (크고 작은 다양한 사이즈)
- 파라솔+테이블+의자 **5세트** 배치 (참조 이미지처럼 우산형 파라솔, 의자 2개 + 테이블)
- 난간은 이미 있으므로 유지

### 2. 간판 교체

- 하늘에 떠 있는 기존 네온 `WORSHIP ATELIER` 간판 → **삭제**
- ROOFTOP 배지 라인의 양쪽 빨간/노란 파라솔 이모지(`⛱️ ... ⛱️`) → **삭제**
- 대신 같은 위치에 **길쭉한 흰색 배경 + 검은 폰트 간판**: `WORSHIP ATELIER by kworship.app`
- 크기: ROOFTOP 글자보다 약간 더 큼, 기존 네온 간판보다는 작음

### 3. 스트링 라이트 수정

- 폴 높이 현재 `poleHeight = 20` → **30**  
**폴 높이 건물 최상단 라인에서 시작하여 위로 하늘로 솓기**
- 스트링 라이트 시작점을 **건물 최상단 라인에 앵커링** (하늘에 뜨지 않도록)
- 루프탑 영역 높이(`h-20`/`h-16`) 축소하여 스트링 라이트가 건물과 연결

### 4. 도로 차량 수정

- **상단 차선**: 오른쪽→왼쪽 (이미 `animate-car-move-left` — 정상)
- **하단 차선**: 왼쪽→오른쪽 (이미 `animate-car-move-right` — 정상)
- 하단 차선 차량 **수평 반전**: `style={{ transform: 'scaleX(-1)' }}` 추가하여 머리가 오른쪽을 향하도록
- 차량 크기 **3배**: `text-[9px]` → `text-[28px]`, `text-[8px]` → `text-[24px]`
- `tailwind.config.ts`: 애니메이션 범위 2.5배 확대 — `car-move-right`: `-300%` → `2500%`, `car-move-left`: `2500%` → `-300%`
- 도로 높이도 차량 크기에 맞게 확대: `h-5`/`h-4` → `h-10`/`h-8`

### 5. 카페/갤러리 상가 잘림 해결

- `GroundFloorShops` 높이 `h-11` → `h-16` (SVG가 충분히 보이도록)

## 파일 변경

### `StudioSidePanel.tsx`

- `RooftopScene`: 나무 5~6그루 + 파라솔 5세트로 확장
- 네온 간판 div 삭제 → 흰배경 검정폰트 간판으로 교체 (ROOFTOP 라벨 위치)
- `⛱️` 이모지 2개 제거, 간판 배치
- `RooftopStringLights`: `poleHeight` 20→10, 루프탑 영역 높이 축소
- `AnimatedRoad`: 차량 텍스트 크기 3x, 하단 차선 `scaleX(-1)`, 도로 높이 확대
- `GroundFloorShops`: `h-11` → `h-14`

### `tailwind.config.ts`

- `car-move-right`: `translateX(-300%)` → `translateX(2500%)`
- `car-move-left`: `translateX(2500%)` → `translateX(-300%)`
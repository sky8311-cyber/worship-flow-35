

# 밤/낮 모드 시각 개선 — 4가지 수정

## 변경 사항

### 1. 루프탑 무대 높이 증가 (`RooftopScene`)
- **Line 92**: `h` 값 증가 — mobile `78→95`, desktop `90→110`
- 무대와 악기가 더 크게 보이고 여유 공간 확보

### 2. 인도 패티오 카페 세트 제거 (`AnimatedRoad`)
- **Lines 551-564**: 인도(sidewalk) 안의 SVG 전체 삭제 (테이블, 의자, 가로등 등)
- 빈 인도만 유지

### 3. 초승달 배치 수정 (`NightSkyStars`)
- **Line 69-72**: 현재 달의 `cy` 값이 `height * 0.18 = 36` (height=200 기준)인데, NightSkyStars SVG의 viewBox가 `0 0 300 200`이고 실제 하늘 영역 상단에 위치
- 문제: 마스킹 원 색상 `#141852`가 하늘 그라디언트와 미묘하게 안 맞거나, 달이 건물 뒤에 가려질 수 있음
- 수정: 달 위치를 `cy = height * 0.12`로 올리고, 크기를 키움 (`r=12`, mask `r=10`), glow 반경도 증가 (`r=22`)
- 마스킹 색상을 하늘 상단색 `#0a0e2a`로 변경 (더 정확한 매칭)

### 4. 차량 3대 추가 + 속도 차별화 (`AnimatedRoad` + `tailwind.config.ts`)

**새 CSS 애니메이션 추가** (`tailwind.config.ts`):
- `car-move-left-fast`: 12s (스포츠카/오토바이용 — 기존 22s보다 빠름)
- `car-move-right-fast`: 10s (기존 18s보다 빠름)
- `car-move-left-slow`: 35s (트레일러 트럭용 — 느림)

**새 차량** (기존 4대와 동일 헤드라이트 패턴):
- 🏎️ 스포츠카 — `animate-car-move-left-fast`, 상단 차선, delay `5s`
- 🏍️ 오토바이 — `animate-car-move-right-fast`, 하단 차선, delay `7s`, 작은 사이즈 `text-[18px]`
- 🚛 트레일러 트럭 — `animate-car-move-left-slow`, 상단 차선, delay `15s`, 큰 사이즈 `text-[30px]`

## 파일 목록
1. `src/components/worship-studio/StudioSidePanel.tsx` — RooftopScene 높이, 인도 SVG 삭제, 달 수정, 차량 추가
2. `tailwind.config.ts` — fast/slow 애니메이션 추가


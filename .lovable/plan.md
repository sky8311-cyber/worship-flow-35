

# 초승달 크기 축소 + 차량 속도 통일

## 1. 초승달 수정 (`NightSkyStars`, lines 68-72)
- 달 크기 축소: `r={12}` → `r={7}`, 마스크 `r={10}` → `r={6}`
- Y축 위로: `height * 0.12` → `height * 0.08`
- **glow 삭제**: line 72의 `r={22}` glow circle 제거

## 2. 차량 속도 통일 (`tailwind.config.ts`)
모든 car-move 애니메이션을 동일한 **9초**로 변경:
- `car-move-right`: `18s` → `9s`
- `car-move-left`: `22s` → `9s`
- `car-move-left-fast`: `12s` → `9s`
- `car-move-right-fast`: `10s` → `9s`
- `car-move-left-slow`: `35s` → `9s`

또한 중복 변속 클래스(`-fast`, `-slow`) 제거 가능하나, 유지하되 속도만 통일하는 것이 안전.

## 파일
1. `src/components/worship-studio/StudioSidePanel.tsx` — 달 크기/위치/glow
2. `tailwind.config.ts` — 애니메이션 duration 통일


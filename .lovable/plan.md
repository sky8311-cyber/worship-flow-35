

# 자동차 전조등 — 차 앞쪽 헤드라이트로 변경

## 문제
현재 `filter: drop-shadow(0 0 5px #f5c542)`가 차량 이모지 전체에 적용되어 차 전체가 빛남. 헤드라이트는 차 앞쪽에서만 길을 비춰야 함.

## 수정 방향 (StudioSidePanel.tsx — AnimatedRoad)

1. **차 전체 `drop-shadow` 제거** — 기존 `filter` 스타일 삭제

2. **각 차량을 wrapper `span`으로 감싸고, 앞쪽에 헤드라이트 div 배치**:
   - 왼쪽으로 이동하는 차 (`animate-car-move-left`): 차 왼쪽에 노란 빛 원형 배치
   - 오른쪽으로 이동하는 차 (`animate-car-move-right`): 차 오른쪽에 노란 빛 원형 배치
   - 헤드라이트: `position: absolute`, 작은 원형 (`w-2 h-1.5`), `background: radial-gradient(ellipse, rgba(255,230,100,0.7), transparent)`, 차 앞쪽 하단에 위치
   - 밤에만 표시 (`isNight && ...`)

3. **빛이 길을 비추는 효과**: 헤드라이트 앞쪽으로 넓게 퍼지는 타원형 glow 추가 (`w-6 h-2`, 낮은 opacity), 도로 위에 빛이 깔리는 느낌

## 변경 파일
- `src/components/worship-studio/StudioSidePanel.tsx` (AnimatedRoad 함수, lines 574-583)


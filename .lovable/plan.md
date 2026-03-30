

# 차량 레이어 순서 + 로딩 시 겹침 수정

## 1. 오른쪽 이동 차량 z-index 높이기
오른쪽으로 이동하는 차량(하단 차선: 🚕, 🚐, 🏍️)의 `z-10` → `z-20`으로 변경하여 항상 왼쪽 이동 차량 위에 표시.

## 2. 로딩 시 겹침 현상 해결
`animationDelay` 동안 차량이 기본 위치(`translateX(0)`)에 보이는 문제. 모든 차량 span에 `[animation-fill-mode:backwards]` 클래스 추가 → delay 동안 첫 keyframe 위치(화면 밖)에 대기.

## 파일
`src/components/worship-studio/StudioSidePanel.tsx` — 7개 차량 span 수정


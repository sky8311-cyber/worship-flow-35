

# 전광판 모바일 대응 + 로고 태그라인 크기 수정

## 문제 분석

### 1. 전광판 모바일 이슈
`RooftopScene`에서 전광판 크기/위치가 `width` 기반으로 계산됨:
- `bbW = width * 0.45`, `bbX = width * 0.3`
- 모바일에서 `width`가 `rooftopWidth`(ResizeObserver)로 넓어지면서 전광판이 커지지만, `bbH = floorY * 0.42`는 고정 높이(floorY=91)에서 계산 → 약 38px
- 텍스트 `fontSize`는 `screenW * 0.07~0.09`로 계산되어 모바일에서 폭이 넓어지면 글자가 커지고 높이를 초과

### 2. 로고 태그라인 작음
SVG에서 태그라인 `font-size="80"` — 메인 텍스트(220)의 36%로 너무 작음

## 변경 사항

### `src/components/worship-studio/StudioSidePanel.tsx`

**BillboardText 컴포넌트 — fontSize 계산 개선:**
- 현재: `screenW * 0.07~0.09` (폭만 기준)
- 변경: `Math.min(screenW * 0.09, screenH * 0.35)` — 높이도 고려하여 텍스트가 전광판 영역을 넘지 않도록 제한

**RooftopScene — 모바일 전광판 비율 조정:**
- 모바일에서 `bbH`를 약간 늘림: `isMobile ? floorY * 0.48 : floorY * 0.42`
- `bbY` 위치도 적절히 조정

### `src/assets/worship-atelier-logo.svg`

- 태그라인 `font-size` 80 → 110으로 증가
- `y` offset도 `120` → `140`으로 조정하여 간격 유지

### 파일
- `src/components/worship-studio/StudioSidePanel.tsx`
- `src/assets/worship-atelier-logo.svg`


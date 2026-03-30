

# 차량 오버플로우 수정 + 원래 위치 복구

## 문제 분석

### 1. 자동차가 빌딩/캔버스 밖으로 나감
`AnimatedRoad`의 도로 div에 `overflow-hidden`이 없어서 `translateX(3000%)` 애니메이션이 도로 영역 밖까지 렌더링됨. 도로 컨테이너 전체(`<div className="relative shrink-0">`)에도 overflow 제한 없음.

### 2. 자동차 y축 위치
지난 수정에서 `top: -13px` → `top: 2px`로 변경됨. 원래 `-13px`이 정상이었고, 인도에 가리는 문제는 인도 높이를 줄여서 해결.

## 변경 사항 (`StudioSidePanel.tsx`)

### A. 도로 div에 `overflow-hidden` 추가
- Line 444의 도로 div: `overflow-hidden` 추가하여 차량이 도로 영역 밖으로 나가지 않도록 함

### B. 차량 top 위치 원래대로 복구
- Line 451: `top: '2px'` → `top: '-13px'`
- Line 460: `top: '2px'` → `top: '-13px'`

### C. 인도 높이 축소 (차량 가림 방지)
- Line 423: 인도 높이를 줄임 (`h-5`/`h-6` → `h-3`/`h-4`)
- 이렇게 하면 `-13px` 위치의 차량이 인도에 덜 가려짐

### D. 스크롤 구조 확인
- 데스크탑: Line 703 `ScrollArea`가 건물 본체(층)만 감싸고 있음 — 상가/도로는 `ScrollArea` 밖 → **정상** (층만 스크롤, 상가/도로 고정)
- 모바일: 동일 구조 + `max-h-[40vh]` 제한 → **정상**
- 변경 불필요

## 변경 파일
- `src/components/worship-studio/StudioSidePanel.tsx`


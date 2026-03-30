

# 밤 모드 시각 개선

## 변경 사항

### `src/components/worship-studio/StudioSidePanel.tsx`

**1. 스트링 라이트 빛 원뿔 삭제 (lines 269-276, 287-289)**
- 전구 아래 `polygon` (light cone) 삭제
- 전구 주변 glow `circle` (opacity 0.06) 삭제
- 전구 자체는 유지 (크기/색상 그대로)

**2. 카페 빛 원뿔 삭제 (CafeSVG lines 358, 361, 364)**
- 펜던트 조명 아래 `{isNight && <polygon ...>}` 3개 삭제
- 조명 셰이드 자체는 유지

**3. 갤러리 영업 Open (GallerySVG lines 376-381)**
- 어두운 오버레이 `rect fill="#000" fillOpacity={0.5}` 삭제
- 배경색: 밤에도 밝게 (`#fafafa` 계열 유지, 약간 따뜻한 톤 `#f5f0e8`)
- `opacity` wrapper를 밤에도 1로 변경 (기존 0.3 → 1)
- 트랙 라이팅 전구 fillOpacity 밤에도 0.7로 유지

**4. 카페 & 갤러리 간판 조명 (GroundFloorShops)**
- 카페 "CAFÉ & BOOKS" 간판: 밤에 text-shadow glow 추가 (`0 0 6px #f5c542`)
- 갤러리 "GALLERY" 간판: 밤에도 밝은 색 (`text-[#c0d0e0]`), text-shadow glow 추가
- 갤러리에서 `CLOSED` 텍스트 제거, `OPEN` 추가

**5. 건물 간판 흰색 배경 유지 (lines 676-687)**
- "WORSHIP ATELIER" 간판: 밤에도 `bg-white` 유지 (현재 `bg-[#1e2e3e]`로 변경됨 → 수정)
- 텍스트도 밤에도 어두운 색 유지 (`text-[#2a2a2a]`)

**6. 별 개선 (NightSkyStars)**
- 현재 65개 → 150~200개로 대폭 증가
- 크기: r 0.2~0.8로 작게 (현재 0.4~1.2 → 줄임)
- 은하수 느낌: 중앙 대각선 밴드에 밀집도 높이기 (y 위치를 대각선 방향으로 가우시안 분포)
- 밝기: opacity 다양하게 (0.3~1.0)

**7. 달 수정 (NightSkyStars lines 60-64)**
- 현재 초승달 코드는 이미 존재하지만 해(☀️)가 보이는 문제 확인 필요
- 토글 버튼이 `Sun` 아이콘을 밤에 표시 중 → 이건 "낮으로 전환" 의미이므로 정상
- 초승달 SVG: 현재 `#0e1430` 마스킹 색이 하늘 배경과 안 맞을 수 있음 → NightSkyStars에서 하늘 그라디언트 중간색 `#141852`로 마스킹 원 색상 조정

**8. 자동차 전조등 (AnimatedRoad)**
- 각 차량 이모지 앞에 CSS `::before` 또는 wrapper로 노란 glow 추가
- 방법: 차량 span에 `filter: drop-shadow(0 0 4px #f5c542)` 밤일 때 적용
- 추가로 차량 앞쪽에 작은 노란 원형 div (전조등 빛) 배치 — 이모지이므로 CSS filter가 가장 자연스러움

## 파일 목록
1. `src/components/worship-studio/StudioSidePanel.tsx` — 모든 변경




# StudioSidePanel 수정 플랜 — 모던 통유리 사옥 건물

## 핵심 변경 사항

### 1. 건물 외벽: 벽돌 → 통유리 사옥
- `brickWallStyle` 완전 삭제
- 건물 body 배경: 푸른 계열 통유리 (`bg-[#c8dce8]` 또는 `bg-gradient-to-b from-[#d0e0ec] to-[#b8ccd8]`)
- 유리 반사 느낌: 미세한 수직 `repeating-linear-gradient`로 유리 패널 구분선 (투명한 흰색 라인)
- 건물 테두리: `border-[#7a8a9a]` (다크 블루그레이 프레임)

### 2. Theatre 제거 → Café | 입구 문 | Gallery 구조
- `GroundFloorShops`에서 Theatre 섹션 삭제
- 3분할: Café (좌) | 입구 문 (가운데) | Gallery (우)
- **Café**: 어닝 유지 + SVG 내부 (커피머신 실루엣, 카운터, 컵) 투명 유리 너머 보이는 구조
- **입구 문**: 반원 아치 + 다크 프레임 유리문 + 양쪽 식물
- **Gallery**: 투명 유리창 너머 액자/트랙조명 SVG

### 3. 루프탑 재디자인
- 테라스 바닥 표현 제거 (단면도 시점이므로 바닥 안 보임)
- **나무(봉) + 스트링 라이트**: 건물 우측에서 하늘로 솟는 세로 폴(나무/봉) SVG, 거기서 아래로 여러 가닥 스트링 라이트가 드리워지며 전구 매달림 (참조 이미지 스타일)
- 루프탑에 **심겨진 나무** 1~2그루 추가 (작은 나무 실루엣 SVG, 초록 원형 크라운)
- 파라솔 유지
- `StringLights` 컴포넌트를 SVG 기반으로 교체: 폴에서 곡선 path로 와이어가 내려오고, 와이어 위에 원형 전구 노드 배치 + `animate-string-shimmer`

### 4. 창문 라운드
- `StudioUnit.tsx`의 `windowFrame`: `rounded-[2px]` → `rounded-[4px]`

### 5. 차 방향 수정 + 도로 전폭
- `tailwind.config.ts`: `car-move-right` 키프레임 → `translateX(-100%) → translateX(calc(100vw))` 범위 확대
- 도로/인도를 건물 `mx-3` wrapper 밖으로 이동하여 전체 너비 사용

## 파일별 변경

### `tailwind.config.ts`
- `car-move-right`: `0%: translateX(-150%)` → `100%: translateX(600%)`
- `car-move-left`: `0%: translateX(600%)` → `100%: translateX(-150%)`

### `StudioUnit.tsx`
- `rounded-[2px]` → `rounded-[4px]`

### `StudioSidePanel.tsx`
- `brickWallStyle` → `glassWallStyle` (푸른 통유리 그라데이션 + 유리 패널 라인)
- `GroundFloorShops`: Theatre 제거, Café SVG + 입구 문 + Gallery SVG 3분할
- 루프탑: `StringLights` → SVG 폴+와이어+전구 구조로 교체, 나무 SVG 추가
- 도로/인도: building wrapper 밖으로 이동 (전폭)

## 구조

```text
┌──────────────────────────┐
│     ☁️  SKY              │
├──────────────────────────┤
│  WORSHIP ATELIER (neon)  │
│  🌳     ┃╲ · · · ·      │ ← 폴에서 드리워진 스트링라이트
│  ⛱️ [내 스튜디오] 🌳    │ ← 루프탑 나무
├──────────────────────────┤ ← 푸른 통유리 외벽
│  2F · 이웃               │
│  [unit][unit]...         │
├──────────────────────────┤
│  1F · 앰배서더            │
│  [unit][unit]            │
├══════════════════════════┤
│ CAFÉ  │  🚪  │ GALLERY   │ G/F (SVG interiors)
│☕내부  │ 문   │ 🖼️내부   │
├──────────────────────────┤ ← 전폭
│  sidewalk                │
│  🚗→    ═══    ←🚕      │
└──────────────────────────┘
```


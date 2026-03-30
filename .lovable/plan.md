

# StudioSidePanel 전면 재설계 — 포스트모던 멀티유닛 상업 건물

## 변경 파일

### 1. `tailwind.config.ts` — 커스텀 keyframes/animations 추가

```
cloud-drift: translateX(-100%) → translateX(100%), 35s linear infinite
neon-glow: opacity 1→0.7→1, 3s ease-in-out infinite
string-shimmer: opacity 0.4→1→0.4, 2s ease-in-out infinite (+ staggered via animation-delay)
leaf-sway: rotate(-3deg)→rotate(3deg), 2.5s ease-in-out infinite alternate
car-move-right: translateX(-120%)→translateX(400%), 18s linear infinite
car-move-left: translateX(400%)→translateX(-120%), 22s linear infinite
pinwheel-spin: rotate 0→360deg, 4s linear infinite
bulb-twinkle: opacity 0.3→1→0.3, 1.5s ease-in-out infinite
```

### 2. `StudioUnit.tsx` — Compact 유닛 (높이 절반)

- 현재 `h-10` 창문 → `h-7` (compact)
- 전체 row padding `py-1` → `py-0.5`
- 아바타 `w-8 h-10` → `w-6 h-7`
- 이름 창 `h-10` → `h-7`, 텍스트 `text-[10px]`
- 방문 버튼 `w-10 h-10` → `w-7 h-7`
- Penthouse variant는 기존 크기 유지 (루프탑에서 더 크게 보이도록)

### 3. `StudioSidePanel.tsx` — 전면 재구성

**하늘 배경**: 기존 정적 구름 이모지 → CSS `animate-cloud-drift`로 좌→우 이동 루프. 3개 구름을 다른 속도/높이로 배치.

**루프탑 (내 스튜디오)**:
- 간판: "WORSHIP ATELIER" 네온사인에 `animate-neon-glow` 적용
- 스트링 조명: 간판 아래에 작은 원형 점 5~7개를 가로로 배치, 각각 `animate-string-shimmer`에 `animation-delay` 스태거
- 파라솔 이모지 2~3개 (☂️→⛱️) + 작은 테이블 구조물
- "내 스튜디오" 유저 카드는 루프탑 영역 안에 위치

**2F 이웃 / 1F 앰배서더**: 
- FloorLabel 유지하되 가로선 제거 → 벽에 작은 금속 플레이트 느낌 (배경색과 동일, 테두리만)
- `flex-1 min-h-[24px]` 여백 제거 → `min-h-[8px]`로 축소
- StudioUnit에 compact=true 항상 전달 (penthouse 제외)

**G/F 지상층 — 3개 상업 유닛 (SVG/CSS 일러스트)**:
기존 entrance 영역을 3개 가게로 교체. 각 가게는 `flex-1`로 균등 배분.

- **Café**: 줄무늬 어닝(CSS striped background) + "Café" 작은 간판 + 유리창(반투명 bg) 안에 ☕ 실루엣 + 입구 앞 테이블 1개 + 꽃화분(🌸) `animate-leaf-sway`
- **Gallery**: 미니멀 간판 "Gallery" + 흰색 유리창 안에 🖼️ 액자 + 깔끔한 프레임
- **Theatre**: 마키 간판 "Theatre" + 전구 테두리 점 여러 개 `animate-bulb-twinkle` (staggered delay) + 포스터 프레임

**도로**:
- 잔디 제거
- 인도: `bg-[#c4b8a8]` 회색 톤 + 가로등 🏮 1~2개
- 도로: 기존 유지 + 자동차 이모지에 `animate-car-move-right` / `animate-car-move-left` 적용 (정적 absolute → 애니메이션 이동)
- 바람개비 ✤ 또는 CSS 바람개비 → `animate-pinwheel-spin`

**Collapsed 상태**: 지상층 가게 → 간판만 세로 배치, 애니메이션 유지

## 구조 요약 (위→아래)

```text
┌─────────────────────────┐
│     ☁️ SKY (animated)    │
│  ☁️         ☁️           │
├─────────────────────────┤
│ ✨ WORSHIP ATELIER ✨    │ ← neon glow
│  · · · · · · ·          │ ← string lights shimmer
│  ⛱️  [내 스튜디오]  ⛱️   │ ← rooftop user card
├─────────────────────────┤
│  2F · 이웃               │ ← small metal plate label
│  [unit] [unit] [unit]... │ ← compact h-7 windows
├─────────────────────────┤
│  1F · 앰배서더            │
│  [unit] [unit] [unit]    │
├═════════════════════════┤
│ Café  │Gallery│ Theatre  │ ← G/F commercial units
│ ☕ 🌸 │  🖼️   │ 💡🎭    │
├─────────────────────────┤
│ 🏮 sidewalk  🏮         │
│ 🚗→    ═══    ←🚕       │ ← animated cars
│           🌀             │ ← pinwheel
└─────────────────────────┘
```

## 금지 체크
- 고딕 아치 없음, 종교적 요소 없음, 과도한 가로줄 없음, 잔디 없음, 카카오 스타일 없음


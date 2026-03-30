

# 밤/낮 모드 — 타임존 자동 + 토글 버튼

## 개요
유저 타임존 기반으로 밤/낮을 자동 판별하되, 토글 버튼으로 수동 전환 가능. 재접속 시 타임존 기준으로 자동 리셋.

## 새 파일

### `src/lib/nightModeHelper.ts`
- `isNightTime(timezone: string | null): boolean` — 19:00~06:00이면 true (기본값 Asia/Seoul)
- `Intl.DateTimeFormat` 사용하여 해당 타임존의 현재 시각 계산

## 변경 파일

### `src/components/worship-studio/StudioSidePanel.tsx`

**1. isNight 상태 + 토글**
- `useAuth()`에서 `profile?.timezone` 가져오기
- `const autoNight = isNightTime(profile?.timezone)` → 초기값
- `const [isNight, setIsNight] = useState(autoNight)` + `useEffect`로 autoNight 변경 시 동기화 (재접속 시 자동 반영)
- 토글 버튼: 건물 상단(하늘 영역)에 🌙/☀️ 아이콘 버튼 배치

**2. 하늘 배경 (lines 676-688)**
- 낮: 기존 그라디언트 + 구름
- 밤: `#0a0e2a → #141852 → #1a1a40` 그라디언트, 구름 제거
- **별**: SVG 50~70개 랜덤 좌표 원형 (r=0.5~1.5), 흰색, CSS `animate-twinkle` 각각 다른 delay
- **달**: 우측 상단 초승달 SVG, 은은한 glow

**3. 건물 파사드 (glassWallStyle)**
- 밤: `#2a3a4a → #1e2e3e → #182838` 어두운 푸른색 그라디언트
- `isNight` 기반 조건부 스타일 적용

**4. 루프탑 (RooftopScene) — isNight prop 추가**
- 바닥색: `#8a9aaa` → `#3a4a5a`
- 나무/파라솔: opacity 0.4로 낮춰 실루엣화
- **무대만 밝게**: 무대 아래 노란 glow rect + radialGradient 스포트라이트
- 난간색: 어둡게

**5. 스트링 라이트 (RooftopStringLights) — isNight prop 추가**
- 밤: 전구 색 `#ffe066`, opacity 1.0으로 밝게
- 각 전구 아래 빛 삼각형 cone 추가 (노란색, opacity 0.15)
- 전구가 비추지 않는 영역은 기존 어둠 유지

**6. 상가 (GroundFloorShops) — isNight prop 추가**
- 카페: 영업중 — 내부 밝게 유지, 조명 cone 강화 (fillOpacity 높임), 간판 glow
- 갤러리: 영업종료 — 어두운 오버레이 rect `rgba(0,0,0,0.6)` 추가

**7. 도로 (AnimatedRoad) — isNight prop 추가**
- 도로색: `#4a4a4a` → `#2a2a2a`, 인도: `#c4b8a8` → `#6a6050`

### `src/components/worship-studio/StudioUnit.tsx`
- `isNight?: boolean` prop 추가
- empty 유닛: 밤이면 `windowGlow` 대신 `bg-[#1a2a3a]` (불 꺼진 창문)
- 입주 유닛: 밤이면 windowGlow 유지 (불 켜진 따뜻한 창문)

### `src/index.css` (또는 tailwind 설정)
- `@keyframes twinkle` 추가: opacity 0.3 ↔ 1.0, duration 2~4s

## Props 흐름
```text
StudioSidePanel (isNight 계산 + 토글)
  ├── Sky background    ← isNight 조건부 렌더링
  ├── RooftopScene      ← isNight prop
  ├── RooftopStringLights ← isNight prop
  ├── StudioUnit        ← isNight prop (각 유닛에 전달)
  ├── GroundFloorShops  ← isNight prop
  └── AnimatedRoad      ← isNight prop
```

## 토글 버튼 위치
하늘 영역 우측 상단 (z-30), 작은 원형 버튼 (w-6 h-6), 밤이면 ☀️ 표시, 낮이면 🌙 표시

## 파일 목록
1. `src/lib/nightModeHelper.ts` (신규)
2. `src/components/worship-studio/StudioSidePanel.tsx` (대규모 수정)
3. `src/components/worship-studio/StudioUnit.tsx` (isNight prop 추가)
4. `src/index.css` (twinkle 애니메이션 추가)




# 포스트모던 아틀리에 빌딩 전면 재디자인

## 디자인 컨셉
성수동 리모델링 스튜디오 건물. 크림 외벽 + 따뜻한 벽돌 텍스처, 세로로 긴 아틀리에 창문에서 앰버/골든 glow가 새어나오는 구조. 고딕/종교적 요소 완전 제거. "여기서 일하고 싶다"는 욕망을 만드는 감성.

## 파일 변경

### 1. `StudioSidePanel.tsx` — 빌딩 외장 전면 교체

**상단 간판 (기존 rooftop sign 교체)**
- 고딕 폴 제거 → 다크 브라운(`#3a2f28`) 배경에 `text-amber-200/90` 글자로 "WORSHIP ATELIER" 백라이트 간판
- `letter-spacing: 0.2em`, `text-shadow: 0 0 8px rgba(245,190,80,0.6)` glow 효과
- 간판 아래 가느다란 앰버 LED 라인 (`h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent`)

**건물 본체 (기존 `bg-gradient-to-b from-slate-50...` 교체)**
- 외벽: `bg-[#f5f0e8]` (크림/오프화이트) + CSS `repeating-linear-gradient` 벽돌 패턴 (16px 간격, `#e8ddd0` 색 라인으로 은근한 벽돌 줄눈)
- `border-x border-t` → `border-[#d4c5a9]` (따뜻한 사암색)
- `rounded-t-xl` → `rounded-t-md` (포스트모던은 둥근 코너 최소화)
- `boxShadow` → 좌우 미세한 그림자 유지, 상단 금색 라인 제거

**층 구분 (이웃 vs 앰배서더)**
- 이웃 섹션 상단: 얇은 가로선 + 작은 층 번호 "2F" 레이블 (`text-[8px] text-[#a89070] bg-[#f5f0e8] px-1`)
- 앰배서더 섹션 상단: 같은 스타일로 "1F" 레이블
- My Studio(펜트하우스): "3F" 또는 "ROOFTOP" 레이블

**1F 입구 (기존 ground floor 교체)**
- 반원 아치 현관: `border-t` + `rounded-t-full` (로고 아치 스타일) 위에 쌍둥이 문 배치
- 문: 기존 사각형 유지하되 색상 → 다크 브라운(`bg-[#5a4a3a]`) + 유리 부분 `bg-amber-50/40`
- 입구 양쪽: 🌿 식물 포트 아이콘 (기존 꽃 이모지 대체)
- "Worship Atelier" + "kworship.app" 배지 유지, 간판 아래로 이동

**잔디/도로 유지** — 색상만 미세 조정. 꽃 이모지 → 식물 포트 포커스.

**하늘 배경** — 기존 유지 (구름 포함).

### 2. `StudioUnit.tsx` — 창문 스타일 변경

**창문 프레임 교체**
- 기존: `rounded-sm border border-[#8a7a6a]`
- 변경: 다크 브라운/블랙 창틀 `border-[#3a2f28] border-[1.5px] rounded-[2px]`
- 세로로 긴 비율 강조: 아바타 창 `w-8 h-10` (기존 `w-8 h-8`), 이름 창 `h-10`, 방문 버튼 `h-10`

**앰버 glow 효과**
- 각 창문 배경: `bg-white` → `bg-gradient-to-b from-amber-50/80 via-amber-100/40 to-amber-50/60`
- 미세한 inner glow: `shadow-[inset_0_0_6px_rgba(245,190,80,0.15)]`
- "이 안에서 창작이 일어나고 있다"는 따뜻한 빛 느낌

**방문 버튼 색상 조정**
- 모든 variant의 hover bg → `hover:bg-amber-100/80` (통일된 따뜻한 톤)

### 3. collapsed 상태 처리
- 외벽 텍스처와 창틀 스타일은 동일하게 적용
- 간판은 숨김 (기존과 동일)
- 창문은 아바타만 세로 배치 (기존 로직 유지, 프레임 스타일만 변경)

## 금지 사항 체크리스트
- ❌ 고딕 아치 (뾰족한 아치) → ✅ 반원 아치만 입구에 사용
- ❌ 십자가/종교 장식 → ✅ 없음
- ❌ 스테인드글라스 → ✅ 없음
- ❌ 뾰족한 첨탑 → ✅ 없음
- ❌ 카카오 스타일 → ✅ 세련된 포스트모던




# 히어로 수정 계획

## 변경사항 3가지

### 1. "Worship Atelier는..." 타이틀 제거
- 상단 `motion.div` (lines 71-94) 전체 삭제
- Phase 1의 dots 로직도 제거 — 불필요
- Phase 시작을 바로 2부터 (또는 단순화)

### 2. "예배를 삶의 흐름으로" + "연결합니다" 한 블록으로
- 아치 아래에 텍스트를 한 줄로 배치: `예배를 삶의 흐름으로`
- 바로 아래 `연결합니다` — 간격 최소화하여 한 텍스트 블록처럼
- 현재 absolute 배치 → 아치 아래 중앙 정렬 flex column으로 변경

### 3. 아치 애니메이션 반복 버그 수정
- **원인**: `useEffect` for dots가 `[phase]`에 의존 → phase가 2, 3, 4로 변할 때마다 다시 실행되어 `setPhase(2)`를 1.5초 후 호출 → phase가 계속 순환
- **수정**: dots effect의 조건을 `if (phase !== 1) return`으로 변경하여 phase 1에서만 실행
- AtelierArchLogo의 `animate`에서 `startDrawing`이 false→true만 되도록 보장

## 수정 파일

### `AtelierHero.tsx` — 재구성
- 타이틀 섹션 삭제
- Phase 단순화: 1→예배를, 2→삶의 흐름으로, 3→아치+연결합니다, 4→CTA
- 텍스트 레이아웃: 아치 아래 중앙에 두 줄 텍스트 블록
```
    [아치 심볼]
  예배를 삶의 흐름으로
     연결합니다
   [내 공간 만들기]
```
- dots 관련 state/effect 제거
- phase useEffect 버그 수정

### `AtelierArchLogo.tsx` — 변경 없음
- 컴포넌트 자체는 정상, 부모의 phase 버그가 원인


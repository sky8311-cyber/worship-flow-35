

# 히어로 애니메이션 레이아웃 & 순서 재구성

## 새로운 레이아웃 (위→아래)

```text
┌─────────────────────────────────────┐
│                                     │
│     "Worship Atelier" + "는..."     │  ← 로고 SVG 텍스트 + 고운돋움 인라인
│                                     │
│          ╭───────────╮              │
│         ╱   아치 심볼  ╲             │  ← 아치 드로잉 + 별 stamp
│        │               │            │
│        │               │            │
│   "예배를"          "삶의 흐름으로"    │  ← 아치 다리 바로 아래 좌/우 배치
│                                     │
│          "연결합니다"                 │  ← 중앙, 커서 깜빡임
│                                     │
│        [ 내 공간 만들기 ]             │  ← CTA 페이드인
│                                     │
└─────────────────────────────────────┘
```

## 애니메이션 순서

| 순서 | 내용 | 타이밍 |
|------|------|--------|
| 1 | "Worship Atelier는..." — "WORSHIP ATELIER" 는 serif SVG 텍스트로, "는" 은 고운돋움 인라인 텍스트로 페이드인 후 "..." 점 하나씩 타이프라이터 + 깜빡임 | 0s ~ 1.5s |
| 2 | "예배를" — 왼쪽 아치 아래에 페이드인 | ~1.5s |
| 3 | "삶의 흐름으로" — 오른쪽 아치 아래에 페이드인 | ~2.0s |
| 4 | 아치 심볼 드로잉 (outer→inner) + "연결합니다" 타이프라이터 + 별 stamp — 동시 시작 | ~2.5s |
| 5 | CTA 버튼 페이드인 | ~4.5s |

## 수정 파일

### `src/components/atelier-landing/AtelierHero.tsx` — 전면 재작성
- 기존 TypewriterText 컴포넌트 사용 중지, 직접 단계별 state 관리
- 레이아웃을 수직 스택으로 재구성:
  1. 상단: "Worship Atelier" (serif, `<svg>` 텍스트 또는 `font-serif` span) + "는" (font-korean) + "..." 타이프라이터 점
  2. 중앙: AtelierArchLogo (delay prop 전달)
  3. 아치 아래 좌우: "예배를" / "삶의 흐름으로" (motion.div fade-in, relative positioning)
  4. 하단: "연결합니다" (타이프라이터 + 커서)
- 각 단계 완료 시 다음 단계 트리거하는 state machine (`phase: 1|2|3|4|5`)

### `src/components/atelier-landing/AtelierArchLogo.tsx` — delay prop 추가
- `delay` prop 추가하여 아치 드로잉 시작 시점을 Hero에서 제어
- 기존 하드코딩된 delay (0.3s, 0.8s, 2.8s) 대신 `delay` 기준으로 상대 오프셋 적용
- `onArchComplete` 콜백 유지 (별 stamp 완료 시 호출)

## 핵심 구현 디테일

- "Worship Atelier" 텍스트: HTML `<span className="font-serif">Worship Atelier</span><span className="font-korean">는</span>` — SVG 파일 임베드 대신 CSS 폰트 사용 (더 유연)
- "..." 타이프라이터: 점 3개를 순차적으로 표시 후 마지막 점에서 opacity 깜빡임
- "예배를" / "삶의 흐름으로": 아치 컨테이너 기준 `relative` 배치, 아치 다리(하단) 바로 아래 좌/우 정렬
- Phase 4에서 아치 드로잉과 "연결합니다" 타이프라이터가 동시에 시작


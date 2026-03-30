

# 히어로 애니메이션 순서 재구성 + 텍스트 변경

## 변경 요약

### 1. 애니메이션 순서 재설계 (AtelierHero.tsx)

| Phase | 내용 | 타이밍 |
|-------|------|--------|
| 1 | "예배를" 페이드인 | 0.4s |
| 2 | 아치 심볼 드로잉 시작 (outer → inner) | ~1.0s |
| 3 | "삶으로" 타이프라이터 (텍스트 변경) | 아치 완료 후 ~2.7s |
| 4 | "연결합니다." 타이프라이터 (점 추가) | "삶으로" 완료 후 |
| 5 | 별 stamp | "연결합니다." 완료 후 |
| 6 | 내 공간 만들기 버튼 페이드인 | 별 후 ~0.5s |
| 7 | "Start Your Atelier" 페이드인 (텍스트 변경) | 버튼 후 ~0.3s |

### 2. 텍스트 변경
- "삶의 흐름으로" → **"삶으로"** (typewriter 효과)
- "연결합니다" → **"연결합니다."** (마침표 추가)
- "Start Your Studio" → **"Start Your Atelier"**

### 3. AtelierArchLogo.tsx — 별을 분리 제어
- 별 stamp 애니메이션을 `startDrawing`과 분리하여 별도의 `showStar` prop 추가
- Hero에서 Phase 5 시점에 `showStar={true}` 전달
- `onArchComplete` 콜백은 inner arch 완료 시 호출 (Phase 3 트리거용)

### 4. 아틀리에 설명 텍스트 — 히어로 CTA 아래 배치
- CTA 버튼 + "Start Your Atelier" 아래에 작은 글씨로 설명 추가
- 스크롤 인디케이터 위에 위치
- `text-xs text-muted-foreground max-w-sm text-center leading-relaxed font-korean`
- CTA와 함께 페이드인

## 수정 파일
- `src/components/atelier-landing/AtelierHero.tsx` — 전면 재작성
- `src/components/atelier-landing/AtelierArchLogo.tsx` — `showStar` prop 추가


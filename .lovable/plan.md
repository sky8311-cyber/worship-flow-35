

# Worship Atelier 랜딩페이지 — `/atelier-welcome`

## 핵심 연출

페이지 로드 시 중앙에서 시퀀스 애니메이션이 진행됩니다:

```text
[타이프라이터 시작]
"Worship Atelier는"        ← 이 줄이 타이핑되면서 아치 SVG가 왼→오 stroke-dashoffset으로 그려지기 시작
"예배를 삶의 흐름으로"       ← 계속 타이핑, 아치 완성
"연결합니다"               ← 아랫줄에 타이핑 + 커서 깜빡임(blink) + 골드 별이 scale/opacity로 "찍힘"
```

- 아치 로고: SVG inline으로 렌더, `stroke-dasharray` + `stroke-dashoffset` 애니메이션으로 펜 드로잉 효과
- 별: 아치 완료 후 `scale(0→1) + opacity(0→1)` 도장 찍기 효과 (약간의 overshoot ease)
- 로고 크기: 현재 헤더 대비 2~3배 크게 (w-48 ~ w-64 수준)
- 타이프라이터: 한 글자씩 나타나는 커스텀 컴포넌트, 마지막에 `|` 커서 깜빡임

## 페이지 구조 (싱글 스크롤)

### Section 1 — Hero (뷰포트 전체)
- 크림/아이보리 배경 (`bg-[#FAF8F5]`)
- 중앙: 큰 아치 로고 애니메이션 + 타이프라이터 텍스트
- 타이프라이터 완료 후 CTA 버튼 fade-in: "내 공간 만들기"
- 미니멀 상단 네비: 로고(소) + 로그인 버튼

### Section 2 — Problem
- "예배는 따로 있고, 삶은 따로 있습니다"
- fade-in on scroll

### Section 3 — Solution
- 삶→예배로 / 공간→창작 / 과정→흐름 — 3행 텍스트

### Section 4 — Experience (3단계 카드)
- 분위기를 만들고 / 흐름을 세우고 / 삶을 드립니다

### Section 5 — CTA
- "내 공간 만들기" + "K-Worship 플랫폼에서 아틀리에를 만들 수 있습니다"

## 파일 목록

| 파일 | 작업 |
|---|---|
| `src/pages/AtelierWelcome.tsx` | 신규 — 메인 페이지, auth redirect |
| `src/components/atelier-landing/AtelierHero.tsx` | 신규 — 로고 드로잉 + 타이프라이터 시퀀스 |
| `src/components/atelier-landing/AtelierArchLogo.tsx` | 신규 — SVG 아치 stroke 애니메이션 + 별 stamp |
| `src/components/atelier-landing/TypewriterText.tsx` | 신규 — 타이프라이터 + 커서 깜빡임 |
| `src/components/atelier-landing/AtelierProblem.tsx` | 신규 |
| `src/components/atelier-landing/AtelierSolution.tsx` | 신규 |
| `src/components/atelier-landing/AtelierExperience.tsx` | 신규 |
| `src/components/atelier-landing/AtelierCTA.tsx` | 신규 |
| `src/components/atelier-landing/AtelierNav.tsx` | 신규 — 미니멀 네비 |
| `src/App.tsx` | 수정 — `/atelier-welcome` public 라우트 추가 |
| `public/_redirects` | 수정 — redirect 규칙 추가 |

## 애니메이션 타이밍 (대략)

```text
0.0s        페이지 로드
0.3s        아치 outer path 드로잉 시작 + 1행 타이핑 시작
~1.5s       아치 inner path 드로잉 + 2행 타이핑
~2.5s       아치 완성 + 3행 타이핑
~3.0s       커서 깜빡임 2~3회 + 별 stamp (0.3s)
~3.5s       CTA 버튼 fade-in
```

framer-motion의 `useAnimate` / `motion.path` 으로 stroke-dashoffset 제어, 타이프라이터는 `useState` + `setInterval`로 글자 추가.

## 디자인 톤
- 배경: `#FAF8F5` 크림
- 텍스트: `#1F1F1F` + `#666666`
- 악센트: `#B8902A` 골드
- 타이포: Georgia/serif 헤드라인
- 전체적으로 기존 K-Worship 랜딩과 구별되는 따뜻하고 정적인 분위기


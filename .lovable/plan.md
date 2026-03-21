

## Institute Coming Soon 페이지 디자인 수정

### 변경 내용

Institute의 Coming Soon 페이지만 Institute 전용 디자인(Premium Light 테마)을 적용합니다. 범용 `FeatureComingSoon`은 그대로 두고, Institute 전용 Coming Soon 컴포넌트를 새로 만들거나 — 더 간단하게 — `FeatureComingSoon`에 optional props를 추가하여 Institute 스타일을 적용합니다.

가장 깔끔한 방법: **Institute 전용 Coming Soon 컴포넌트** 생성

### 파일: `src/components/institute/InstituteComingSoon.tsx` (신규)

- Institute CSS 테마 적용 (`inst-root` 배경 `#f5f4f0`, 서피스 `#ffffff`, 골드 `#b8902a`)
- 헤더에 `kworship-institute-logo.png` 로고 중앙 배치 (실제 Institute 페이지와 동일)
- 본문 영역:
  - 골드 컬러 아이콘 (GraduationCap)
  - 골드 톤 "준비 중" 배지 (`inst-gold-bg` + `inst-gold` 텍스트)
  - "홈으로 돌아가기" 버튼을 `inst-btn-outline` 스타일로
- 하단에 InstituteBottomNav 유지 (일관성)

### 파일: `src/layouts/InstituteLayout.tsx` (수정)

- `FeatureComingSoon` 대신 `InstituteComingSoon` 렌더링

### 수정 파일 요약

| 파일 | 변경 |
|---|---|
| `src/components/institute/InstituteComingSoon.tsx` | 신규 — Institute 테마 Coming Soon |
| `src/layouts/InstituteLayout.tsx` | import 변경, `InstituteComingSoon` 사용 |


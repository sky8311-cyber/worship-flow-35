

# 데모 페이지 접근성 개선 계획

## 문제
랜딩 페이지의 "데모 써보기" 버튼이 Hero 섹션(상단)에만 있어서 스크롤을 내린 후에는 데모 접근 경로가 없음.

## 변경 내용

### 1. `LandingCTA.tsx` — CTA 섹션에 데모 버튼 추가
- 기존 "무료 시작하기" 버튼 아래에 "🎵 데모 써보기" outline 버튼 추가 (`/demo` 링크)
- Hero 섹션의 버튼 스타일과 동일하게 구성

### 2. `LandingFooter.tsx` — Product 링크에 데모 추가
- `productLinks` 배열에 `{ to: "/demo", label: "데모 써보기" / "Try Demo" }` 항목 추가
- 모바일 아코디언 & 데스크탑 그리드 모두 자동 반영

| 파일 | 변경 |
|------|------|
| `src/components/landing/LandingCTA.tsx` | 데모 버튼 추가 |
| `src/components/landing/LandingFooter.tsx` | Product 링크에 데모 추가 |


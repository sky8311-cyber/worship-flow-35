

# SEO & AI Search Optimization -- 한국어 중심 종합 업그레이드

## 현재 상태 (이미 잘 되어 있는 것들)

| 영역 | 현황 |
|------|------|
| SEOHead 컴포넌트 | titleKo, descriptionKo, keywordsKo 지원 완료 |
| FAQPage JSON-LD | Help 페이지에 이미 구현됨 |
| NewsArticle JSON-LD | NewsDetail에 이미 구현됨 |
| Features ItemList JSON-LD | Features 페이지에 구현됨 |
| robots.txt | AI 크롤러 (GPTBot, ClaudeBot 등) 허용 |
| llms.txt | 한국어/영어 이중 언어 지원 |
| 네이버 Search Advisor | 인증 메타 태그 있음 |
| RSS 피드 | Edge Function으로 동적 생성 |
| OG 태그 | 한국어 기본 설정 완료 |

## 발견된 개선점

| 영역 | 문제 |
|------|------|
| index.html | `WebSite` + `SearchAction` JSON-LD 없음 (구글 사이트링크 검색상자 자격 미달) |
| 사이트맵 | 정적 파일 -- `/news/:slug` 동적 페이지 누락, `lastmod` 날짜 고정 |
| BreadcrumbList JSON-LD | UI 컴포넌트는 있으나 구조화 데이터 schema 없음 |
| 404 페이지 | SEO 메타 태그 없음, noindex 미설정, 한국어 미지원 |
| Landing | WebSite schema 없음 |
| llms.txt | 가격, 경쟁 비교, 변경 이력 등 누락 |
| 한국어 키워드 | 네이버/다음에서 자주 검색되는 롱테일 키워드 보강 필요 |
| preconnect | 외부 리소스 프리로드 없음 (Core Web Vitals 영향) |

---

## 구현 계획

### 1단계: WebSite + SearchAction 스키마 (Google 사이트링크 검색상자)

**파일**: `index.html`

- 기존 JSON-LD에 `WebSite` + `SearchAction` 스키마 추가
- 한국어 `alternateName: "케이워십"` 포함
- `potentialAction.target`: 앱 내 검색 URL 패턴

```text
효과: 구글 검색 결과에 K-Worship 전용 검색창 노출 가능
```

### 2단계: BreadcrumbList JSON-LD (SEOHead 확장)

**파일**: `src/components/seo/SEOHead.tsx`

- 새로운 `breadcrumbs` prop 추가 (배열: `{ name, nameKo, url }[]`)
- `BreadcrumbList` JSON-LD를 자동 생성
- 한국어/영어 이름을 `language` 컨텍스트에 따라 선택

**적용 페이지**: Features, Help, News 페이지에 breadcrumbs 전달

### 3단계: 동적 사이트맵 Edge Function

**새 파일**: `supabase/functions/sitemap/index.ts`

- 데이터베이스에서 `news_posts`를 조회하여 모든 `/news/:slug` URL 포함
- `lastmod`에 실제 `updated_at` 날짜 사용
- `hreflang` 태그 포함 (ko, en)
- 정적 페이지 목록도 포함

**파일**: `public/_redirects`
- `/sitemap.xml` 요청을 Edge Function으로 프록시

### 4단계: 404 페이지 SEO + 한국어 대응

**파일**: `src/pages/NotFound.tsx`

- `SEOHead` 추가: `noIndex=true`
- 한국어/영어 이중 언어 지원
- 유용한 네비게이션 링크 추가 (홈, 도움말, 뉴스)
- 소프트 404 문제 해결

### 5단계: llms.txt 한국어 SEO 강화

**파일**: `public/llms.txt`

추가할 내용:
- 가격 정보 (무료/프리미엄 티어)
- 최근 업데이트 변경 이력
- 경쟁 서비스 대비 차별점
- 한국어 롱테일 검색 키워드 확장:
  - 교회 찬양팀 앱, 예배 순서 만들기, 콘티 만드는 법
  - 찬양 악보 관리, 예배팀 커뮤니케이션 앱
  - 교회 워십밴드 관리, 찬양인도자 도구
- 사용 시나리오별 설명 (한국어)

### 6단계: index.html 한국어 키워드 및 성능 최적화

**파일**: `index.html`

- `<link rel="preconnect">` 추가 (Backend API 도메인)
- `<link rel="dns-prefetch">` 추가
- 한국어 롱테일 키워드 보강:
  - "교회 찬양팀 앱", "예배 순서 프로그램", "콘티 앱"
  - "찬양팀 소통 앱", "예배 계획 도구"

### 7단계: 네이버/다음 최적화 추가 메타 태그

**파일**: `index.html`

- 네이버 검색 결과 최적화를 위한 추가 메타 태그
- `og:locale` 한국어 우선 확인
- 다음(Daum) 검색 등록을 위한 메타 태그 추가 고려

---

## 수정 파일 요약

| 파일 | 작업 | 목적 |
|------|------|------|
| `index.html` | 수정 | WebSite 스키마, preconnect, 한국어 키워드 보강 |
| `src/components/seo/SEOHead.tsx` | 수정 | BreadcrumbList JSON-LD prop 추가 |
| `src/pages/NotFound.tsx` | 수정 | noindex + 한국어 지원 + 유용한 링크 |
| `src/pages/Features.tsx` | 수정 | breadcrumbs JSON-LD 전달 |
| `src/pages/Help.tsx` | 수정 | breadcrumbs JSON-LD 전달 |
| `src/pages/News.tsx` | 수정 | breadcrumbs JSON-LD 전달 |
| `supabase/functions/sitemap/index.ts` | 생성 | 동적 사이트맵 (뉴스 포함) |
| `public/llms.txt` | 수정 | 한국어 키워드/시나리오/가격 확장 |
| `public/_redirects` | 수정 | 사이트맵 프록시 |

## 기대 효과

- **네이버/다음 검색**: 한국어 롱테일 키워드 보강으로 검색 노출 증가
- **구글 검색**: FAQ/뉴스/빵크럼 리치 결과 + 사이트링크 검색상자
- **AI 검색 (ChatGPT, Perplexity)**: 강화된 llms.txt로 정확한 답변 생성
- **크롤링 커버리지**: 동적 사이트맵으로 모든 뉴스 페이지 색인
- **Core Web Vitals**: preconnect 힌트로 로드 시간 단축


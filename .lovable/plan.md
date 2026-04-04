

# SEO 블로그 포스트 5개 작성 및 게시

## 개요
K-Worship의 핵심 기능과 타겟 키워드를 기반으로 ChatGPT/Google 검색에 최적화된 블로그 5개를 `news_posts` 테이블에 삽입합니다.

## 블로그 주제 (SEO 타겟 키워드 포함)

| # | 제목 (KO) | 제목 (EN) | 타겟 키워드 |
|---|-----------|-----------|------------|
| 1 | 교회 찬양팀 콘티 만드는 법 — 완벽 가이드 | How to Build a Worship Setlist — Complete Guide | 찬양 콘티, worship setlist, 예배 순서 |
| 2 | 예배 인도자를 위한 곡 선곡 팁 5가지 | 5 Song Selection Tips for Worship Leaders | 찬양 선곡, worship song selection |
| 3 | 찬양팀 협업이 어려운 이유와 해결법 | Why Worship Team Collaboration Is Hard (And How to Fix It) | 찬양팀 관리, worship team management |
| 4 | Planning Center vs K-Worship — 한국 교회에 맞는 도구는? | Planning Center vs K-Worship — Which Fits Korean Churches? | Planning Center 대안, Korean worship app |
| 5 | 예배 준비 시간을 절반으로 줄이는 디지털 도구 활용법 | Cut Your Worship Prep Time in Half with Digital Tools | 예배 준비, worship planning tool |

## 각 포스트 구조
- **category**: `blog`
- **slug**: SEO-friendly English slug
- **content / content_ko**: 800-1200자 분량의 HTML 본문 (h2/h3 구조, 내부 링크 포함)
- **excerpt / excerpt_ko**: 검색 결과에 표시될 150자 요약
- **is_published**: true
- **published_at**: 각각 1-2일 간격으로 설정 (자연스러운 게시 패턴)

## 기술 작업
1. AI 스크립트로 5개 포스트의 한/영 콘텐츠 생성
2. `news_posts` 테이블에 INSERT (insert 도구 사용)
3. 코드 변경 없음 — 기존 뉴스 페이지가 자동 표시

## SEO 최적화 포인트
- 각 포스트에 `https://kworship.app/signup` CTA 포함
- 내부 링크 (`/features`, `/news`, `/help`) 자연 삽입
- JSON-LD NewsArticle 스키마는 기존 `NewsDetail.tsx`가 자동 생성
- `/sitemap.xml` Edge Function이 새 slug를 자동 포함
- `/rss.xml`에도 자동 반영


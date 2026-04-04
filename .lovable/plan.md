

# 뉴스/블로그 소셜 공유 미리보기 (OG Tags) 수정

## 문제
K-Worship은 SPA(React)이므로, Facebook/Twitter/카카오톡 크롤러가 `/news/slug` URL을 방문하면 JavaScript를 실행하지 않아 `index.html`의 **기본 OG 태그**만 읽힙니다. 즉, 블로그 제목/설명/이미지 대신 항상 "K-Worship - 예배팀을 위한 통합 플랫폼"이 표시됩니다.

## 해결 방법
기존 `og-public-view` Edge Function과 동일한 패턴으로 **`og-news` Edge Function**을 만들고, 공유 URL을 이 함수를 통해 전달합니다.

## 작업 내용

### 1. `og-news` Edge Function 생성
- slug를 받아 `news_posts` 테이블에서 제목/설명/이미지를 조회
- 한국어/영어 OG 태그가 포함된 HTML을 반환
- `<meta http-equiv="refresh">`로 실제 페이지(`/news/slug`)로 리다이렉트
- 카카오톡 전용 meta 태그 포함

### 2. `NewsShareButtons.tsx` 수정
- 공유 URL을 Edge Function URL로 변경:
  ```
  https://jihozsqrrmzzrqvwilyy.supabase.co/functions/v1/og-news/{slug}
  ```
- "링크 복사" 기능도 이 URL 사용

### 3. 결과
- Facebook/Twitter/카카오톡에 공유 시 블로그 제목, 요약, 커버 이미지가 미리보기로 표시
- 클릭하면 실제 블로그 페이지로 리다이렉트


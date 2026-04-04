# SEO 문제 수정 계획

## 수정 항목 4가지

### 1. aggregateRating 제거 (`index.html`)

`index.html`의 SoftwareApplication JSON-LD에서 하드코딩된 `aggregateRating` 블록(111-115행) 삭제. Google 스팸 구조화 데이터 페널티 방지.

### 2. Sitemap에서 noIndex 페이지 제거 (`supabase/functions/sitemap/index.ts`)

현재 `/login`이 sitemap에 포함되어 있지만 `noIndex={true}`로 설정됨 → 모순. staticPages 배열에서 `/login` 제거. (`/signup`은 noIndex가 아니므로 유지)

### 3. robots.txt에 Naver Yeti 봇 추가 (`public/robots.txt`)

네이버 검색 크롤러 `Yeti` 전용 규칙 추가:

```
User-agent: Yeti
Allow: /
```

### 4. OG 이미지 1200x630 생성

AI 이미지 생성(`google/gemini-3-pro-image-preview`)으로 K-Worship 송라이브러리 데스크탑뷰 스크린샷으로 컬러의1200x630 OG 이미지 생성 → Supabase Storage 업로드 → `index.html`의 `og:image` 및 `twitter:image` URL 교체, `og:image:width/height` 업데이트.

## 파일 변경 요약


| 파일                                    | 변경                                      |
| ------------------------------------- | --------------------------------------- |
| `index.html`                          | aggregateRating 삭제, OG 이미지 URL·사이즈 업데이트 |
| `supabase/functions/sitemap/index.ts` | `/login` 항목 제거                          |
| `public/robots.txt`                   | Yeti 봇 규칙 추가                            |
| `public/sitemap.xml`                  | `/login` 항목 제거 (정적 백업 파일)               |
| 새 이미지 파일                              | 1200x630 OG 이미지 생성·업로드                  |

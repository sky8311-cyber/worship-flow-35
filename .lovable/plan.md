

# RSS를 kworship.app 도메인에서 제공하기

## 문제
네이버 Search Advisor는 RSS URL이 `kworship.app` 도메인이어야 합니다. Supabase Edge Function URL은 허용되지 않습니다.

## 해결 방법
`public/rss.xml` 정적 파일을 생성하여 Lovable 호스팅에서 `https://kworship.app/rss.xml`로 직접 접근 가능하게 합니다. (`public/sitemap.xml`이 정상 동작하는 것과 같은 원리)

### 구현 단계

1. **Edge Function에서 현재 RSS 데이터 가져오기** — 기존 `rss-feed` Edge Function을 호출하여 최신 RSS XML 콘텐츠를 획득

2. **`public/rss.xml` 정적 파일 생성** — 가져온 XML을 `public/rss.xml`로 저장. Lovable 호스팅이 이 파일을 `kworship.app/rss.xml`에서 직접 서빙

3. **코드 내 RSS 링크 복원** — `News.tsx`, `AdminNews.tsx`, `robots.txt`의 RSS URL을 `https://kworship.app/rss.xml`로 변경 (이전에 Edge Function URL로 바꿨던 것 복원)

4. **`index.html`에 RSS alternate link 추가** — `<link rel="alternate" type="application/rss+xml">` 메타 태그 추가

### 제한사항
정적 파일이므로 새 뉴스 게시 시 자동 업데이트되지 않습니다. 뉴스 발행 후 저에게 RSS 업데이트를 요청하시면 됩니다.

### 변경 파일
| 파일 | 변경 |
|------|------|
| `public/rss.xml` | 신규 생성 (정적 RSS XML) |
| `src/pages/News.tsx` | RSS URL → `kworship.app/rss.xml` |
| `src/pages/AdminNews.tsx` | RSS URL → `kworship.app/rss.xml` |
| `public/robots.txt` | RSS-Feed URL → `kworship.app/rss.xml` |
| `index.html` | RSS alternate link 메타 태그 추가 |


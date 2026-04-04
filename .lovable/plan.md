

# RSS 접근 실패 해결 계획

## 문제 원인

`https://kworship.app/rss.xml`이 404를 반환합니다. Edge Function 자체는 정상 동작(200, XML 응답 확인)하지만, `public/_redirects` 파일의 프록시 규칙(`/rss.xml → Edge Function`, 200 rewrite)이 Lovable 호스팅에서 지원되지 않아 요청이 SPA 라우터로 빠지면서 404가 발생합니다.

참고: `/sitemap.xml`은 `public/sitemap.xml` 정적 파일이 있어 정상 동작하지만, `/rss.xml`은 정적 파일이 없어 프록시에만 의존하고 있었습니다.

## 해결 방법: 정적 RSS 리다이렉트 페이지 + Naver 직접 URL

### 1단계: 임시 해결 — Naver에 직접 Edge Function URL 제출

Naver Search Advisor RSS 제출 시 아래 URL을 사용:

```
https://jihozsqrrmzzrqvwilyy.supabase.co/functions/v1/rss-feed
```

이 URL은 바로 RSS XML을 반환하므로 Naver 크롤러가 정상적으로 수집할 수 있습니다.

### 2단계: `/rss.xml` 경로 정상화

`public/rss.xml`에 정적 XML 파일을 생성하되, 내부에 최신 뉴스 데이터를 포함시키기 위해 **RSS Edge Function을 호출하는 별도의 프록시 Edge Function(`rss-proxy`)**을 만드는 대신, 더 간단한 방법을 사용합니다:

- `index.html` 및 코드 내 RSS 링크를 Edge Function 직접 URL로 변경
- `robots.txt`의 RSS-Feed URL도 Edge Function 직접 URL로 변경

### 변경 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/pages/News.tsx` | RSS 링크를 Edge Function URL로 변경 |
| `src/pages/AdminNews.tsx` | RSS 링크를 Edge Function URL로 변경 |
| `public/robots.txt` | RSS-Feed URL을 Edge Function URL로 변경 |
| `index.html` | RSS alternate link URL 변경 (있는 경우) |

이렇게 하면 `/rss.xml` 프록시 의존성을 제거하고, 모든 RSS 요청이 직접 Edge Function으로 향하므로 네이버를 포함한 모든 크롤러가 정상 접근할 수 있습니다.


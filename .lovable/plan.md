
# RSS 피드 URL을 kworship.app/rss.xml로 변경

## 현재 상황

- RSS Edge Function: `https://jihozsqrrmzzrqvwilyy.supabase.co/functions/v1/rss-feed`
- News.tsx에서 `/rss.xml` 링크 사용 중 (현재 작동 안함)
- 네이버/구글 RSS 등록 시 깔끔한 URL 필요

## 해결 방안

Lovable 프로젝트는 정적 호스팅을 사용하므로, `/rss.xml` 경로에서 Edge Function으로 리다이렉트하는 방식이 필요합니다.

### 구현 방법: Netlify Redirects 설정

`public/_redirects` 파일을 생성하여 `/rss.xml` 요청을 Edge Function으로 프록시합니다.

```text
/rss.xml https://jihozsqrrmzzrqvwilyy.supabase.co/functions/v1/rss-feed 200
/rss.xml?* https://jihozsqrrmzzrqvwilyy.supabase.co/functions/v1/rss-feed?:splat 200
```

`200` 상태 코드는 "rewrite" (프록시)를 의미하여, URL은 `kworship.app/rss.xml`로 유지되면서 실제 콘텐츠는 Edge Function에서 가져옵니다.

---

## 변경 사항

| 파일 | 작업 |
|------|------|
| `public/_redirects` | 새 파일 - RSS 프록시 설정 |
| `public/robots.txt` | RSS 피드 URL 추가 |

---

## 파일 내용

### public/_redirects (새 파일)
```text
# RSS Feed Proxy
/rss.xml https://jihozsqrrmzzrqvwilyy.supabase.co/functions/v1/rss-feed 200

# RSS Feed with query parameters (category filter)
/rss.xml?category=:category https://jihozsqrrmzzrqvwilyy.supabase.co/functions/v1/rss-feed?category=:category 200
```

### public/robots.txt 추가
```text
# RSS Feed location
RSS-Feed: https://kworship.app/rss.xml
```

---

## 최종 RSS 피드 URL

| 용도 | URL |
|------|-----|
| 전체 피드 | `https://kworship.app/rss.xml` |
| 업데이트만 | `https://kworship.app/rss.xml?category=update` |
| 뉴스만 | `https://kworship.app/rss.xml?category=news` |
| 블로그만 | `https://kworship.app/rss.xml?category=blog` |
| 보도자료만 | `https://kworship.app/rss.xml?category=press` |

## 네이버 서치어드바이저 등록

위 URL로 네이버 서치어드바이저에서 RSS 등록:
1. 네이버 서치어드바이저 → 사이트 관리 → RSS 제출
2. URL 입력: `https://kworship.app/rss.xml`
3. 제출 완료

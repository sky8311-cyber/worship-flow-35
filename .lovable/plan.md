

# K-Worship 뉴스/블로그 + RSS 피드 + 추가 기능 구현 계획

## 개요

랜딩페이지에 "뉴스" 섹션을 추가하고, 관리자 대시보드에서 쉽게 콘텐츠를 관리할 수 있는 시스템을 구축합니다. 백링크 마케팅과 SEO 최적화를 위한 RSS 피드, 이메일 뉴스레터 연동, 소셜 공유, 동적 OG 이미지 생성까지 포함합니다.

---

## 현재 상태 분석

| 항목 | 현재 상태 |
|------|----------|
| 랜딩페이지 | `LandingHeroSimple` + `LandingCTA` (깔끔하고 심플) |
| 보도자료 | `Press.tsx`에 2건의 하드코딩된 미디어 보도 (링크만 연결) |
| Admin Nav | Primary 5개 + More 드롭다운 구조 |
| 자동 이메일 시스템 | `process-automated-emails` Edge Function + `automated_email_settings` 테이블 존재 |
| OG 이미지 생성 | `og-public-view` Edge Function 패턴 존재 |
| RSS | 없음 |

---

## Phase 1: 데이터베이스 설계

### 새 테이블: `news_posts`

```sql
CREATE TABLE public.news_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_ko TEXT,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  content_ko TEXT,
  excerpt TEXT,
  excerpt_ko TEXT,
  category TEXT NOT NULL DEFAULT 'news',
  cover_image_url TEXT,
  external_url TEXT,
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  author_id UUID REFERENCES auth.users(id),
  view_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 유효한 카테고리 제약
ALTER TABLE news_posts ADD CONSTRAINT valid_category 
  CHECK (category IN ('news', 'update', 'blog', 'press'));

-- RLS 정책
ALTER TABLE news_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published posts are viewable by all"
  ON news_posts FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can manage all posts"
  ON news_posts FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 인덱스
CREATE INDEX idx_news_posts_published ON news_posts(is_published, published_at DESC);
CREATE INDEX idx_news_posts_category ON news_posts(category, published_at DESC);
CREATE INDEX idx_news_posts_slug ON news_posts(slug);
```

### 새 테이블: `news_newsletter_subscribers` (이메일 뉴스레터용)

```sql
CREATE TABLE public.news_newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMPTZ DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ
);

ALTER TABLE news_newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own subscription"
  ON news_newsletter_subscribers FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all"
  ON news_newsletter_subscribers FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
```

---

## Phase 2: 랜딩페이지 뉴스 섹션

### 위치 및 디자인

```text
┌─────────────────────────────────┐
│     LandingHeroSimple           │
│     (기능 소개 + CTA)           │
├─────────────────────────────────┤
│   ✨ NEW: LandingNews           │
│   "최신 소식" / "What's New"    │
│   ┌────┐ ┌────┐ ┌────┐          │
│   │카드1│ │카드2│ │카드3│        │
│   └────┘ └────┘ └────┘          │
│       [더보기 →]                │
├─────────────────────────────────┤
│     LandingCTA                  │
│     (가입 유도)                 │
└─────────────────────────────────┘
```

### `LandingNews.tsx` 컴포넌트

**UI 특징:**
- 최신 3개 포스트를 카드 형태로 표시
- 카테고리별 배지 (뉴스/업데이트/블로그/보도자료)
- 외부 링크 아이콘 (보도자료용)
- 호버 시 부드러운 애니메이션
- "더보기" 버튼 → `/news` 페이지로 이동
- 반응형: 모바일 1열, 태블릿 2열, 데스크톱 3열

---

## Phase 3: 뉴스 전체 목록 페이지 `/news`

### 새 페이지: `src/pages/News.tsx`

**기능:**
- 모든 공개된 뉴스 포스트 목록
- 카테고리 필터 탭 (전체 | 뉴스 | 업데이트 | 블로그 | 보도자료)
- 무한 스크롤 또는 페이지네이션
- SEO 최적화 (SEOHead, JSON-LD NewsArticle 스키마)

### 새 페이지: `src/pages/NewsDetail.tsx`

**기능:**
- 개별 포스트 상세 페이지 (`/news/:slug`)
- 소셜 공유 버튼 (Twitter, Facebook, KakaoTalk)
- 관련 포스트 추천
- 조회수 증가 로직

---

## Phase 4: 관리자 뉴스 관리 페이지

### 새 Admin 페이지: `/admin/news` (`src/pages/AdminNews.tsx`)

**기능:**
1. **포스트 목록** - 모든 포스트 테이블 (초안/공개/카테고리 필터)
2. **새 포스트 작성** - 다이얼로그 또는 전용 페이지
3. **수정/삭제** - 인라인 액션
4. **발행/비발행 토글**
5. **뉴스레터 발송** - 포스트별 "뉴스레터로 발송" 버튼

**에디터 기능:**
- 제목 (한/영)
- 내용 (TipTap Rich Text 에디터 재사용)
- 요약 (한/영) - 자동 생성 또는 직접 입력
- 카테고리 선택
- 커버 이미지 업로드
- 외부 링크 (보도자료용)
- 발행일 설정
- 미리보기 기능

### Admin Nav 업데이트

`secondaryLinks`에 추가:
```typescript
{
  to: "/admin/news",
  label: language === "ko" ? "뉴스" : "News",
  icon: Newspaper,
}
```

---

## Phase 5: RSS 피드 (Edge Function)

### 새 Edge Function: `rss-feed`

**경로:** `supabase/functions/rss-feed/index.ts`

**기능:**
- RSS 2.0 형식의 XML 피드 생성
- 카테고리별 필터링 지원 (`?category=update`)
- 최신 50개 포스트 포함
- 캐싱 (1시간)

**URL 구조:**
- `/rss.xml` → 전체 피드
- `/rss.xml?category=update` → 업데이트만
- `/rss.xml?category=press` → 보도자료만
- `/rss.xml?category=blog` → 블로그만

**RSS 피드 예시:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>K-Worship 뉴스</title>
    <link>https://kworship.app/news</link>
    <description>예배팀을 위한 통합 플랫폼 K-Worship의 최신 소식</description>
    <language>ko</language>
    <atom:link href="https://kworship.app/rss.xml" rel="self"/>
    <item>
      <title>새로운 기능 업데이트</title>
      <link>https://kworship.app/news/new-feature</link>
      <pubDate>Mon, 27 Jan 2026 00:00:00 GMT</pubDate>
      <description>...</description>
      <category>update</category>
    </item>
  </channel>
</rss>
```

---

## Phase 6: 이메일 뉴스레터 연동

### 기존 시스템 활용

현재 `process-automated-emails` Edge Function과 `automated_email_settings` 테이블이 있으므로, 이 패턴을 확장합니다.

### 새 Edge Function: `send-news-newsletter`

**기능:**
- 특정 뉴스 포스트를 뉴스레터로 발송
- `news_newsletter_subscribers` 테이블의 활성 구독자에게 발송
- 발송 로그 기록 (`automated_email_log` 재사용 또는 별도 테이블)
- Rate limiting (Resend API 제한 준수)

**템플릿:**
- 기존 브랜드 이메일 템플릿 스타일 재사용 (blue-coral gradient)
- 포스트 제목, 요약, CTA 버튼 포함

### 구독 관리

- `/settings` 페이지에 뉴스레터 구독 토글 추가
- 이메일 하단에 구독 취소 링크
- 로그인 사용자: `news_newsletter_subscribers.user_id` 연결
- 비로그인 사용자: 이메일만으로 구독 (향후 확장)

---

## Phase 7: 소셜 공유 버튼

### 공유 컴포넌트: `NewsShareButtons.tsx`

**지원 플랫폼:**
- **Twitter/X**: `https://twitter.com/intent/tweet?text=...&url=...`
- **Facebook**: `https://www.facebook.com/sharer/sharer.php?u=...`
- **KakaoTalk**: Kakao SDK 또는 딥링크
- **링크 복사**: 클립보드 복사 + 토스트 알림

**UI:**
- 뉴스 상세 페이지 상단에 배치
- 아이콘 버튼 형태 (현재 `Press.tsx`의 공유 기능 재사용)

---

## Phase 8: 동적 OG 이미지 생성

### 새 Edge Function: `og-news-image`

**참고:** 현재 `og-public-view` 패턴을 확장

**기능:**
- 포스트별 동적 OpenGraph 이미지 생성
- 제목, 카테고리, 발행일 포함
- K-Worship 브랜드 스타일 유지

**구현 방식:**
1. **Satori + Resvg** (Vercel OG 방식) - Deno에서 지원
2. 또는 **Canvas API** 사용

**URL:** `https://kworship.app/api/og/news/:slug`

### SEOHead 통합

```typescript
<SEOHead
  title={post.title}
  description={post.excerpt}
  ogImage={`https://kworship.app/api/og/news/${post.slug}`}
  canonicalPath={`/news/${post.slug}`}
/>
```

---

## Phase 9: 기존 보도자료 마이그레이션

### `Press.tsx` → `news_posts` 데이터 이전

| 제목 | 카테고리 | 외부링크 |
|------|----------|----------|
| 찬양 준비의 영성, 데이터로 남다… | press | kctusa.org/... |
| 찬양을 준비하는 시간, 그 수고는... | press | christiantimes.ca/... |

**마이그레이션 SQL:**
```sql
INSERT INTO news_posts (title, title_ko, slug, content, content_ko, category, external_url, is_published, published_at)
VALUES 
  ('K-Worship Platform Officially Launches', 
   '찬양 준비의 영성, 데이터로 남다… 예배 인도자 플랫폼 ''K-Worship'' 공식 런칭',
   'kworship-launch-kct-usa',
   'Press coverage by The Korean Christian Times (USA)',
   '크리스찬타임스 (USA) 보도',
   'press',
   'https://www.kctusa.org/news/articleView.html?idxno=79074',
   true,
   '2026-01-15'::timestamptz),
  ('Where Does the Labor of Worship Preparation Go?',
   '찬양을 준비하는 시간, 그 수고는 어디에 남는가?',
   'kworship-launch-christian-times-ca',
   'Press coverage by The Christian Times (Canada)',
   '크리스천신문 (Canada) 보도',
   'press',
   'https://christiantimes.ca/christian-news/canada/20657/',
   true,
   '2026-01-16'::timestamptz);
```

### `Press.tsx` 업데이트

- 하드코딩된 `mediaCoverage` 배열 → DB에서 `category='press'` 포스트 조회
- 보도자료 섹션을 동적으로 렌더링

---

## Phase 10: SEO 및 검색엔진 최적화

### sitemap.xml 업데이트

```xml
<url>
  <loc>https://kworship.app/news</loc>
  <changefreq>daily</changefreq>
  <priority>0.8</priority>
</url>
```

**동적 sitemap 고려:**
- 개별 뉴스 포스트 URL도 sitemap에 포함
- Edge Function으로 동적 생성 또는 빌드 시 정적 생성

### llms.txt 업데이트

```markdown
## 뉴스 및 업데이트
K-Worship의 최신 소식, 기능 업데이트, 보도자료를 확인하세요.
- 뉴스 피드: https://kworship.app/news
- RSS 피드: https://kworship.app/rss.xml
- 카테고리: 뉴스, 업데이트, 블로그, 보도자료
```

### robots.txt

```
Sitemap: https://kworship.app/sitemap.xml
```

### LandingFooter 업데이트

뉴스 링크 추가:
```typescript
{ label: language === "ko" ? "뉴스" : "News", to: "/news" }
```

---

## 파일 변경 요약

| 파일 | 작업 |
|------|------|
| **DB 마이그레이션** | `news_posts`, `news_newsletter_subscribers` 테이블 + RLS |
| `src/pages/News.tsx` | 새 파일 - 뉴스 목록 페이지 |
| `src/pages/NewsDetail.tsx` | 새 파일 - 뉴스 상세 페이지 |
| `src/pages/AdminNews.tsx` | 새 파일 - 관리자 뉴스 관리 |
| `src/components/landing/LandingNews.tsx` | 새 파일 - 랜딩 뉴스 섹션 |
| `src/components/news/NewsShareButtons.tsx` | 새 파일 - 소셜 공유 버튼 |
| `src/components/news/NewsCard.tsx` | 새 파일 - 뉴스 카드 컴포넌트 |
| `src/pages/Landing.tsx` | LandingNews 컴포넌트 추가 |
| `src/pages/Press.tsx` | 동적 보도자료 조회로 변경 |
| `src/pages/Settings.tsx` | 뉴스레터 구독 토글 추가 |
| `src/components/admin/AdminNav.tsx` | 뉴스 메뉴 추가 |
| `src/App.tsx` | `/news`, `/news/:slug`, `/admin/news` 라우트 추가 |
| `supabase/functions/rss-feed/index.ts` | 새 파일 - RSS 피드 생성 |
| `supabase/functions/send-news-newsletter/index.ts` | 새 파일 - 뉴스레터 발송 |
| `supabase/functions/og-news-image/index.ts` | 새 파일 - 동적 OG 이미지 |
| `public/sitemap.xml` | `/news` 추가 |
| `public/llms.txt` | 뉴스 섹션 설명 추가 |
| `src/components/landing/LandingFooter.tsx` | 뉴스 링크 추가 |
| `supabase/config.toml` | 새 Edge Function 설정 추가 |

---

## 예상 효과

| 지표 | 기대 효과 |
|------|----------|
| **SEO** | 정기적인 콘텐츠 업데이트 → 검색 순위 상승 |
| **백링크** | 보도자료 원문 + 내부 링크 → 도메인 권위 강화 |
| **사용자 참여** | 업데이트 소식 공유 → 재방문율 증가 |
| **RSS 구독** | 네이버/Feedly 등에서 자동 피드 구독 가능 |
| **AI 검색** | llms.txt + RSS → AI 크롤러 최적화 |
| **뉴스레터** | 직접 이메일 도달 → 높은 전환율 |
| **소셜 공유** | OG 이미지 + 공유 버튼 → 바이럴 효과 |

---

## 네이버 블로그 연동 참고

네이버 블로그에 RSS 자동 발행은 네이버 자체 지원이 제한적입니다. 대안:

1. **IFTTT/Zapier**: RSS → 네이버 블로그 자동 포스팅 (제한적)
2. **수동 cross-posting**: 관리자가 주요 포스트를 네이버 블로그에도 게시
3. **네이버 포스트**: 네이버 포스트 채널 개설 후 연동 검토

---

## 구현 우선순위 제안

| 단계 | 항목 | 예상 시간 |
|------|------|----------|
| 1 | DB 스키마 + 기본 CRUD | 30분 |
| 2 | Admin 뉴스 관리 페이지 | 45분 |
| 3 | 공개 뉴스 목록 + 상세 페이지 | 45분 |
| 4 | 랜딩페이지 뉴스 섹션 | 20분 |
| 5 | RSS 피드 Edge Function | 30분 |
| 6 | 보도자료 마이그레이션 | 15분 |
| 7 | 소셜 공유 버튼 | 20분 |
| 8 | 뉴스레터 시스템 | 40분 |
| 9 | 동적 OG 이미지 | 45분 |
| 10 | SEO 최적화 (sitemap, llms.txt) | 15분 |

**총 예상 시간:** 약 5시간


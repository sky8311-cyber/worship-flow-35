

# 공개 데모 페이지 (`/demo`) 계획

## 핵심 목표
1. 곡 제목/아티스트/유튜브/악보 이미지가 검색 엔진에 인덱싱됨
2. 비로그인 사용자가 핵심 기능을 체험할 수 있음
3. 워십세트 만들기 시도 시 가입 유도

## 필요한 DB 변경

현재 `songs` 테이블의 SELECT RLS 정책이 `authenticated` 전용입니다. 데모 페이지는 비로그인 접근이므로:

- **새 RLS 정책 추가**: `anon` 사용자가 공개 곡(`is_private = false`, `status = 'published'`)을 SELECT할 수 있도록 허용
- `song_scores` 테이블은 이미 `Anyone can view` 정책이 있어 변경 불필요

## 구현 파일

| 파일 | 변경 |
|------|------|
| **DB Migration** | songs 테이블에 anon SELECT 정책 추가 |
| `src/pages/Demo.tsx` | **신규** — 공개 데모 페이지 (SongLibrary 간소화 버전) |
| `src/components/demo/DemoSignupCTA.tsx` | **신규** — 가입 유도 모달/다이얼로그 |
| `src/App.tsx` | `/demo` 공개 라우트 추가 |
| `src/components/landing/LandingHeroSimple.tsx` | "데모 써보기" 버튼 추가 |
| `public/robots.txt` | `/demo` Allow 확인 (이미 기본 Allow) |
| `public/sitemap.xml` | `/demo` 항목 추가 |
| `supabase/functions/sitemap/index.ts` | `/demo` 정적 페이지 추가 |

## Demo.tsx 핵심 설계

- Supabase anon key로 `songs` 테이블에서 공개 곡 100개 fetch (`is_private=false, status=published`, LIMIT 100)
- `song_scores` join으로 악보 정보도 함께 가져옴
- 기존 `SongCard`, `SongTable`, `ScorePreviewDialog` 컴포넌트 재사용
- `useAuth` 의존 없이 동작 — 편집/삭제 버튼 숨김, 읽기 전용 모드
- 검색/필터(제목, 아티스트, 키, 언어) 기능 작동
- 유튜브 재생 작동 (MusicPlayer 컨텍스트 활용)
- 악보 미리보기 작동 (ScorePreviewDialog)
- 카트 담기 가능 (localStorage 기반, 로그인 불필요)
- "워십세트 만들기" / "새 곡 추가" 클릭 → `DemoSignupCTA` 모달 표시

## SEO 구성

- `SEOHead`에 H1 "K-Worship 찬양 라이브러리" + 찬양 관련 키워드
- JSON-LD `ItemList` 스키마: 100곡의 제목/아티스트/유튜브 URL을 구조화 데이터로 포함
- 각 곡의 `MusicComposition` 스키마 (name, composer, url)
- 페이지 하단에 곡 목록을 SEO 친화적 HTML로 렌더링 (SSR 불가하므로 클라이언트 렌더링이지만 Google은 JS 렌더링 지원)

## 랜딩 페이지 변경

`LandingHeroSimple.tsx`의 CTA 버튼 영역에 "데모 써보기" 보조 버튼 추가 (`/demo` 링크, outline 스타일)

## 보안
- 가사(`lyrics`), 노트(`notes`) 필드는 데모에서 fetch하지 않음
- 공개 곡 메타데이터만 노출 (제목, 아티스트, 키, 언어, 유튜브, 악보)
- 기존 보호 라우트(`/songs`) 변경 없음


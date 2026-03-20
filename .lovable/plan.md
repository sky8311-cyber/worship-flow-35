

## /admin/songlibrary 페이지 + YouTube 스마트 매칭 구현

### 개요
관리자 전용 Song Library 관리 페이지(4개 탭)와 YouTube 검색 Edge Function, 재사용 가능한 SmartSongEntry 컴포넌트를 구현합니다.

---

### 1. Edge Function: `search-youtube`

**파일**: `supabase/functions/search-youtube/index.ts`

- POST 요청, `{ title, artist? }` 수신
- 쿼리 조합: artist 있으면 `"{title} {artist} 찬양"`, 없으면 `"{title} CCM 찬양"`
- YouTube Data API v3 `/search` 호출 (maxResults=5, type=video, relevanceLanguage=ko)
- Secret: `YOUTUBE_API_KEY` — 현재 `VITE_YOUTUBE_API_KEY`만 존재하므로 `YOUTUBE_API_KEY`를 새로 추가 (값: `AIzaSyDebIF_jHyj9p4Gx5m4GFnGNpOValfToWs`)
- CORS 헤더 포함, JWT 인증 검증

---

### 2. SmartSongEntry 컴포넌트

**파일**: `src/components/songs/SmartSongEntry.tsx`

독립 컴포넌트 (Admin/User 양쪽 재사용 가능)

| Props | 설명 |
|---|---|
| `songId?` | 기존 곡 수정 시 |
| `initialTitle?` | 초기 제목 |
| `initialArtist?` | 초기 아티스트 |
| `onSave(data)` | 저장 콜백 |
| `onSkip?()` | 건너뛰기 콜백 |

**UI 플로우**:
1. 제목/아티스트 입력 + "YouTube 검색" 버튼
2. 검색 결과 5개 카드 (썸네일, 영상 제목, 채널명, 미리보기/선택 버튼)
3. 선택 시 youtube_url 자동 입력, artist 비어있으면 channelTitle 자동 채움
4. 저장 버튼 → onSave 콜백

---

### 3. AdminSongLibrary 페이지

**파일**: `src/pages/AdminSongLibrary.tsx`

**라우트**: `/admin/songlibrary` (App.tsx에 AdminRoute 래핑 추가)

**AdminNav**: secondaryLinks에 "Song Library" 메뉴 추가 (Music 아이콘)

**탭 구조**:

| 탭 | 내용 |
|---|---|
| 전체 목록 | songs 테이블 조회, 검색, 페이지네이션(20개), 인라인 편집 |
| YouTube 매칭 | youtube_url 없는 곡 목록, SmartSongEntry로 한 곡씩 매칭, 자동 다음 곡 이동 |
| 중복 감지 | 기존 DuplicateReviewDialog + duplicateFinder 로직 재사용 (SongLibrary에서 삭제하지 않음) |
| 미완성 곡 | 가사/태그/아티스트 누락 곡 목록, 인라인 편집 |

---

### 4. 기존 코드 변경사항

| 파일 | 변경 |
|---|---|
| `src/App.tsx` | AdminSongLibrary 라우트 추가 (1줄 import + 1줄 Route) |
| `src/components/admin/AdminNav.tsx` | secondaryLinks에 Song Library 링크 추가 |
| 기존 SongLibrary.tsx | 변경 없음 (중복 감지 기능 유지) |

---

### 5. 새로 생성할 파일

1. `supabase/functions/search-youtube/index.ts`
2. `src/components/songs/SmartSongEntry.tsx`
3. `src/pages/AdminSongLibrary.tsx`

---

### 기술 세부사항

- YouTube API 키는 `add_secret` 도구로 `YOUTUBE_API_KEY` 이름으로 Edge Function secret에 저장
- Edge Function 내부에서 JWT 검증 (admin만 사용 가능하도록)
- AdminLayout 래퍼 사용하여 기존 admin UI 스타일 통일
- 페이지네이션은 Supabase `.range()` 활용
- 중복 감지 탭은 기존 `DuplicateReviewDialog`를 인라인으로 렌더링 (Dialog 대신 직접 컴포넌트 사용 또는 Dialog 트리거)


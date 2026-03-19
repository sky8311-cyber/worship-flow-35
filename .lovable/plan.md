

## Song Library 데이터 보호 — Export를 서버사이드로 이동

### 현재 상태 분석

**songs 테이블 RLS 정책 (현재):**
- SELECT: `"Authenticated users can view songs"` → 모든 인증 유저 `USING (true)`
- INSERT/UPDATE/DELETE: worship_leader 또는 admin만 가능

**문제점:**
- SELECT가 완전 개방이므로, 어떤 로그인 유저든 Supabase API로 직접 `songs.select("*")`를 호출하면 전체 라이브러리(582곡 + 가사 + 악보URL + YouTube링크) 일괄 다운로드 가능
- Export 함수(`handleExportXLSX`)는 클라이언트에서 `isAdmin` 체크만 하고, 실제 데이터는 일반 SELECT로 가져옴
- `song_youtube_links`, `song_scores` 테이블도 마찬가지로 SELECT 개방

**SELECT RLS를 제한하면 안 되는 이유:**
songs SELECT는 앱 전체에서 광범위하게 사용됨 (총 5개 파일, 30+ 호출):
- `SongLibrary.tsx` — 곡 브라우징 (모든 유저)
- `Dashboard.tsx` — 곡 수 카운트
- `SetBuilder` — 세트에 곡 추가 시 검색
- `useSetAuditHistory.ts` — 감사 로그에서 곡 제목 조회
- `AdminDashboard.tsx` — 관리자 통계
- Edge function `generate-worship-set` — AI 세트 생성 시 곡 목록 조회

→ SELECT RLS를 건드리면 기존 기능 전체가 깨질 위험이 큼

### 안전한 접근법: Export만 서버사이드로 이동

기존 RLS/기능은 그대로 두고, **대량 데이터 반출(export)만** 서버에서 admin 검증 후 허용.

**1. Edge Function 생성 — `export-songs`**
- JWT 인증 + 서버사이드 admin 역할 검증
- songs + song_youtube_links + song_scores를 service role로 조회하여 JSON 반환
- 비admin이 호출하면 403 거부

**2. `SongLibrary.tsx` 수정**
- `handleExportXLSX`에서 직접 DB 쿼리 3개(`songs`, `song_youtube_links`, `song_scores`)를
  `supabase.functions.invoke('export-songs')` 한 번으로 교체
- 응답 데이터로 기존 XLSX 생성 로직 유지

**3. `config.toml`에 함수 등록**
```toml
[functions.export-songs]
verify_jwt = true
```

### 기존 기능 안전 체크리스트

변경 후 아래 기능이 정상 작동하는지 코드 레벨에서 확인:

| 기능 | 영향 여부 | 이유 |
|------|-----------|------|
| Song Library 브라우징 | ❌ 무관 | SELECT RLS 변경 없음 |
| Set Builder 곡 검색 | ❌ 무관 | SELECT RLS 변경 없음 |
| Dashboard 곡 카운트 | ❌ 무관 | SELECT RLS 변경 없음 |
| AI 세트 생성 (edge fn) | ❌ 무관 | service role 사용 |
| 곡 추가/수정/삭제 | ❌ 무관 | INSERT/UPDATE/DELETE 정책 변경 없음 |
| Audit History 곡 제목 | ❌ 무관 | SELECT RLS 변경 없음 |
| 악보/YouTube 조회 | ❌ 무관 | 해당 테이블 RLS 변경 없음 |

**핵심: songs 테이블 RLS 정책은 일절 건드리지 않음.** Export 로직만 클라이언트→서버로 이동.

### 수정 파일 (3개만)
- `supabase/functions/export-songs/index.ts` — 신규 생성
- `src/pages/SongLibrary.tsx` — export 함수만 수정
- `supabase/config.toml` — 함수 등록




## match-lyrics 수정: Claude AI → scrape-lyrics 호출로 교체

### 원인
Claude는 저작권 정책상 가사 전체 반환을 거부합니다. 이미 프로젝트에 `scrape-lyrics` Edge Function이 있고, `enrich-song`에서 동일한 패턴으로 호출 중입니다.

### 변경 내용

**파일: `supabase/functions/match-lyrics/index.ts`**

Claude API 호출을 제거하고, `enrich-song/index.ts`의 `scrapeLyrics()` 패턴을 그대로 차용하여 내부적으로 `scrape-lyrics` 함수를 호출합니다.

```
match-lyrics (클라이언트 호출)
  ├─ 인증 확인 (기존 유지)
  ├─ scrape-lyrics 내부 호출 (SUPABASE_SERVICE_ROLE_KEY 사용)
  │   ├─ title, artist 전달
  │   └─ original_composer가 있으면 artist 파라미터에 함께 전달
  └─ 결과를 { found, lyrics, source } 형태로 변환
```

주요 변경:
- `ANTHROPIC_API_KEY`, `AI_CONFIG` 의존성 완전 제거
- `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`로 `scrape-lyrics` 호출 (enrich-song과 동일 패턴)
- `original_composer`가 있으면 검색 정확도를 위해 artist 필드에 보조 정보로 포함
- 응답 매핑: `{ lyrics, source }` → `{ found: !!lyrics, lyrics, source }`

### 수정 파일: 1개

`supabase/functions/match-lyrics/index.ts`

클라이언트 코드(SmartSongFlow.tsx) 변경 없음 — 응답 포맷 동일.


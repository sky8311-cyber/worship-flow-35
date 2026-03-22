

## 악보 썸네일/버튼 복구 — songs 쿼리에 song_scores 조인 누락

### 원인
`SongLibrary.tsx` line 188의 songs 쿼리가 `score_file_url`도 `song_scores`도 가져오지 않음. 따라서 `song.score_file_url`이 항상 `undefined` → 썸네일과 "악보 보기" 버튼이 조건부 렌더링에서 숨겨짐.

### 해결

#### 1. songs 쿼리에 song_scores 조인 추가
**파일:** `src/pages/SongLibrary.tsx` (line 187-189)

```tsx
// Before
supabase.from("songs").select(
  "id, title, subtitle, artist, default_key, language, tags, is_private, status, created_by, created_at, youtube_url, lyrics, notes"
);

// After
supabase.from("songs").select(
  "id, title, subtitle, artist, default_key, language, tags, is_private, status, created_by, created_at, youtube_url, lyrics, notes, song_scores(id, key, file_url, page_number)"
);
```

#### 2. SongCard에 첫 번째 score URL 전달
**파일:** `src/pages/SongLibrary.tsx`

SongCard에 song 데이터를 전달할 때, `song_scores`에서 첫 번째 `file_url`을 `score_file_url`로 매핑:

```tsx
const songWithScore = {
  ...song,
  score_file_url: song.song_scores?.[0]?.file_url || null
};
```

또는 SongCard 자체에서 `song.song_scores`를 직접 참조하도록 수정.

#### 3. SongCard 썸네일 로직 업데이트 (선택적)
**파일:** `src/components/SongCard.tsx`

현재 `song.score_file_url`을 체크하는 부분을 유지하되, 데이터가 올바르게 전달되면 기존 코드가 그대로 동작함. 추가로 `song.song_scores`가 있으면 그것도 fallback으로 사용:

```tsx
const scoreUrl = song.score_file_url || song.song_scores?.[0]?.file_url;
```

### 수정 파일
1. `src/pages/SongLibrary.tsx` — songs 쿼리에 `song_scores` 조인 추가, SongCard에 score_file_url 매핑
2. `src/components/SongCard.tsx` — scoreUrl fallback 추가 (song_scores 지원)


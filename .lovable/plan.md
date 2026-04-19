
## DB 마이그레이션 2가지

### [1] `songs.notes` 컬럼 완전 삭제
```sql
ALTER TABLE public.songs DROP COLUMN IF EXISTS notes;
```
⚠️ 해당 컬럼의 모든 데이터가 영구 삭제됩니다.

### [2] `user_song_settings_history` 테이블 신규 생성
- 컬럼: `id`, `user_id`, `song_id`, `bpm`, `time_signature`, `energy_level`, `notes`, `created_at`
- FK: `user_id → auth.users` (CASCADE), `song_id → songs` (CASCADE)
- RLS 활성화 + 정책 "own history" (본인 데이터만 ALL)
- 인덱스: `(user_id, song_id, created_at DESC)`

### ⚠️ 코드 영향
`songs.notes`를 참조하는 코드가 있다면 마이그레이션 후 빌드 에러 발생. 마이그레이션 승인 후 코드 조사하여 별도 수정 필요할 수 있음 (이번 턴은 마이그레이션만).

승인하시면 마이그레이션 실행합니다.

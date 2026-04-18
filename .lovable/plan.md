
## 3-Layer Content Architecture — DB 마이그레이션 플랜

### 목표
사용자가 지정한 3-레이어 구조를 위한 신규 테이블/컬럼 추가. **기존 데이터는 100% 보존**.

---

### 1. 테이블 신규 생성

#### `public.user_score_vault` (Layer 2 — 개인 악보 보관함)
- `id` uuid PK (default gen_random_uuid())
- `user_id` uuid NOT NULL → `auth.users(id)` ON DELETE CASCADE
- `song_id` uuid → `public.songs(id)` ON DELETE SET NULL
- `score_url` text NOT NULL
- `thumbnail_url` text
- `musical_key` text DEFAULT 'C'
- `label` text
- `pages_count` int DEFAULT 1
- `created_at` timestamptz DEFAULT now()
- 인덱스: `(user_id)`, `(user_id, song_id)`
- RLS ENABLE
- 정책: `"own vault"` FOR ALL USING `auth.uid() = user_id` WITH CHECK `auth.uid() = user_id`

#### `public.user_song_profiles` (Layer 2 — 개인 곡 프로필)
- `id` uuid PK (default gen_random_uuid())
- `user_id` uuid NOT NULL → `auth.users(id)` ON DELETE CASCADE
- `song_id` uuid NOT NULL → `public.songs(id)` ON DELETE CASCADE
- `preferred_key` text
- `notes` text
- `vault_score_ids` uuid[] DEFAULT '{}'
- `created_at` timestamptz DEFAULT now()
- UNIQUE `(user_id, song_id)`
- 인덱스: `(user_id, song_id)`
- RLS ENABLE
- 정책: `"own profiles"` FOR ALL USING `auth.uid() = user_id` WITH CHECK `auth.uid() = user_id`

---

### 2. 기존 테이블 컬럼 추가

#### `public.service_sets` (실제 워십세트 테이블 — 사용자 요청의 `worship_sets`는 코드베이스 기준 `service_sets`)
> ⚠️ 사용자가 `worship_sets`로 적었지만 실제 테이블명은 `service_sets`입니다 (mem://database/naming-and-schema-constraints-v2 참조). 의도하신 게 그게 맞다고 보고 `service_sets`에 적용합니다. 다른 의도였다면 알려주세요.

- `has_private_scores` boolean DEFAULT false
- `band_view_visibility` text DEFAULT 'public' CHECK in ('public','team','link')
- `share_token` uuid DEFAULT gen_random_uuid()
  - **백필**: 기존 NULL 행에 `gen_random_uuid()` 채우기
  - UNIQUE INDEX `idx_service_sets_share_token`

> 참고: 기존에 `public_share_token` 컬럼이 이미 있음 (별도 용도, 외부 공개 링크). 신규 `share_token`은 별도 컬럼으로 추가 (band_view_visibility='link' 모드용).

#### `public.set_song_scores`
- `vault_score_id` uuid → `public.user_score_vault(id)` ON DELETE SET NULL

---

### 3. 데이터 보존
- 모든 ALTER는 `IF NOT EXISTS`
- 기존 행 어떤 것도 삭제/수정 안 함 (share_token 백필만 발생, 기존 값 있으면 유지)
- 레거시 `song_scores` / `songs.score_file_url` 그대로 보존

---

### 4. 코드 영향
- 마이그레이션만 실행. 애플리케이션 코드는 이번 턴에서 **변경하지 않음**.
- 마이그레이션 승인 → `src/integrations/supabase/types.ts` 자동 재생성됨.
- 다음 턴에서 사용자가 UI/로직 연결 요청 시 그때 코드 작성.

---

### 5. 보안
- 두 신규 테이블 RLS 활성화 + 본인 데이터만 접근 가능 정책.
- `service_sets`의 신규 컬럼은 기존 RLS 정책에 그대로 포함됨 (별도 정책 불필요).

승인하시면 마이그레이션 파일을 생성합니다.

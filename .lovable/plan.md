

# Favorite 카운트 모든 유저에게 공개하기

## 문제 분석

### 현재 RLS 정책
```sql
-- user_favorite_songs SELECT 정책
USING (auth.uid() = user_id)  -- 자기 자신의 favorites만 조회 가능 ❌
```

### 현재 프론트엔드 쿼리
```typescript
// SongLibrary.tsx (line 135-150)
const { data: favoriteCounts } = useQuery({
  queryKey: ["song-favorite-counts"],
  queryFn: async () => {
    const { data } = await supabase
      .from("user_favorite_songs")
      .select("song_id");  // RLS 때문에 자신의 데이터만 반환됨
    // ...
  },
});
```

### 문제 흐름
```text
┌─────────────────────────────────────────────────────────────────┐
│  유저 A 로그인                                                   │
│                          ↓                                      │
│  user_favorite_songs 조회 요청                                   │
│                          ↓                                      │
│  RLS: auth.uid() = user_id (유저 A의 데이터만 반환)               │
│                          ↓                                      │
│  총 30개 favorites 중 유저 A의 2개만 반환                         │
│                          ↓                                      │
│  favoriteCount 배지: 다른 유저들의 favorites 카운트 누락 ❌        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 해결 방법

### 1. RLS 정책 수정

**새로운 SELECT 정책**: 모든 인증된 사용자가 `song_id`를 기준으로 favorites 카운트를 집계할 수 있도록 허용

```sql
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Users can view own favorites" ON user_favorite_songs;

-- 새로운 SELECT 정책: 모든 인증된 사용자가 조회 가능 (카운트용)
CREATE POLICY "Authenticated users can view favorites for counting"
ON user_favorite_songs FOR SELECT
TO authenticated
USING (true);  -- 모든 favorites 조회 허용 (사용자 식별 정보 없이 song_id만 사용)
```

**보안 고려사항**:
- `user_favorite_songs` 테이블에는 `user_id`, `song_id`, `created_at`만 저장됨
- 민감한 개인정보(PII)가 없으므로 SELECT 허용이 안전함
- 다른 유저가 어떤 곡을 좋아하는지 보는 것은 K-Worship의 소셜 기능에 적합함
- INSERT/DELETE 정책은 기존대로 유지 (`auth.uid() = user_id`)

### 2. 프론트엔드 변경 (필요 없음)

현재 쿼리 로직은 이미 올바름:
```typescript
// SongLibrary.tsx - 이미 정확한 구현
const { data } = await supabase
  .from("user_favorite_songs")
  .select("song_id");  // RLS가 수정되면 모든 favorites 반환됨

// 클라이언트에서 song_id별 카운트 집계
const counts = new Map<string, number>();
data?.forEach(({ song_id }) => {
  counts.set(song_id, (counts.get(song_id) || 0) + 1);
});
```

---

## SQL 마이그레이션

```sql
-- 1. 기존 SELECT 정책 삭제
DROP POLICY IF EXISTS "Users can view own favorites" ON user_favorite_songs;

-- 2. 새로운 SELECT 정책: 모든 인증된 사용자가 조회 가능
-- (Favorite 카운트를 모든 유저에게 공개하기 위함)
CREATE POLICY "Authenticated users can view favorites for counting"
ON user_favorite_songs FOR SELECT
TO authenticated
USING (true);
```

---

## 예상 결과

| 항목 | 현재 | 수정 후 |
|------|------|--------|
| favoriteCount 쿼리 결과 | 자신의 favorites만 (2-3개) | 모든 favorites (30개) |
| 하트 버튼 배지 숫자 | 0 또는 낮은 숫자 | ✅ 정확한 총 카운트 |
| 다른 유저의 favorites 보기 | ❌ 불가능 | ✅ 가능 (카운트용) |
| INSERT/DELETE 권한 | 자신만 가능 | 자신만 가능 (유지) |

---

## 수정 파일 목록

| 변경 | 설명 |
|------|------|
| DB 마이그레이션 | `user_favorite_songs` SELECT RLS 정책 업데이트 |
| 프론트엔드 변경 | 없음 (이미 정확한 구현) |

---

## 보안 체크리스트

- ✅ `user_favorite_songs`에 PII 없음 (user_id, song_id, created_at만 저장)
- ✅ INSERT/DELETE는 여전히 `auth.uid() = user_id`로 보호됨
- ✅ 다른 유저의 favorites를 삭제하거나 추가할 수 없음
- ✅ 소셜 기능으로서 favorites 공개는 K-Worship 설계 의도에 맞음


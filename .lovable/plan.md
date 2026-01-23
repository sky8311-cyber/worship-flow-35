

# 리더보드 데이터 최적화 계획

## 현재 문제점

현재 `getLeaderboardData` 함수의 흐름:

```text
┌─────────────────────────────────────────────────────────────────┐
│  1. seed_transactions 전체 조회 (수천 개 가능)                    │
│                          ↓                                      │
│  2. JavaScript에서 사용자별 합계 계산 (60+ 사용자)                │
│                          ↓                                      │
│  3. 60+ 사용자의 profiles 조회                                   │
│                          ↓                                      │
│  4. 60+ 사용자의 user_seeds 조회                                 │
│                          ↓                                      │
│  5. 정렬 후 상위 5명만 표시                                      │
└─────────────────────────────────────────────────────────────────┘
```

**문제**: 상위 5명만 보여주는데 60+ 프로필과 시드 데이터를 불필요하게 로드

---

## 해결 방법: 데이터베이스에서 집계 후 상위 N명만 조회

### 방법 1: RPC 함수 생성 (권장)

데이터베이스에서 집계와 정렬을 처리하여 상위 5명만 반환:

**새로운 SQL 함수:**
```sql
CREATE OR REPLACE FUNCTION get_seed_leaderboard(
  time_range TEXT DEFAULT 'allTime',
  result_limit INT DEFAULT 5
)
RETURNS TABLE (
  user_id UUID,
  total_seeds BIGINT,
  full_name TEXT,
  avatar_url TEXT,
  current_level INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    st.user_id,
    SUM(st.seeds_earned)::BIGINT as total_seeds,
    p.full_name,
    p.avatar_url,
    COALESCE(us.current_level, 1) as current_level
  FROM seed_transactions st
  LEFT JOIN profiles p ON p.id = st.user_id
  LEFT JOIN user_seeds us ON us.user_id = st.user_id
  WHERE 
    st.user_id != '3d927691-b9a8-4fe0-a1ba-7919ed00a0ec'  -- Exclude admin
    AND (
      time_range = 'allTime' 
      OR st.created_at >= NOW() - INTERVAL '1 month'
    )
  GROUP BY st.user_id, p.full_name, p.avatar_url, us.current_level
  ORDER BY total_seeds DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**프론트엔드 호출:**
```typescript
const { data } = await supabase.rpc('get_seed_leaderboard', {
  time_range: timeRange,
  result_limit: 5
});
```

### 방법 2: 프론트엔드 로직 개선 (RPC 없이)

RPC 함수 없이 현재 구조에서 최적화:

1. **seed_transactions에서 user_id만 집계** (전체 데이터 대신)
2. **상위 10명 user_id만 추출** (admin 제외 여유분 포함)
3. **해당 user_id들의 profiles/user_seeds만 조회**

```typescript
const getLeaderboardData = async (timeRange: 'monthly' | 'allTime') => {
  let dateFilter = '';
  if (timeRange === 'monthly') {
    const monthAgo = new Date();
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    dateFilter = monthAgo.toISOString();
  }

  // 1. 트랜잭션에서 user_id, seeds_earned만 조회 (최소 데이터)
  let query = supabase
    .from('seed_transactions')
    .select('user_id, seeds_earned');

  if (dateFilter) {
    query = query.gte('created_at', dateFilter);
  }

  const { data: transactions } = await query;
  if (!transactions) return [];

  // 2. JavaScript에서 집계 후 상위 10명만 추출 (admin 제외 버퍼)
  const userTotals = transactions.reduce((acc, tx) => {
    if (!EXCLUDED_USER_IDS.includes(tx.user_id)) {
      acc[tx.user_id] = (acc[tx.user_id] || 0) + tx.seeds_earned;
    }
    return acc;
  }, {} as Record<string, number>);

  // 상위 10명 user_id만
  const topUserIds = Object.entries(userTotals)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10)
    .map(([id]) => id);

  if (topUserIds.length === 0) return [];

  // 3. 상위 10명의 프로필과 시드 레벨만 조회 (60+ → 10개로 감소)
  const [{ data: profiles }, { data: userSeeds }] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', topUserIds),
    supabase
      .from('user_seeds')
      .select('user_id, current_level')
      .in('user_id', topUserIds)
  ]);

  // 4. 최종 상위 5명 반환
  return topUserIds.slice(0, 5).map((userId) => {
    const profile = profiles?.find((p) => p.id === userId);
    const seedData = userSeeds?.find((s) => s.user_id === userId);
    return {
      userId,
      name: profile?.full_name || 'Unknown',
      avatarUrl: profile?.avatar_url,
      seeds: userTotals[userId],
      level: seedData?.current_level || 1
    };
  });
};
```

---

## 예상 효과

| 항목 | 현재 | 최적화 후 |
|------|------|----------|
| profiles 쿼리 | 60+ rows | 10 rows |
| user_seeds 쿼리 | 60+ rows | 10 rows |
| 데이터 전송량 | ~15KB | ~3KB |
| 프로필 조회 비용 | 60회 | 10회 |

---

## 권장 접근 방식

**방법 2 (프론트엔드 최적화)** 를 권장합니다:
- 데이터베이스 마이그레이션 없이 즉시 적용 가능
- 프로필 조회를 60+ → 10개로 80% 이상 감소
- seed_transactions 전체 조회는 여전히 필요하지만, 이는 가벼운 쿼리 (user_id, seeds_earned만)

나중에 사용자가 더 많아지면 방법 1 (RPC 함수)로 전환하여 완전한 서버사이드 집계 적용 가능

---

## 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/components/seeds/SeedLeaderboard.tsx` | `getLeaderboardData` 함수 최적화 - 상위 10명만 프로필 조회 |


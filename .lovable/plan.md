
# 곡 사용 횟수 기능을 모든 유저에게 공개하기

## 문제 요약

현재 곡 사용 횟수 버튼과 배지가 **관리자와 워십리더에게만** 보이도록 설정되어 있습니다. 하지만 이 기능은 K-Worship의 핵심 기능으로, **모든 유저**가 다른 워십리더의 published 예배세트를 참조할 수 있는 유일한 경로입니다.

---

## 수정 사항

### 1. Usage 버튼 가시성 제한 제거

**SongCard.tsx** (line 81-82):
```typescript
// Before:
const canViewUsageHistory = isAdmin || isWorshipLeader;

// After: 모든 인증된 사용자가 볼 수 있도록 변경
const canViewUsageHistory = true;
```

**SongTable.tsx** (line 90-91):
```typescript
// Before:
const canViewUsageHistory = isAdmin || isWorshipLeader;

// After:
const canViewUsageHistory = true;
```

---

### 2. Usage Count에서 Draft 제외

**SongLibrary.tsx** (line 152-168):

현재 `set_songs` 테이블 전체를 조회해서 카운트하는데, 이는 draft 상태 세트도 포함합니다. Published 세트만 카운트하도록 변경합니다.

```typescript
// Before:
const { data: usageCounts } = useQuery({
  queryKey: ["song-usage-counts"],
  queryFn: async () => {
    const { data } = await supabase
      .from("set_songs")
      .select("song_id");
    // ...
  },
});

// After: service_sets와 조인하여 published만 카운트
const { data: usageCounts } = useQuery({
  queryKey: ["song-usage-counts-published"],
  queryFn: async () => {
    const { data } = await supabase
      .from("set_songs")
      .select(`
        song_id,
        service_sets!inner(status)
      `)
      .eq("service_sets.status", "published");

    const counts = new Map<string, number>();
    data?.forEach(({ song_id }) => {
      counts.set(song_id, (counts.get(song_id) || 0) + 1);
    });
    return counts;
  },
  staleTime: 60 * 1000,
});
```

---

### 3. useSongUsage 훅 필터링 강화 (일반 유저용)

현재 훅은 `isSameCommunity || set.status === 'published'`로 필터링합니다. 일반 유저(비-워십리더)의 경우 **같은 커뮤니티의 draft도 숨겨야** 합니다.

**useSongUsage.ts** (line 102-103):
```typescript
// Before:
if (isSameCommunity || set.status === 'published') {

// After: 일반 유저는 published만, 리더십은 같은 커뮤니티 draft도 볼 수 있음
const isLeadershipRole = isAdmin || isWorshipLeader || leaderCommunityIds.has(set.community_id);
const canSeeThisSet = set.status === 'published' 
  || (isSameCommunity && (isCreator || collaboratorSetIds.has(set.id) || isLeadershipRole));

if (canSeeThisSet) {
```

실제로 현재 로직도 괜찮을 수 있습니다 - 다만 일반 팀 멤버가 같은 커뮤니티의 draft를 볼 수 있게 되어 있는데, 이것이 의도된 것인지 확인이 필요합니다.

**사용자 의도 재확인**: Draft 예배세트는 **절대** 아무도 볼 수 없어야 한다고 하셨으므로:

```typescript
// 더 엄격한 버전: 일반 유저는 published만 볼 수 있음
const canSeeThisSet = set.status === 'published';
```

단, 세트 생성자/협업자/커뮤니티 리더는 자기 커뮤니티 draft를 볼 수 있어야 의미가 있으므로:

```typescript
const canSeeDraft = isAdmin || isCreator || collaboratorSetIds.has(set.id) 
  || (isSameCommunity && leaderCommunityIds.has(set.community_id));
const canSeeThisSet = set.status === 'published' || canSeeDraft;
```

---

## 수정 파일 목록

| 파일 | 변경 내용 |
|------|----------|
| `src/components/SongCard.tsx` | `canViewUsageHistory = true` (line 82) |
| `src/components/SongTable.tsx` | `canViewUsageHistory = true` (line 91) |
| `src/pages/SongLibrary.tsx` | usageCounts 쿼리에서 published만 카운트 |
| `src/hooks/useSongUsage.ts` | (선택) 일반 유저 draft 접근 제한 강화 |

---

## 예상 결과

- **모든 유저**가 Song Library에서 곡 사용 횟수 배지를 볼 수 있음
- 배지 숫자는 **published 세트만** 카운트 (draft 제외)
- 클릭 시 Usage History 다이얼로그에서 **published 세트만** 표시
- 다른 워십 커뮤니티의 published 세트를 읽기 전용으로 열람 가능
- Draft 세트는 생성자/협업자/리더십 외에는 완전히 숨김

---

## 보안 참고

- RLS 정책은 이미 올바르게 설정되어 있음 (published만 커뮤니티 멤버에게 공개)
- Frontend 필터링은 RLS의 추가 방어선 역할
- 일반 유저가 draft에 접근 시도해도 RLS에서 차단됨

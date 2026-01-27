
# 커뮤니티 오너 이름 검색 기능 추가

## 현재 상황

### 검색 로직 (Line 29-31)
```typescript
query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
```
- ✅ 커뮤니티 이름 검색
- ✅ 커뮤니티 설명 검색
- ❌ 오너(리더) 이름 검색 불가

### 데이터 구조
```
worship_communities (leader_id) → profiles (id, full_name)
```

---

## 해결 방법: 클라이언트 사이드 필터링

Supabase의 `.or()` 필터는 같은 테이블만 지원하므로, 다음 전략을 사용합니다:

1. **검색어가 있을 때**: 모든 활성 커뮤니티와 프로필을 가져온 후 클라이언트에서 필터링
2. **검색 대상**: 커뮤니티 이름 + 설명 + 오너 이름

---

## 변경 내용

### 파일: `src/pages/CommunitySearch.tsx`

#### 수정할 쿼리 로직 (Line 21-66)

```typescript
const { data: communities, isLoading } = useQuery({
  queryKey: ["communities-search", searchQuery],
  queryFn: async () => {
    // 1. 모든 활성 커뮤니티 가져오기 (검색어 필터 없이)
    const { data: communities, error } = await supabase
      .from("worship_communities")
      .select("*")
      .eq("is_active", true);
      
    if (error) throw error;
    if (!communities || communities.length === 0) return [];
    
    // 2. 리더 프로필 가져오기
    const leaderIds = communities.map(c => c.leader_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, full_name")
      .in("id", leaderIds);
    
    // 3. 멤버 수 가져오기
    const communityIds = communities.map(c => c.id);
    const { data: memberCounts } = await supabase
      .from("community_members")
      .select("community_id")
      .in("community_id", communityIds);
    
    const counts = memberCounts?.reduce((acc, m) => {
      acc[m.community_id] = (acc[m.community_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // 4. 데이터 병합
    const enrichedCommunities = communities.map(c => ({
      ...c,
      profiles: profiles?.find(p => p.id === c.leader_id),
      member_count: counts?.[c.id] || 0
    }));
    
    // 5. 클라이언트 사이드 필터링 (이름, 설명, 오너 이름)
    if (!searchQuery) return enrichedCommunities;
    
    const lowerQuery = searchQuery.toLowerCase();
    return enrichedCommunities.filter(c => 
      c.name?.toLowerCase().includes(lowerQuery) ||
      c.description?.toLowerCase().includes(lowerQuery) ||
      c.profiles?.full_name?.toLowerCase().includes(lowerQuery)
    );
  },
});
```

---

## 변경 요약

| 파일 | 변경 내용 |
|------|----------|
| `src/pages/CommunitySearch.tsx` | 검색 로직을 클라이언트 사이드 필터링으로 변경하여 오너 이름 검색 지원 |

---

## 검색 예시

| 검색어 | 매칭 대상 |
|--------|----------|
| "샤우트" | 커뮤니티 이름 |
| "예배" | 커뮤니티 설명 |
| "임채현" | 오너 이름 ← **새로 추가** |

---

## 성능 고려사항

- **현재 방식**: 활성 커뮤니티 전체를 가져온 후 필터링
- **적합성**: 커뮤니티 수가 수백 개 이하면 문제 없음
- **대안**: 커뮤니티가 수천 개 이상이면 DB 함수(RPC) 사용 고려

---

## 예상 결과

- 커뮤니티 이름, 설명, **오너 이름** 모두 검색 가능
- 기존 UI 변경 없음
- 검색 결과에서 오너 이름이 매칭되면 해당 커뮤니티 표시

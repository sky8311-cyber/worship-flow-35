
# 히스토리 페이지 접근 제한 - 내 세트와 내 커뮤니티만 표시

## 문제 분석

현재 `WorshipSets.tsx` (히스토리 페이지)가 모든 `service_sets`를 가져온 후 JavaScript에서 필터링하고 있습니다. RLS 정책이 `status = 'published'`인 세트를 모든 인증된 유저에게 허용하기 때문에, 다른 유저의 게시된 세트도 히스토리에 표시됩니다.

```text
현재 동작:
┌─────────────────────────────────────────┐
│  히스토리 페이지                        │
│  - 내 세트 ✅                           │
│  - 내 커뮤니티 세트 ✅                  │
│  - 다른 커뮤니티 게시된 세트 ❌ ← 문제!  │
└─────────────────────────────────────────┘

원하는 동작:
┌─────────────────────────────────────────┐
│  히스토리 페이지                        │
│  - 내 세트 ✅                           │
│  - 내 커뮤니티 세트 ✅                  │
└─────────────────────────────────────────┘
         +
┌─────────────────────────────────────────┐
│  Song Library → 사용 내역 아이콘        │
│  - 다른 커뮤니티 게시된 세트 ✅         │
│  → BandView (읽기 전용 참조 모드)       │
└─────────────────────────────────────────┘
```

---

## 수정 파일

### 1. src/pages/WorshipSets.tsx

**변경 내용:**
- `useUserCommunities` 훅 import 추가
- 쿼리에서 커뮤니티 필터 적용
- 내 세트 OR 내 커뮤니티 세트 OR 협력자로 추가된 세트만 가져오기

**수정 전:**
```typescript
const { data: allSets, isLoading } = useQuery({
  queryKey: ["worship-sets-history"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("service_sets")
      .select(`*, set_songs(position, songs(title))`)
      .order("date", { ascending: false });
    // 모든 세트를 가져옴 → 다른 커뮤니티 세트도 포함
    if (error) throw error;
    return data;
  },
});
```

**수정 후:**
```typescript
import { useUserCommunities } from "@/hooks/useUserCommunities";

// 유저 커뮤니티 ID 목록
const { data: userCommunitiesData } = useUserCommunities();
const userCommunityIds = userCommunitiesData?.communityIds || [];

// 협력자로 추가된 세트 ID
const { data: collaboratorSetIds = new Set<string>() } = useQuery({
  queryKey: ["user-collaborator-sets", user?.id],
  ...
});

const { data: allSets, isLoading } = useQuery({
  queryKey: ["worship-sets-history", user?.id, userCommunityIds, collaboratorSetIds.size],
  queryFn: async () => {
    if (!user) return [];
    
    // 1. 내가 만든 세트 (커뮤니티 무관)
    const { data: mySets, error: myError } = await supabase
      .from("service_sets")
      .select(`*, set_songs(position, songs(title))`)
      .eq("created_by", user.id)
      .order("date", { ascending: false });
    
    if (myError) throw myError;
    
    // 2. 내 커뮤니티 세트 (내가 만든 것 제외, 중복 방지)
    let communitySets: any[] = [];
    if (userCommunityIds.length > 0) {
      const { data, error } = await supabase
        .from("service_sets")
        .select(`*, set_songs(position, songs(title))`)
        .in("community_id", userCommunityIds)
        .neq("created_by", user.id)
        .order("date", { ascending: false });
      
      if (error) throw error;
      communitySets = data || [];
    }
    
    // 3. 협력자로 추가된 세트 (위에서 이미 포함되지 않은 것만)
    let collaboratorSets: any[] = [];
    if (collaboratorSetIds.size > 0) {
      const collabIds = Array.from(collaboratorSetIds);
      const existingIds = new Set([
        ...(mySets?.map(s => s.id) || []),
        ...communitySets.map(s => s.id)
      ]);
      const remainingCollabIds = collabIds.filter(id => !existingIds.has(id));
      
      if (remainingCollabIds.length > 0) {
        const { data, error } = await supabase
          .from("service_sets")
          .select(`*, set_songs(position, songs(title))`)
          .in("id", remainingCollabIds)
          .order("date", { ascending: false });
        
        if (error) throw error;
        collaboratorSets = data || [];
      }
    }
    
    // 병합 및 날짜순 정렬
    const allData = [...(mySets || []), ...communitySets, ...collaboratorSets];
    return allData.sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    ) as SetWithSongs[];
  },
  enabled: !!user?.id,
  staleTime: 0,
  refetchOnWindowFocus: true,
});
```

---

## 접근 경로 정리

### 허용되는 접근 경로

| 경로 | 접근 가능한 세트 | 모드 |
|------|------------------|------|
| `/worship-sets` (히스토리) | 내 세트 + 내 커뮤니티 세트 + 협력자 세트 | 전체 관리 |
| Song Library → 사용 내역 → 클릭 | 모든 게시된 세트 | 읽기 전용 (BandView) |

### RLS 정책 유지

RLS 정책은 변경하지 않습니다:
- `service_sets` SELECT: `status = 'published'` OR 커뮤니티 멤버 OR 생성자 OR 협력자
- 이 정책은 Song Library 사용 내역에서 다른 커뮤니티 세트 발견을 위해 필요

프론트엔드에서 쿼리 필터를 통해 히스토리 페이지의 표시 범위만 제한합니다.

---

## 파일 변경 요약

| 파일 | 변경 내용 |
|------|----------|
| `src/pages/WorshipSets.tsx` | `useUserCommunities` 훅 사용, 쿼리 필터 추가 |

---

## 기술 세부사항

### 쿼리 의존성

```typescript
queryKey: [
  "worship-sets-history", 
  user?.id, 
  userCommunityIds,    // 커뮤니티 변경 시 refetch
  collaboratorSetIds.size  // 협력자 세트 변경 시 refetch
]
```

### 로딩 상태 처리

```typescript
const isReady = !!user?.id && userCommunitiesData !== undefined;

const { data: allSets, isLoading } = useQuery({
  ...
  enabled: isReady,
});
```

### Admin 예외 처리

```typescript
// Admin은 모든 세트 접근 가능 (기존 동작 유지)
if (isAdmin) {
  const { data, error } = await supabase
    .from("service_sets")
    .select(`*, set_songs(position, songs(title))`)
    .order("date", { ascending: false });
  if (error) throw error;
  return data as SetWithSongs[];
}
```

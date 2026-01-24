
# 환영 탭 제거 및 Welcome Posts 공지 통합

## 변경 개요

```text
현재 구조:
┌─────────────────────────────────────────┐
│  [환영 탭]  [내 예배공동체 탭]           │
├─────────────────────────────────────────┤
│  환영 탭 선택 시:                        │
│  - 환영 메시지 카드                      │
│  - WL 승인 CTA                          │
│  - Welcome Posts (관리자 공지)          │
└─────────────────────────────────────────┘

변경 후:
┌─────────────────────────────────────────┐
│  (탭 UI 완전 제거)                       │
├─────────────────────────────────────────┤
│  📢 Welcome Posts (공지사항)            │  ← 상단 공지 영역
│  - 고정된 공지 우선 표시                 │
│  - 접을 수 있는 UI                       │
├─────────────────────────────────────────┤
│  [공동체 탭들] (다중 공동체 시)          │
│  - 포스트 컴포저                        │
│  - 커뮤니티 피드                        │
└─────────────────────────────────────────┘
```

---

## 수정 파일 목록

### 1. DashboardFeedTabs.tsx - 대폭 간소화

**변경 내용:**
- `WelcomeFeed` import 및 관련 로직 전부 제거
- `showWelcomeTab`, `activeTab` 등 탭 관련 state 제거
- `userName` prop 제거
- 항상 `CommunityNewsfeed`만 렌더링

```tsx
// 변경 전: 복잡한 탭 구조
export function DashboardFeedTabs({ ... }) {
  const showWelcomeTab = ...;
  return (
    <Tabs>
      <TabsTrigger value="welcome" />
      <TabsTrigger value="community" />
      <TabsContent value="welcome"><WelcomeFeed /></TabsContent>
      <TabsContent value="community"><CommunityNewsfeed /></TabsContent>
    </Tabs>
  );
}

// 변경 후: 단순화
export function DashboardFeedTabs({ ... }) {
  return (
    <div className="h-full">
      <CommunityNewsfeed 
        userStats={userStats} 
        canPost={isWorshipLeader || isAdmin || isCommunityLeader} 
      />
    </div>
  );
}
```

---

### 2. CommunityNewsfeed.tsx - Welcome Posts 통합

**추가할 기능:**
- `welcome_posts` 테이블에서 공지 fetch
- 공지 영역을 피드 상단에 렌더링
- 관리자용 `WelcomePostComposer` 통합
- 접기/펼치기 UI (공지가 많을 때)

```tsx
// 새로운 구조
<div>
  {/* Welcome Posts 공지 영역 (최상단) */}
  <AnnouncementsSection 
    posts={welcomePosts} 
    isAdmin={isAdmin} 
  />
  
  {/* 기존 커뮤니티 탭/피드 */}
  {communities.length > 1 ? (
    <Tabs>...</Tabs>
  ) : (
    <FeedContent />
  )}
</div>
```

**공지 영역 UI:**
- 고정(pinned) 공지는 항상 표시
- 비고정 공지는 "더보기"로 접기/펼치기
- 관리자만 볼 수 있는 작성 버튼

---

### 3. 새 컴포넌트: AnnouncementsSection.tsx

공지사항을 표시하는 독립 컴포넌트:

```tsx
interface AnnouncementsSectionProps {
  posts: WelcomePost[];
  isLoading: boolean;
  isAdmin: boolean;
}

export function AnnouncementsSection({ posts, isLoading, isAdmin }) {
  const pinnedPosts = posts.filter(p => p.is_pinned);
  const regularPosts = posts.filter(p => !p.is_pinned);
  const [showAll, setShowAll] = useState(false);
  
  return (
    <div className="border-b bg-muted/30">
      {/* 관리자 작성 버튼 */}
      {isAdmin && <WelcomePostComposer />}
      
      {/* 고정 공지 */}
      {pinnedPosts.map(post => (
        <AnnouncementCard key={post.id} post={post} />
      ))}
      
      {/* 일반 공지 (접기/펼치기) */}
      {regularPosts.length > 0 && (
        <>
          {(showAll ? regularPosts : regularPosts.slice(0, 2)).map(...)}
          {regularPosts.length > 2 && (
            <Button onClick={() => setShowAll(!showAll)}>
              {showAll ? "접기" : `${regularPosts.length - 2}개 더보기`}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
```

---

### 4. 새 컴포넌트: AnnouncementCard.tsx

`WelcomePostCard`를 기반으로 공지 스타일로 수정:

```tsx
// 더 컴팩트한 공지 카드 디자인
<div className="flex items-start gap-3 p-3 bg-primary/5 rounded-lg">
  <Megaphone className="w-5 h-5 text-primary shrink-0" />
  <div className="flex-1 min-w-0">
    <div className="flex items-center gap-2">
      {post.is_pinned && <Pin className="w-3 h-3" />}
      <span className="font-medium text-sm">{post.title || "공지"}</span>
      <span className="text-xs text-muted-foreground">{timeAgo}</span>
    </div>
    <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
  </div>
  {isAdmin && <AdminActions />}
</div>
```

---

### 5. 파일 정리

**삭제할 파일:**
- `src/components/dashboard/WelcomeFeed.tsx` - 더 이상 사용 안 함

**수정할 import:**
- `DashboardFeedTabs.tsx`에서 `WelcomeFeed` import 제거

---

## Dashboard.tsx 변경

`DashboardFeedTabs`에서 `userName` prop 제거:

```tsx
// 변경 전
<DashboardFeedTabs
  userName={userName}
  hasCommunities={hasCommunities}
  ...
/>

// 변경 후
<DashboardFeedTabs
  hasCommunities={hasCommunities}
  ...
/>
```

---

## 최종 파일 변경 요약

| 파일 | 작업 |
|------|------|
| `DashboardFeedTabs.tsx` | 탭 로직 제거, 단순화 |
| `CommunityNewsfeed.tsx` | Welcome Posts fetch 및 상단 공지 렌더링 |
| `AnnouncementsSection.tsx` | **신규 생성** - 공지 영역 컴포넌트 |
| `AnnouncementCard.tsx` | **신규 생성** - 공지 카드 컴포넌트 |
| `WelcomeFeed.tsx` | **삭제** |
| `Dashboard.tsx` | userName prop 전달 제거 |

---

## 기술 세부사항

### Welcome Posts Query (CommunityNewsfeed에 추가)

```typescript
const { data: welcomePosts = [], isLoading: postsLoading } = useQuery({
  queryKey: ["welcome-posts"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("welcome_posts")
      .select(`
        *,
        author:profiles!welcome_posts_author_id_fkey(id, full_name, avatar_url)
      `)
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(10);
    if (error) throw error;
    return data;
  },
});
```

### 공지 영역 조건부 렌더링

```typescript
// 공지가 있거나 관리자일 때만 영역 표시
const showAnnouncements = isAdmin || welcomePosts.length > 0;

{showAnnouncements && (
  <AnnouncementsSection 
    posts={welcomePosts} 
    isLoading={postsLoading}
    isAdmin={isAdmin}
  />
)}
```

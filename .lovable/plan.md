

# K-Worship 종합 속도 감사 (Speed Audit)

## 현재 문제점 분석

### 1. 네트워크 요청 분석 (Network Analysis)

네트워크 로그 검토 결과, 단일 대시보드 로드 시 **15개 이상의 병렬 API 호출**이 발생:
- `seed_transactions` - 전체 트랜잭션 조회 (모든 사용자)
- `community_members` - 여러 번 중복 호출
- `profiles` - 최근 가입자 조회
- `community_posts` - 뉴스피드 조회
- `user_roles` - 역할 확인
- `post_likes` - 각 게시물별 좋아요 상태
- `welcome_posts` - 공지사항
- `legal_documents` - 법적 문서

---

## 발견된 성능 문제 (Critical Issues)

### Issue 1: N+1 쿼리 패턴 (Critical)

**위치: `src/components/dashboard/CommunityFeed.tsx:203-223`**

```typescript
// 문제: 생일 대상 각각에 대해 별도 DB 호출
const birthdayItems = await Promise.all(
  birthdaysThisWeek.map(async (profile) => {
    const memberCommunity = (await supabase
      .from("community_members")
      .select("community_id")
      .eq("user_id", profile.id)  // 각 유저별 개별 호출 ❌
      ...
```

**해결 방안:**
```typescript
// 배치 쿼리로 변환
const birthdayUserIds = birthdaysThisWeek.map(p => p.id);
const { data: memberCommunities } = await supabase
  .from("community_members")
  .select("user_id, community_id")
  .in("user_id", birthdayUserIds)  // 단일 호출 ✅
  .in("community_id", communityIds);

const communityByUser = new Map(memberCommunities?.map(m => [m.user_id, m.community_id]));
```

---

### Issue 2: 게시물별 개별 Like/Comment 쿼리 (Critical)

**위치: `src/components/dashboard/LikeButton.tsx:22-50`**

각 `SocialFeedPost` 컴포넌트가 렌더링될 때마다 **2개의 쿼리 발생**:
1. `post-like` - 현재 사용자의 좋아요 여부
2. `post-like-count` - 총 좋아요 수

**10개 게시물 = 20개 쿼리** ❌

**위치: `src/hooks/usePostCommentStatus.ts:16-67`**

각 게시물당 **3개의 쿼리 발생**:
1. 총 댓글 수
2. 마지막 읽은 시간
3. 읽지 않은 댓글 수

**10개 게시물 = 50개 쿼리 (Like + Comment)** ❌

**해결 방안:**
- 피드 조회 시 좋아요/댓글 수를 **서버 조인**으로 함께 가져오기
- 또는 배치 쿼리로 모든 게시물의 상태를 한 번에 조회

---

### Issue 3: 과도한 Refetch 설정 (High)

**위치: `src/pages/Dashboard.tsx:356-357`**
```typescript
staleTime: 0,
refetchOnWindowFocus: true,
```

**문제점:**
- 탭 전환할 때마다 전체 데이터 재조회
- 사용자가 느끼는 "느림" 현상의 주요 원인

**영향받는 쿼리:**
| 위치 | staleTime | 문제 |
|------|-----------|------|
| Dashboard upcoming-sets | 0 | 탭 전환 시 재조회 |
| useNotifications | 0 | 매번 새로고침 |
| MobileSidebarDrawer | 0 | 사이드바 열 때마다 재조회 |

**해결 방안:**
```typescript
staleTime: 30 * 1000, // 30초 캐시
refetchOnWindowFocus: false, // 또는 조건부
```

---

### Issue 4: Support Chat N+1 (Medium - Admin Only)

**위치: `src/hooks/useSupportChat.ts:245-262`**
```typescript
const conversationsWithLastMessage = await Promise.all(
  (data || []).map(async (conv) => {
    const { data: lastMsg } = await supabase
      .from("support_messages")
      .select("content, sender_type")
      .eq("conversation_id", conv.id)  // 각 대화별 개별 호출 ❌
```

**해결 방안:**
- 대화 ID 배치로 마지막 메시지 조회
- 또는 DB View/RPC 함수로 최적화

---

### Issue 5: SeedLeaderboard 전체 트랜잭션 조회 (Medium)

**위치: `src/components/seeds/SeedLeaderboard.tsx:84-92`**
```typescript
const { data: transactions } = await supabase
  .from('seed_transactions')
  .select('user_id, seeds_earned'); // 전체 트랜잭션 조회 (제한 없음)
```

**현재 상태:** 최적화 시도됨 (JS 집계 후 상위 10명만 프로필 조회)  
**개선 가능:** DB 집계 함수(RPC)로 변경하여 데이터 전송량 감소

---

### Issue 6: 불필요한 중복 쿼리 (Medium)

**`useUserCommunities` 중복 호출:**
- Dashboard에서 호출
- CommunityNewsfeed에서 호출
- UpcomingEventsWidget에서 호출

**현재 상태:** React Query 캐시로 일부 완화 (staleTime: 5분)  
**확인 필요:** 동일한 queryKey 사용 여부

---

## 우선순위별 최적화 계획

### Phase 1: 즉시 효과 (Quick Wins)

| 작업 | 예상 효과 | 난이도 |
|------|----------|--------|
| Dashboard `staleTime` 30초로 증가 | 탭 전환 속도 50%↑ | 낮음 |
| MobileSidebarDrawer `staleTime` 60초로 증가 | 모바일 UX 개선 | 낮음 |
| useNotifications `staleTime` 10초로 설정 | 불필요한 재조회 방지 | 낮음 |

### Phase 2: 배치 쿼리 최적화

| 작업 | 예상 효과 | 난이도 |
|------|----------|--------|
| CommunityFeed 생일 N+1 해결 | 쿼리 수 90%↓ | 중간 |
| LikeButton 배치 조회 | 게시물당 쿼리 80%↓ | 중간 |
| PostCommentStatus 배치 조회 | 게시물당 쿼리 60%↓ | 중간 |

### Phase 3: 아키텍처 개선

| 작업 | 예상 효과 | 난이도 |
|------|----------|--------|
| 피드 조회 시 좋아요/댓글 수 포함 조인 | 전체 쿼리 70%↓ | 높음 |
| SeedLeaderboard DB 집계 RPC | 데이터 전송량 80%↓ | 높음 |
| Support Chat 마지막 메시지 배치 조회 | Admin 페이지 속도↑ | 중간 |

---

## 수정 파일 목록

| 파일 | 변경 내용 |
|------|----------|
| `src/pages/Dashboard.tsx` | upcoming-sets 쿼리 staleTime 증가 |
| `src/hooks/useNotifications.ts` | staleTime 0 → 10초 |
| `src/components/layout/MobileSidebarDrawer.tsx` | staleTime 0 → 60초 |
| `src/components/dashboard/CommunityFeed.tsx` | 생일 N+1 쿼리 배치 최적화 |
| `src/components/dashboard/LikeButton.tsx` | 배치 조회 패턴 적용 (Phase 2) |
| `src/hooks/usePostCommentStatus.ts` | 배치 조회 패턴 적용 (Phase 2) |
| `src/hooks/useSupportChat.ts` | 마지막 메시지 배치 조회 (Phase 3) |

---

## 예상 성능 개선

| 시나리오 | Before | After |
|----------|--------|-------|
| 대시보드 초기 로드 | ~50개 쿼리 | ~20개 쿼리 |
| 탭 전환 시 | 전체 재조회 | 캐시 사용 |
| 10개 게시물 피드 | ~50개 추가 쿼리 | ~5개 배치 쿼리 |
| 체감 속도 | 느림 | 즉각 반응 |

---

## 기술 상세

### React Query 권장 설정
```typescript
// 글로벌 기본값 (현재)
staleTime: 10 * 1000,  // 10초 ✅
gcTime: 5 * 60 * 1000, // 5분 ✅

// 페이지별 권장 설정
// - 자주 변경되는 데이터: 10-30초
// - 드물게 변경되는 데이터: 5분
// - 협업 기능 필수 데이터: refetchOnWindowFocus: true 유지
```

### 배치 쿼리 패턴 (이미 구현된 예시)
```typescript
// src/hooks/useSongUsage.ts 참조
const setIds = data.map(item => item.id);
const { data: collaborators } = await supabase
  .from("set_collaborators")
  .select("service_set_id")
  .in("service_set_id", setIds);  // 배치 쿼리 ✅
```


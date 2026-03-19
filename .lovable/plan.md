

## 멤버십 정보 표시 전체 감사 (Audit) 및 수정

### 문제
`RoleBadge role="worship_leader"`은 항상 "기본 멤버"를 표시합니다. 하지만 worship_leader 역할을 가진 사용자가 정식멤버(premium) 구독이 있는 경우에도 "기본 멤버"로 표시됩니다. 플랫폼 **역할**(role)과 **티어**(tier)가 혼동되고 있습니다.

### 핵심 원칙
- `RoleBadge role="worship_leader"` → **더 이상 멤버십 티어 표시용으로 사용하지 않음**
- 대신 `TierBadge` 컴포넌트를 사용하여 실제 구독 상태 기반으로 표시
- `RoleBadge`는 community_owner, community_leader, admin, member(팀멤버)에만 사용

### 수정 대상 파일 (5개)

**1. `src/pages/CommunityManagement.tsx`** (스크린샷의 페이지)
- 멤버 쿼리에 `premium_subscriptions` 테이블 조인 추가 → 각 멤버의 실제 tier 확인
- `RoleBadge role="worship_leader"` → `TierBadge tier={memberTier}` 교체
- worship_leader이면서 premium 구독 있으면 "정식멤버", 없으면 "기본멤버", 아무것도 없으면 "팀멤버"

**2. `src/pages/Settings.tsx`**
- 현재: `{isWorshipLeader && <RoleBadge role="worship_leader" />}` (항상 "기본 멤버")
- 변경: `useTierFeature()`의 `tier` 값으로 `TierBadge` 표시

**3. `src/components/admin/AdminUserProfileDialog.tsx`**
- 사용자별 premium_subscriptions 조회 추가
- `RoleBadge role="worship_leader"` → 실제 tier 기반 `TierBadge` 교체

**4. `src/components/admin/UserCard.tsx`**
- 동일하게 `RoleBadge role="worship_leader"` → `TierBadge` 교체
- 부모 컴포넌트에서 tier 정보를 전달받거나 내부 조회

**5. `src/components/layout/AppHeader.tsx`**
- 이미 부분 수정됨 (tier !== "premium" 조건). 완전히 `TierBadge`로 통일
- worship_leader 역할이면 항상 `TierBadge tier={tier}` 표시 (tier가 worship_leader/premium/church 중 하나)

### 기술 상세

**CommunityManagement 멤버 쿼리 확장:**
```typescript
// 기존 globalRoles 외에 premium_subscriptions도 조회
const { data: subscriptions } = await supabase
  .from("premium_subscriptions")
  .select("user_id, subscription_status")
  .in("user_id", userIds)
  .eq("subscription_status", "active");

// 멤버에 tier 정보 추가
return members.map(m => {
  const isWL = userRoles?.some(r => r.user_id === m.user_id && r.role === 'worship_leader');
  const hasPremium = subscriptions?.some(s => s.user_id === m.user_id);
  const tier = hasPremium ? 'premium' : isWL ? 'worship_leader' : 'member';
  return { ...m, profiles: ..., globalRoles: ..., tier };
});
```

**뱃지 렌더링 변경 패턴:**
```tsx
// Before
{memberIsWorshipLeader && <RoleBadge role="worship_leader" />}
{!memberIsCommunityLeader && !memberIsOwner && <RoleBadge role="member" />}

// After
<TierBadge tier={member.tier} size="sm" />
```

**Settings 페이지:**
```tsx
// Before
{isWorshipLeader && <RoleBadge role="worship_leader" />}
// After  
<TierBadge tier={tier} size="sm" />
```

### 수정하지 않는 것
- `RoleBadge role="admin"` — 역할 뱃지로 정상 사용
- `RoleBadge role="community_owner"` / `community_leader` — 커뮤니티 역할로 정상 사용
- `RoleBadge role="member"` — 팀멤버 표시용으로 유지하되, worship_leader 역할이 있는 경우 TierBadge가 대체


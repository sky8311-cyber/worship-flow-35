
# 온보딩 체크리스트 플래시 현상 수정 및 조건 완화

## 발견된 문제

### 문제 1: 화면 플래시 현상 ("잠깐 보였다가 사라짐")

**원인**: React Query 데이터 로딩 중 `undefined` 상태에서 체크리스트가 렌더링됨

```
초기 상태: hasCommunity=undefined → 조건 false → 체크리스트 표시 ⚠️
로딩 완료: hasCommunity=true → 조건 true → 체크리스트 숨김 ✅
```

**결과**: 완료된 사용자에게도 0.5~1초간 체크리스트가 번쩍였다가 사라짐

### 문제 2: 조건이 너무 엄격함

현재: `role='owner'`인 커뮤니티만 체크
요청: 어떤 역할이든 커뮤니티에 속해있으면 완료 처리

---

## 수정 계획

### 1. 로딩 상태 체크 추가 (플래시 방지)

```typescript
// 데이터 로딩 중에는 아무것도 표시하지 않음
const { data: communityData, isLoading: communityLoading } = useQuery(...);
const { data: hasInvitedMembers, isLoading: invitedLoading } = useQuery(...);
const { data: hasSet, isLoading: setLoading } = useQuery(...);

const isDataLoading = communityLoading || invitedLoading || setLoading;

// 로딩 중이면 렌더링하지 않음 (플래시 방지)
if (!profile || !isWorshipLeader || dismissed || isDataLoading) {
  return null;
}

// 모든 단계 완료 시 숨김
if (hasCommunity && hasInvitedMembers && hasSet) {
  return null;
}
```

### 2. 조건 완화: 어떤 역할이든 커뮤니티 소속이면 완료

**Before:**
```typescript
.eq("role", "owner")  // 오너만 체크
```

**After:**
```typescript
// role 필터 제거 - 어떤 역할이든 커뮤니티 멤버면 OK
.eq("user_id", user.id)
.limit(1)
```

---

## 수정 대상 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/components/dashboard/WLOnboardingChecklist.tsx` | 로딩 상태 체크 추가 + role 필터 완화 |

---

## 상세 코드 변경

### 라인 35-49: 커뮤니티 쿼리 수정

```typescript
const { data: communityData, isLoading: communityLoading } = useQuery({
  queryKey: ["wl-onboarding-community", user?.id],
  queryFn: async () => {
    if (!user) return null;
    const { data, error } = await supabase
      .from("community_members")
      .select("community_id")
      .eq("user_id", user.id)
      // role 필터 제거 - 어떤 역할이든 OK
      .limit(1);
    if (error) throw error;
    return data?.[0] || null;
  },
  enabled: !!user && !!profile && isWorshipLeader,
  staleTime: 60 * 1000,
});
```

### 라인 56-69: 초대 멤버 쿼리에 isLoading 추가

```typescript
const { data: hasInvitedMembers, isLoading: invitedLoading } = useQuery({
  // ... 기존 로직 유지
});
```

### 라인 72-86: 세트 쿼리에 isLoading 추가

```typescript
const { data: hasSet, isLoading: setLoading } = useQuery({
  // ... 기존 로직 유지
});
```

### 라인 88-91: 조건문 수정 (플래시 방지)

```typescript
// 데이터 로딩 중이면 아무것도 표시하지 않음 (플래시 방지)
const isDataLoading = communityLoading || invitedLoading || setLoading;

if (!profile || !isWorshipLeader || dismissed || isDataLoading) {
  return null;
}

// 모든 단계 완료 시 숨김
if (hasCommunity && hasInvitedMembers && hasSet) {
  return null;
}
```

---

## 결과 비교

| 상황 | Before | After |
|------|--------|-------|
| sky 계정 (완료 상태) | 잠깐 번쩍 후 숨김 | 처음부터 안 보임 ✅ |
| 새 예배인도자 | 표시됨 | 표시됨 ✅ |
| 멤버로 가입한 WL | ❌ 체크리스트 표시 | ✅ 완료로 처리 |
| 데이터 로딩 중 | ⚠️ 플래시 발생 | 아무것도 안 보임 ✅ |

---

## 참고: 번역 문제

사용자가 언급한 "seed level: 가지" 번역 누락 문제는 이미 이전 수정에서 해결되었습니다:

```typescript
// SeedWidget.tsx - 이미 수정 완료
{language === "ko" 
  ? displayData.currentLevel.name_ko  // "가지"
  : displayData.currentLevel.name_en  // "Branch"
}
```

데이터베이스에도 "가지" 레벨이 정상적으로 존재합니다 (Level 4).

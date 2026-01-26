
# 공동체 나가기 후 사이드바 갱신 안됨 수정 계획

## 문제 분석

### 확인된 현상
- 관리자가 "카나다 광림교회" 공동체에서 **나가기** 클릭
- 대시보드로 이동되었으나 **좌측 사이드바에 여전히 해당 공동체 표시**
- 새로고침하면 정상적으로 제거됨

### 근본 원인: 쿼리 키 불일치

| 위치 | 사용하는 쿼리 키 | 무효화 여부 |
|------|-----------------|------------|
| `CommunityManagement.tsx` (나가기) | 무효화: `["joined-communities"]` | - |
| `useUserCommunities.ts` (핵심 데이터) | `["user-communities-unified", user?.id]` | **아니오** |
| `Dashboard.tsx` (사이드바) | `["joined-communities", user?.id, ...]` | 부분적 |
| `MobileSidebarDrawer.tsx` | `["joined-communities-sidebar", user?.id, ...]` | **아니오** |
| `Dashboard.tsx` (예정 세트) | `["upcoming-sets", ...]` | **아니오** |
| `MobileSidebarDrawer.tsx` | `["upcoming-sets-sidebar", ...]` | **아니오** |

**결과**: 나가기 성공 후 핵심 데이터 소스인 `["user-communities-unified"]`가 무효화되지 않아 사이드바 캐시가 갱신되지 않음

---

## 수정 계획

### 전략: 핵심 쿼리 + 파생 쿼리 모두 무효화

`leaveCommunityMutation`의 `onSuccess`에서 모든 관련 쿼리 무효화:

```typescript
onSuccess: () => {
  toast({ title: t("community.leaveSuccess") });
  navigate("/dashboard");
  
  // 기존 (유지)
  queryClient.invalidateQueries({ queryKey: ["joined-communities"] });
  
  // 추가: 핵심 데이터 소스
  queryClient.invalidateQueries({ queryKey: ["user-communities-unified"] });
  
  // 추가: 모바일 사이드바
  queryClient.invalidateQueries({ queryKey: ["joined-communities-sidebar"] });
  
  // 추가: 예정 세트 (communityIds에 의존)
  queryClient.invalidateQueries({ queryKey: ["upcoming-sets"] });
  queryClient.invalidateQueries({ queryKey: ["upcoming-sets-sidebar"] });
},
```

---

## 파일 변경 내용

### `src/pages/CommunityManagement.tsx` (Line 706-710)

**변경 전:**
```typescript
onSuccess: () => {
  toast({ title: t("community.leaveSuccess") });
  navigate("/dashboard");
  queryClient.invalidateQueries({ queryKey: ["joined-communities"] });
},
```

**변경 후:**
```typescript
onSuccess: () => {
  toast({ title: t("community.leaveSuccess") });
  navigate("/dashboard");
  
  // Invalidate all community-related queries
  queryClient.invalidateQueries({ queryKey: ["joined-communities"] });
  queryClient.invalidateQueries({ queryKey: ["user-communities-unified"] });
  queryClient.invalidateQueries({ queryKey: ["joined-communities-sidebar"] });
  queryClient.invalidateQueries({ queryKey: ["upcoming-sets"] });
  queryClient.invalidateQueries({ queryKey: ["upcoming-sets-sidebar"] });
},
```

---

## 파일 변경 요약

| 파일 | 라인 | 변경 내용 |
|------|------|----------|
| `CommunityManagement.tsx` | 709 | 5개 쿼리 키 무효화 추가 |

---

## 예상 결과

수정 후:
1. **나가기 클릭 시** → 대시보드로 이동
2. **좌측 사이드바** → 즉시 해당 공동체 제거
3. **모바일 사이드바** → 즉시 해당 공동체 제거
4. **예정 세트 위젯** → 해당 공동체의 세트도 자동 제거

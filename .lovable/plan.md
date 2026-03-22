

## 공동체 가입 로직 단순화

### 핵심 원칙
현재 멤버가 아니면 무조건 가입 신청 가능. 유일한 예외: 이미 `pending` 상태 요청이 있으면 알림만 표시.

### 변경 사항

**파일:** `src/pages/CommunitySearch.tsx`

#### 1. joinRequestMutation — 기존 요청 무조건 삭제 후 재삽입
```tsx
mutationFn: async (communityId: string) => {
  // 기존 요청이 있으면 상태 무관하게 삭제
  const currentStatus = userJoinRequests?.[communityId];
  if (currentStatus) {
    await supabase
      .from("community_join_requests")
      .delete()
      .eq("community_id", communityId)
      .eq("user_id", user?.id);
  }
  // 새 pending 요청 삽입
  const { error } = await supabase
    .from("community_join_requests")
    .insert({ community_id: communityId, user_id: user?.id, status: "pending" });
  if (error) throw error;
}
```

#### 2. UI 버튼 분기 단순화
- **멤버** → "이미 멤버" 버튼 (공동체로 이동)
- **pending 요청 있음** → "가입 취소" 버튼
- **그 외 (rejected, approved, 없음 등)** → "가입 신청" 버튼 (동일하게 처리)

기존의 `rejected` / `approved` 별도 분기 제거. 멤버가 아니고 pending이 아니면 전부 "가입 신청".

### 수정 파일
1. `src/pages/CommunitySearch.tsx` — mutation 로직 + UI 분기 단순화



# Edge Function 버그 수정 - 커뮤니티 소유권 이전 쿼리

## 문제 발견

계정 삭제 테스트 중 Edge Function 로그에서 다음 오류 발견:

```
Error fetching members for community e142a699-3d28-4d01-b47c-f87d6d32fead: {
  code: "PGRST200",
  message: "Could not find a relationship between 'community_members' and 'profiles'"
}
```

## 근본 원인

`community_members.user_id`는 `auth.users`를 참조하는 FK가 있지만, `profiles`를 참조하는 FK가 없음.

**현재 코드 (문제):**
```typescript
const { data: otherMembers } = await supabaseAdmin
  .from("community_members")
  .select("user_id, joined_at, profiles(full_name)")  // ❌ FK 관계 없음
  .eq("community_id", communityId)
```

## 해결 방법

2단계 쿼리로 분리:
1. `community_members`에서 멤버 정보 조회
2. 가장 오래된 멤버의 `profiles` 정보 별도 조회

## 수정 내용

**파일:** `supabase/functions/self-delete-user/index.ts`

```typescript
// 1. 다른 멤버 조회 (profiles 조인 제거)
const { data: otherMembers, error: membersError } = await supabaseAdmin
  .from("community_members")
  .select("user_id, joined_at")
  .eq("community_id", communityId)
  .neq("user_id", userId)
  .order("joined_at", { ascending: true })
  .limit(1);

if (otherMembers && otherMembers.length > 0) {
  const newOwnerId = otherMembers[0].user_id;
  
  // 2. 새 소유자 프로필 정보 별도 조회
  const { data: profileData } = await supabaseAdmin
    .from("profiles")
    .select("full_name")
    .eq("id", newOwnerId)
    .single();
  
  const newOwnerName = profileData?.full_name || "Unknown Member";
  // ... rest of logic
}
```

## 테스트 결과 요약

| 항목 | 결과 |
|------|------|
| 사용자 인증 삭제 | ✅ 성공 |
| 프로필 삭제 | ✅ 성공 |
| 개인 데이터 정리 | ✅ 성공 |
| 비공개 곡 삭제 | ✅ 성공 |
| 공개 곡 created_by → null | ✅ 성공 |
| 커뮤니티 소유권 이전 | ⚠️ 쿼리 오류 (수정 필요) |

## 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `supabase/functions/self-delete-user/index.ts` | profiles 조인을 2단계 쿼리로 분리 |

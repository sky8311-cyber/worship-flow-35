

# admin-delete-user Edge Function 보완

## 조사 결과 요약

| 항목 | 결과 |
|------|------|
| 임채현 사용자 | 존재 (852a5a6b-..., 샤우트 owner) |
| Orphaned Join Requests | **0건** (현재 DB에 문제 없음) |
| 이미지 속 "삭제된 사용자" | 이미 처리되었거나 캐싱 문제로 추정 |

## 문제 예방 조치

현재는 문제가 없지만, **향후 사용자 삭제 시 동일 문제 발생 방지**를 위해 Edge Function을 보완합니다.

### 변경 파일

**`supabase/functions/admin-delete-user/index.ts`**

`worship_leader_applications` 삭제 후 (line 177) 다음 코드 추가:

```typescript
// Delete from community_join_requests
const { error: joinRequestsError } = await supabaseAdmin
  .from("community_join_requests")
  .delete()
  .eq("user_id", userId);

if (joinRequestsError) {
  console.error("Error deleting community_join_requests:", joinRequestsError);
}
```

## 삽입 위치

```text
Line 169-177: worship_leader_applications 삭제 (기존)
Line 178-186: community_join_requests 삭제 (새로 추가) ← 여기
Line 187+: console.log("User data cleanup completed...")
```

## 예상 결과

- 사용자 삭제 시 해당 사용자의 모든 pending/rejected join requests도 함께 삭제
- "삭제된 사용자" 항목이 가입 신청 목록에 표시되는 문제 예방
- 기존 기능에 side effect 없음




## RLS 정책이 approved/rejected 삭제를 차단하는 문제 수정

### 원인
- `community_join_requests` 테이블의 DELETE RLS 정책: `user_id = auth.uid() AND status = 'pending'`
- status가 `approved`인 요청은 사용자가 직접 삭제 불가
- DELETE 요청은 204를 반환하지만 실제 삭제된 행은 0개 → INSERT 시 409 충돌

### 해결 방법
RLS 정책을 수정하여 사용자가 자신의 요청을 상태와 무관하게 삭제할 수 있도록 변경.

### 변경 사항

#### 1. DB 마이그레이션 — DELETE RLS 정책 변경
```sql
DROP POLICY "Users can delete their own pending requests" ON community_join_requests;

CREATE POLICY "Users can delete their own join requests"
ON community_join_requests FOR DELETE
USING (user_id = auth.uid());
```

`status = 'pending'` 조건 제거 → 사용자는 자신의 요청이면 어떤 상태든 삭제 가능.

### 수정 항목
1. DB 마이그레이션 1건 (RLS 정책 변경)

코드 변경은 불필요 — 현재 `CommunitySearch.tsx`의 로직은 이미 올바르게 delete → insert를 수행 중.




# 커뮤니티 가입 신청자 프로필 조회 불가 버그 수정

## 문제 분석

스크린샷에서 확인된 현상:
- 새로 가입 신청한 사용자가 "삭제된 사용자"로 표시됨
- 실제 데이터베이스에는 "John Park (johnbuspark@gmail.com)" 정보가 정상적으로 존재함

**원인:**
`profiles` 테이블의 RLS(Row Level Security) 정책 문제입니다.

현재 "Users can view profiles" 정책:
```sql
(auth.uid() = id) OR 
(EXISTS (
  SELECT 1 FROM community_members cm1
  JOIN community_members cm2 ON (cm1.community_id = cm2.community_id)
  WHERE (cm1.user_id = auth.uid()) AND (cm2.user_id = profiles.id)
))
```

이 정책은:
1. 자기 자신의 프로필 조회 가능
2. **같은 커뮤니티 멤버**의 프로필 조회 가능

**문제점:** 가입 신청자는 아직 `community_members` 테이블에 없으므로 커뮤니티 관리자가 신청자의 프로필을 조회할 수 없습니다!

---

## 해결 방안

RLS 정책에 "커뮤니티 관리자가 해당 커뮤니티에 가입 신청한 사용자의 프로필을 조회할 수 있음" 조건을 추가합니다.

### SQL 마이그레이션

```sql
-- Drop existing policy
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;

-- Create updated policy with join request visibility
CREATE POLICY "Users can view profiles" ON profiles FOR SELECT USING (
  -- 1. Can view own profile
  (auth.uid() = id) OR 
  
  -- 2. Can view profiles of users in same communities
  (EXISTS (
    SELECT 1 FROM community_members cm1
    JOIN community_members cm2 ON (cm1.community_id = cm2.community_id)
    WHERE (cm1.user_id = auth.uid()) AND (cm2.user_id = profiles.id)
  )) OR
  
  -- 3. NEW: Community managers can view profiles of users who requested to join their community
  (EXISTS (
    SELECT 1 FROM community_join_requests cjr
    JOIN community_members cm ON cjr.community_id = cm.community_id
    WHERE cjr.user_id = profiles.id
      AND cjr.status = 'pending'
      AND cm.user_id = auth.uid()
      AND cm.role IN ('community_leader', 'admin')
  ))
);
```

---

## 변경 효과

| 상황 | 현재 | 수정 후 |
|------|------|---------|
| 커뮤니티 멤버 프로필 조회 | ✓ 가능 | ✓ 가능 |
| 가입 신청자 프로필 조회 (관리자) | ✗ 불가 → "삭제된 사용자" | ✓ 가능 |
| 가입 신청자 프로필 조회 (일반 멤버) | ✗ 불가 | ✗ 불가 (보안 유지) |

---

## 예상 결과

```text
수정 전:
┌──────────────────────────────────┐
│ 가입 신청 목록                    │
├──────────────────────────────────┤
│ [?] 삭제된 사용자                 │  ← 프로필 조회 불가
│     신청일: 2026. 1. 30.         │
└──────────────────────────────────┘

수정 후:
┌──────────────────────────────────┐
│ 가입 신청 목록                    │
├──────────────────────────────────┤
│ [👤] John Park                   │  ← 정상 표시
│      johnbuspark@gmail.com       │
│      신청일: 2026. 1. 30.        │
└──────────────────────────────────┘
```

이 수정으로 커뮤니티 관리자가 가입 신청자의 프로필 정보를 정상적으로 확인하고 승인/거절 결정을 내릴 수 있게 됩니다.


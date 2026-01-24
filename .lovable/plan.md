
# RLS 정책 수정: 모든 유저에게 Published 세트 공개

## 문제 원인

현재 RLS 정책이 **같은 커뮤니티 멤버**에게만 published 세트를 허용하고 있음:

```text
┌─────────────────────────────────────────────────────────────────┐
│  service_sets SELECT 정책:                                       │
│  (status = 'published' AND is_community_member(user, community)) │
│                                                                  │
│  → 다른 커뮤니티의 published 세트 접근 불가 ❌                    │
└─────────────────────────────────────────────────────────────────┘
```

K-Worship 핵심 기능인 **다른 워십 커뮤니티의 예배세트 참조**가 작동하지 않음.

---

## 해결 방법

### 1. `service_sets` SELECT RLS 정책 수정

**현재:**
```sql
(created_by = auth.uid()) OR 
is_set_collaborator(auth.uid(), id) OR 
is_admin(auth.uid()) OR 
((status = 'published') AND (community_id IS NOT NULL) AND is_community_member(auth.uid(), community_id))
```

**수정 후:**
```sql
(created_by = auth.uid()) OR 
is_set_collaborator(auth.uid(), id) OR 
is_admin(auth.uid()) OR 
(status = 'published')  -- 모든 인증된 사용자가 published 세트 열람 가능
```

### 2. `set_songs` SELECT RLS 정책 수정

**현재:**
```sql
EXISTS (
  SELECT 1 FROM service_sets ss
  LEFT JOIN community_members cm ON (cm.community_id = ss.community_id)
  WHERE ss.id = set_songs.service_set_id 
  AND (
    ss.created_by = auth.uid() OR 
    (ss.status = 'published' AND cm.user_id = auth.uid()) OR  -- 같은 커뮤니티만
    is_set_collaborator(auth.uid(), ss.id) OR 
    is_admin(auth.uid())
  )
)
```

**수정 후:**
```sql
EXISTS (
  SELECT 1 FROM service_sets ss
  WHERE ss.id = set_songs.service_set_id 
  AND (
    ss.created_by = auth.uid() OR 
    ss.status = 'published' OR  -- 모든 published 세트의 곡 열람 가능
    is_set_collaborator(auth.uid(), ss.id) OR 
    is_admin(auth.uid())
  )
)
```

---

## SQL 마이그레이션

```sql
-- 1. Drop existing policies
DROP POLICY IF EXISTS "Users can view their sets and community sets" ON service_sets;
DROP POLICY IF EXISTS "View set songs" ON set_songs;

-- 2. Create updated service_sets SELECT policy
-- Published sets are visible to ALL authenticated users (cross-community discovery)
CREATE POLICY "Users can view own, collaborator, or published sets"
ON service_sets FOR SELECT
TO public
USING (
  created_by = auth.uid() OR 
  is_set_collaborator(auth.uid(), id) OR 
  is_admin(auth.uid()) OR 
  status = 'published'
);

-- 3. Create updated set_songs SELECT policy
-- Songs from published sets are visible to all authenticated users
CREATE POLICY "View set songs"
ON set_songs FOR SELECT
TO public
USING (
  EXISTS (
    SELECT 1 FROM service_sets ss
    WHERE ss.id = set_songs.service_set_id 
    AND (
      ss.created_by = auth.uid() OR 
      ss.status = 'published' OR
      is_set_collaborator(auth.uid(), ss.id) OR 
      is_admin(auth.uid())
    )
  )
);
```

---

## 예상 결과

| 시나리오 | 현재 | 수정 후 |
|---------|------|--------|
| 다른 커뮤니티의 published 세트 | ❌ 접근 불가 | ✅ 열람 가능 |
| Song usage count 배지 | 0 (RLS 차단) | ✅ 정확한 숫자 |
| Usage history 다이얼로그 | 빈 리스트 | ✅ 모든 published 세트 표시 |
| Draft 세트 | ❌ 숨김 | ❌ 숨김 (유지) |

---

## 보안 고려사항

- **Published 세트만** 공개 (draft는 여전히 숨김)
- K-Worship의 핵심 가치: 워십 커뮤니티 간 레퍼런스 공유
- 읽기 전용 접근 (수정 RLS는 변경 없음)
- 프론트엔드에서 이미 read-only 모드로 다른 커뮤니티 세트 표시

---

## 수정 범위

| 변경 | 설명 |
|------|------|
| DB 마이그레이션 | `service_sets`, `set_songs` SELECT RLS 정책 업데이트 |
| 프론트엔드 변경 | 없음 (이미 이전 작업에서 완료) |

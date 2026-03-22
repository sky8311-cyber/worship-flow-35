

## 공동체 가입 요청 중복 오류 수정

### 원인 분석
- **409 Conflict**: `community_join_requests` 테이블에 `(community_id, user_id)` 유니크 제약 존재
- 이전에 **거절(rejected)** 또는 **승인(approved)** 된 요청이 남아있음
- 쿼리는 `status = "pending"`만 조회 → 이전 거절 요청을 감지 못함 → "가입 신청" 버튼이 보임
- insert 시 유니크 제약 위반으로 실패

### 수정 방안

**파일:** `src/pages/CommunitySearch.tsx`

#### 1. 쿼리 확장 — 모든 상태의 요청 조회
```tsx
// 기존: .eq("status", "pending") 만 조회
// 변경: 모든 상태 조회하여 status별 분기 처리
.select("community_id, status")
.eq("user_id", user?.id)
```
→ `pending`, `rejected`, `approved` 모두 가져와서 Map으로 관리

#### 2. UI 분기 — 상태별 다른 버튼 표시
- **pending**: "가입 취소" 버튼 (기존)
- **rejected**: "재신청" 버튼 (기존 요청 삭제 후 새로 insert)
- **approved**: "가입 신청" 버튼 숨김 (이미 멤버)
- **없음**: "가입 신청" 버튼 (기존)

#### 3. 재신청 로직 — rejected 요청 삭제 후 재insert
rejected 상태일 때 "재신청" 클릭 시:
1. 기존 rejected 요청 delete
2. 새 pending 요청 insert

#### 4. 에러 메시지 개선
중복 에러(23505) 발생 시 "이미 가입 요청이 존재합니다" 메시지 표시

### 수정 파일
1. `src/pages/CommunitySearch.tsx` — 쿼리 확장 + 상태별 UI 분기 + 재신청 로직


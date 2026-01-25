

# 중복 예배인도자 신청서 문제 해결

## 문제 원인

**김주은** (june3616@naver.com) 사용자의 예배인도자 신청서가 3개 중복 생성됨:
- 13:29:47 → 첫 번째 제출
- 13:29:49 → 두 번째 제출 (+2초)
- 13:29:50 → 세 번째 제출 (+1초)

**원인**: 신청 버튼을 빠르게 여러 번 클릭했을 때 중복 제출 방지 로직이 없음

---

## 해결 방안

### 1단계: 중복 데이터 정리 (즉시)

가장 최신 신청서 1개만 남기고 나머지 삭제:

```sql
DELETE FROM worship_leader_applications 
WHERE user_id = 'f0dac984-2ffc-4dba-b4b7-a3bc48eacecd'
  AND id != '9e3230c9-2a18-4fed-b8ef-23fb4f890e1e';  -- 최신 것만 유지
```

### 2단계: 데이터베이스 제약조건 추가 (근본 해결)

동일 사용자가 pending 상태의 신청서를 중복으로 생성하지 못하도록 부분 유니크 제약조건 추가:

```sql
-- pending 상태 신청서는 user_id당 1개만 허용
CREATE UNIQUE INDEX IF NOT EXISTS idx_worship_leader_applications_pending_unique 
ON worship_leader_applications (user_id) 
WHERE status = 'pending';
```

### 3단계: 프론트엔드 중복 제출 방지

**파일:** `src/pages/RequestWorshipLeader.tsx`

신청 버튼에 `disabled` 상태를 mutation의 `isPending`과 연결:

```typescript
<Button 
  type="submit" 
  disabled={mutation.isPending}
  className="w-full"
>
  {mutation.isPending ? "제출 중..." : "신청하기"}
</Button>
```

---

## 파일 변경 요약

| 작업 | 내용 |
|------|------|
| DB 정리 | 중복 신청서 2개 삭제 |
| DB 마이그레이션 | 부분 유니크 인덱스 추가 |
| `RequestWorshipLeader.tsx` | 버튼 중복 클릭 방지 강화 |


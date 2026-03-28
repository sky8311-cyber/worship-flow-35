

# K-Seed 잔고 복구 및 데이터 무결성 수정

## 문제 진단 결과

**심각한 데이터 불일치 발견:**
- `seed_transactions` 테이블에 트랜잭션 기록이 있지만 `user_seeds` 테이블에 잔고 레코드가 **없는** 유저: **72명**
- 유실된 총 시드 합계: **8,201 K-Seeds**
- 영향 받는 기간: 2026-01-15 ~ 2026-03-15 (이 기간 내 시드를 받은 유저들)

**원인:** `award_seeds()` 함수에 `user_seeds` 동기화 로직이 늦게 추가되어, 이전에 시드를 받은 유저들의 잔고 레코드가 생성되지 않았습니다. 현재 `award_seeds()` 함수는 이미 수정되어 있어 **신규 트랜잭션은 정상 동기화**되지만, 기존 72명은 여전히 누락 상태입니다.

**기존 79명의 정상 유저:** `total_seeds`와 `seed_transactions` 합계가 모두 일치함을 확인했습니다.

## 해결 방안

### 1단계: 누락된 user_seeds 레코드 일괄 복구 (DB 마이그레이션)

`seed_transactions`에서 실제 합산값을 계산하여 `user_seeds`에 INSERT:

```sql
INSERT INTO user_seeds (user_id, total_seeds, current_level, created_at, updated_at)
SELECT 
  st.user_id,
  SUM(st.seeds_earned) as total_seeds,
  COALESCE(
    (SELECT sl.level FROM seed_levels sl 
     WHERE sl.min_seeds <= SUM(st.seeds_earned) 
     ORDER BY sl.level DESC LIMIT 1),
    1
  ) as current_level,
  now(),
  now()
FROM seed_transactions st
LEFT JOIN user_seeds us ON us.user_id = st.user_id
WHERE us.user_id IS NULL
GROUP BY st.user_id
ON CONFLICT (user_id) DO UPDATE 
SET total_seeds = EXCLUDED.total_seeds, 
    current_level = EXCLUDED.current_level, 
    updated_at = now();
```

이 한 번의 마이그레이션으로 72명 전원의 잔고가 복구됩니다.

### 변경 파일
- **DB 마이그레이션 1개** (위 SQL 실행)
- 코드 변경 없음 (`award_seeds()` 함수는 이미 수정 완료)


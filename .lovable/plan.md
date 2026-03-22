

## K-Seed 잔액 0 리셋 버그 수정

### 원인
`award_seeds()` DB 함수에 `user_seeds` 테이블 UPDATE 코드가 **누락**되어 있음.
- `deduct_seeds()`: `user_seeds.total_seeds`를 업데이트함 ✓
- `award_seeds()`: `seed_transactions`에 INSERT만 하고 `user_seeds`는 업데이트 안 함 ✗
- 3/20 대량 악보 삭제 → `deduct_seeds`가 total을 0으로 → 이후 `award_seeds` 호출해도 `user_seeds`는 0 유지

### 수정 (2단계)

**1. `award_seeds` 함수 수정** (DB Migration)
- `v_new_total`과 `v_new_level` 계산 후 `user_seeds` 테이블을 UPDATE하는 코드 추가:
```sql
-- Upsert user_seeds with correct total and level
INSERT INTO user_seeds (user_id, total_seeds, current_level)
VALUES (_user_id, v_new_total, v_new_level)
ON CONFLICT (user_id) 
DO UPDATE SET total_seeds = v_new_total, current_level = v_new_level, updated_at = now();
```

**2. 전체 유저 데이터 복구** (Data fix via insert tool)
- 모든 `user_seeds` 행을 `seed_transactions` SUM 기반으로 재계산하여 업데이트
- 레벨도 함께 재계산

### 영향 범위
- 10명 이상의 유저가 잘못된 잔액 보유 중
- 가장 큰 차이: 김조이 (표시: 0, 실제: 1,467), 최광은 (표시: 0, 실제: 1,328)


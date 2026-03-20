

## Sandbox Tester 추가: admin@test.com

### 대상 사용자
- **이메일**: admin@test.com
- **User ID**: `3d927691-b9a8-4fe0-a1ba-7919ed00a0ec`
- **이름**: K-Worship Admin

### 실행할 작업

`sandbox_testers` 테이블에 1건 INSERT:

```sql
INSERT INTO sandbox_testers (user_id, enabled, features, note)
VALUES (
  '3d927691-b9a8-4fe0-a1ba-7919ed00a0ec',
  true,
  '{"all"}',
  'Admin test account - all features'
);
```

- `features`: `["all"]` → 모든 feature flag를 오버라이드하여 접근 가능
- 이 계정은 `institute_enabled`, `ai_set_builder_enabled`, `worship_profile_enabled` 등 글로벌 OFF 상태인 기능도 볼 수 있음

### 기술 상세
- 코드 변경 없음. DB INSERT 1건만 실행.



# `last_active_at` 업데이트 버그 수정

## 발견된 문제

### 증거 데이터
| 이메일 | auth.last_sign_in_at | profiles.last_active_at | 상태 |
|--------|----------------------|------------------------|------|
| 황대상 (dsang3328@naver.com) | 오늘 06:57 | **NULL** | ❌ 버그 |
| 최광은 (sky@goodpapa.org) | 어제 19:23 | **NULL** | ❌ 버그 |
| admin@test.com | 오늘 06:53 | 07:34 | ✅ 정상 |

### 근본 원인
1. `SIGNED_IN` 이벤트에서만 `last_active_at` 업데이트
2. **세션 복원 (탭 재방문, 페이지 새로고침)**: `TOKEN_REFRESHED` 또는 `INITIAL_SESSION` 이벤트 발생 → 업데이트 안됨
3. 기존 유저들의 `last_active_at`이 NULL로 남아있음

---

## 해결 방법

### 1. AuthContext.tsx 수정
`SIGNED_IN` 이벤트 외에도 **모든 로그인 관련 이벤트**에서 `last_active_at` 업데이트:

```typescript
// 현재: SIGNED_IN 이벤트에서만 업데이트
if (event === "SIGNED_IN") {
  // Update last_active_at...
}

// 변경: 세션이 있는 모든 경우에 업데이트
// SIGNED_IN, TOKEN_REFRESHED, INITIAL_SESSION 모두 포함
const shouldUpdateActivity = event === "SIGNED_IN" || 
                             event === "TOKEN_REFRESHED" || 
                             event === "INITIAL_SESSION";
                             
if (shouldUpdateActivity) {
  supabase.from('profiles').update({ 
    last_active_at: new Date().toISOString() 
  }).eq('id', session.user.id);
}
```

### 2. 기존 NULL 데이터 복구 (마이그레이션)
기존 유저들의 `last_active_at`을 `auth.users.last_sign_in_at`으로 채움:

```sql
-- auth.users의 last_sign_in_at을 profiles.last_active_at으로 복사
UPDATE profiles p
SET last_active_at = au.last_sign_in_at
FROM auth.users au
WHERE p.id = au.id
  AND p.last_active_at IS NULL
  AND au.last_sign_in_at IS NOT NULL;
```

### 3. 자동 이메일 RPC 함수 개선 (선택)
`last_active_at`이 없어도 `auth.users.last_sign_in_at` 참조하도록 수정 (백업 로직)

---

## 변경 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/contexts/AuthContext.tsx` | 모든 세션 이벤트에서 `last_active_at` 업데이트 |
| `supabase/migrations/` | 기존 NULL 데이터 → `auth.users.last_sign_in_at`으로 복구 |

---

## 예상 결과

1. **즉시 효과**: 기존 유저들의 `last_active_at`이 실제 로그인 기록으로 채워짐
2. **향후 정확한 추적**: 탭 재방문, 페이지 새로고침 시에도 활동 기록
3. **미접속자 명단 정확도 향상**: 오늘 로그인한 유저가 "81명 미접속자" 명단에서 제외됨

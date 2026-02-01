
# 활성 사용자 지표 수정 - `last_active_at` 기반으로 변경

## 현재 문제

**현재 구현 (잘못됨):**
```typescript
// page_analytics 테이블에서 user_id를 쿼리
supabase.from("page_analytics")
  .select("user_id")
  .gte("entered_at", currentStart)
  .not("user_id", "is", null)
```

**문제점:**
- `page_analytics`는 페이지 조회 기록용 테이블
- 세션 재시작, 탭 활성화 등이 정확히 반영되지 않음
- 불필요한 중복 데이터 처리

---

## 해결 방법

**올바른 구현:**
```typescript
// profiles 테이블의 last_active_at 필드 사용
supabase.from("profiles")
  .select("*", { count: "exact", head: true })
  .gte("last_active_at", currentStart)
  .lt("last_active_at", currentEnd)
```

**`last_active_at` 업데이트 시점:**
- 페이지 이동 시 (`usePageAnalytics`)
- 로그인 시 (`AuthContext` - SIGNED_IN, INITIAL_SESSION, TOKEN_REFRESHED)
- 탭 활성화 시 (`handleVisibilityChange`)

---

## 수정 내용

**파일:** `src/components/admin/ActivityMetricsSection.tsx`

**변경 전 (96~105행):**
```typescript
// Active users (from page_analytics)
supabase.from("page_analytics")
  .select("user_id", { count: "exact", head: false })
  .gte("entered_at", currentStart)
  .lt("entered_at", currentEnd)
  .not("user_id", "is", null),
supabase.from("page_analytics")
  .select("user_id", { count: "exact", head: false })
  .gte("entered_at", previousStart)
  .lt("entered_at", previousEnd)
  .not("user_id", "is", null),
```

**변경 후:**
```typescript
// Active users (from profiles.last_active_at)
supabase.from("profiles")
  .select("*", { count: "exact", head: true })
  .gte("last_active_at", currentStart)
  .lt("last_active_at", currentEnd),
supabase.from("profiles")
  .select("*", { count: "exact", head: true })
  .gte("last_active_at", previousStart)
  .lt("last_active_at", previousEnd),
```

**결과 처리 변경 (128~130행):**
```typescript
// 변경 전: Set으로 중복 제거
const currentUniqueUsers = new Set(currentActiveUsers.data?.map(d => d.user_id) || []).size;
const previousUniqueUsers = new Set(previousActiveUsers.data?.map(d => d.user_id) || []).size;

// 변경 후: count 직접 사용
const currentUniqueUsers = currentActiveUsers.count || 0;
const previousUniqueUsers = previousActiveUsers.count || 0;
```

---

## 수정 파일

| 파일 | 변경 내용 |
|------|----------|
| `src/components/admin/ActivityMetricsSection.tsx` | `page_analytics` → `profiles.last_active_at` 쿼리로 변경 |

---

## 결과

| 시나리오 | 변경 전 | 변경 후 |
|----------|---------|---------|
| 로그인 후 대시보드 방문 | O | O |
| 로그인 후 워십세트 직접 방문 | X (대시보드 미방문) | O |
| 탭 다시 활성화 | X | O |
| 세션 재시작 | X | O |
| 백그라운드에서 앱 열기 | X | O |


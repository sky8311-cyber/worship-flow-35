
# 관리자 페이지 접속 불가 문제 수정

## 문제 분석

```text
현재 상태:
┌─────────────────────────────────────────────────────────────────────────┐
│ AdminRoute.tsx                                                          │
│   loading = false (Supabase 기본 인증 로딩 완료)                          │
│   BUT roles = [] (아직 로드되지 않음)                                     │
│   → isAdmin = false                                                      │
│   → 잘못된 리다이렉트 또는 빈 화면                                         │
└─────────────────────────────────────────────────────────────────────────┘

vs.

┌─────────────────────────────────────────────────────────────────────────┐
│ ProtectedRoute.tsx                                                      │
│   isFullyLoaded = loading=false && user && profileLoaded && roleSyncComplete │
│   → 모든 데이터가 준비될 때까지 로딩 화면 표시                              │
│   → 정상 작동                                                            │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 근본 원인

`AuthContext`에서 `isAdmin`은 `roles.includes("admin")`으로 계산되지만, `AdminRoute`는 `loading`만 확인하고 `isFullyLoaded`를 확인하지 않습니다.

`loading`이 false가 되는 시점과 `roles` 배열이 채워지는 시점 사이에 경쟁 상태(race condition)가 발생합니다.

---

## 해결 방안

### 수정 파일: src/components/AdminRoute.tsx

**변경 내용:**
- `isFullyLoaded`를 `useAuth()`에서 추가로 가져오기
- `ProtectedRoute`와 동일한 로딩 게이트 패턴 적용
- 프로필 + 역할 로딩이 완료될 때까지 로딩 화면 표시

**수정 전:**
```tsx
export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAdmin, loading } = useAuth();
  
  if (loading) {
    // 로딩 화면 표시
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};
```

**수정 후:**
```tsx
export const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isAdmin, loading, isFullyLoaded } = useAuth();
  
  // 기본 인증 로딩 대기
  if (loading) {
    // 로딩 화면 표시
  }
  
  // 인증되지 않은 경우 로그인으로 리다이렉트
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  // 프로필과 역할이 완전히 로드될 때까지 대기
  // (ProtectedRoute와 동일한 패턴)
  if (!isFullyLoaded) {
    // 로딩 화면 표시
  }
  
  // 역할 로딩 완료 후 admin 권한 확인
  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};
```

---

## 수정 흐름

```text
사용자 로그인 후 /admin 접근:

수정 전:
┌─────────────────┐    ┌────────────────┐    ┌────────────────┐
│ loading = true  │ →  │ loading = false │ →  │ isAdmin 체크    │
│ 로딩 표시       │    │ roles = []     │    │ = false (잘못됨)│
└─────────────────┘    │ 바로 체크!      │    │ → /dashboard   │
                       └────────────────┘    └────────────────┘

수정 후:
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐    ┌──────────────────┐
│ loading = true  │ →  │ loading = false │ →  │ isFullyLoaded   │ →  │ isAdmin 체크      │
│ 로딩 표시       │    │ isFullyLoaded   │    │ = true          │    │ = true (정상)     │
└─────────────────┘    │ = false         │    │ roles 로드 완료  │    │ → Admin 페이지    │
                       │ 계속 로딩 표시   │    └─────────────────┘    └──────────────────┘
                       └─────────────────┘
```

---

## 개선 효과

| 항목 | 수정 전 | 수정 후 |
|------|---------|---------|
| 역할 로딩 대기 | ❌ 미대기 | ✅ 완전 대기 |
| 경쟁 상태 | ❌ 발생 가능 | ✅ 해결 |
| 빈 화면 | ❌ 발생 가능 | ✅ 로딩 화면 표시 |
| 잘못된 리다이렉트 | ❌ 가능 | ✅ 불가 |

---

## 파일 변경 요약

| 파일 | 변경 내용 |
|------|----------|
| `src/components/AdminRoute.tsx` | `isFullyLoaded` 체크 추가, ProtectedRoute와 동일한 로딩 게이트 패턴 적용 |

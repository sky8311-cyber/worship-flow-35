

# 프로덕션에서 비로그인 사용자에게 랜딩 페이지 표시

## 문제
현재 `MobileAppLanding.tsx`에서 비로그인 사용자도 `/login`으로 리다이렉트되어 랜딩 페이지를 볼 수 없음.

## 수정

**파일: `src/pages/MobileAppLanding.tsx`** — `useEffect` 변경:

```tsx
useEffect(() => {
  if (loading) return;
  const isDev = import.meta.env.DEV;
  if (isDev) return;
  // 로그인한 사용자만 대시보드로 리다이렉트, 비로그인 사용자는 랜딩 페이지 표시
  if (user) navigate("/dashboard", { replace: true });
}, [user, loading, navigate]);
```

`else navigate("/login")` 제거 → 비로그인 사용자는 랜딩 페이지 콘텐츠를 볼 수 있음.

## 결과
- **비로그인 사용자**: 랜딩 페이지 표시 ✅
- **로그인 사용자**: `/dashboard`로 리다이렉트 (기존 유지)
- **개발 모드**: 리다이렉트 없이 랜딩 페이지 표시 (기존 유지)


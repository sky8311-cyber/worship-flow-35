

# MobileAppLanding 리다이렉트 수정

## 문제 원인

`/` 경로는 `Landing.tsx`가 아니라 `MobileAppLanding.tsx`가 처리합니다. 이 컴포넌트는 **모든 사용자를 무조건 리다이렉트**합니다:
- 로그인 상태 → `/dashboard`
- 비로그인 상태 → `/login`

따라서 랜딩 페이지 콘텐츠가 절대 표시되지 않습니다. 이전에 `Landing.tsx`에 적용한 `isDev` 체크는 `/app` 경로에만 적용되어 효과가 없었습니다.

## 수정 방법

**파일: `src/pages/MobileAppLanding.tsx`** (lines 23-27)

개발 모드에서는 리다이렉트를 건너뛰도록 수정:

```tsx
useEffect(() => {
  if (loading) return;
  const isDev = import.meta.env.DEV;
  if (isDev) return; // 개발 모드에서는 랜딩 페이지 표시
  if (user) navigate("/dashboard", { replace: true });
  else navigate("/login", { replace: true });
}, [user, loading, navigate]);
```

## 결과

- **Lovable 프리뷰 (개발 모드)**: `/` 접속 시 랜딩 페이지 콘텐츠 정상 표시
- **배포된 사이트 (프로덕션)**: 기존 동작 유지 (로그인→대시보드, 비로그인→로그인)


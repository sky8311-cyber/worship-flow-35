

# 랜딩 페이지 미리보기 문제 수정

## 원인
`Landing.tsx`의 `useEffect`에서 로그인된 사용자(`user`)가 있으면 무조건 `/dashboard`로 리다이렉트합니다.

## 해결 방법
URL 파라미터 `?preview=true`가 있으면 리다이렉트를 건너뛰도록 수정합니다.

### 변경 파일: `src/pages/Landing.tsx`

```tsx
useEffect(() => {
  const params = new URLSearchParams(location.search);
  if (!loading && user && !params.has("preview")) {
    navigate("/dashboard");
  }
}, [user, loading, navigate, location.search]);
```

이렇게 하면 `/` 접속 시에는 기존처럼 대시보드로 이동하고, `/?preview=true`로 접속하면 로그인 상태에서도 랜딩 페이지를 미리볼 수 있습니다.


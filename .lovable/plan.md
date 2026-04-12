

# 개발 모드에서 랜딩 페이지 자동 미리보기

## 변경 내용

`src/pages/Landing.tsx`의 리다이렉트 조건에 개발 환경 체크를 추가합니다.

### 변경 파일: `src/pages/Landing.tsx`

```tsx
useEffect(() => {
  const params = new URLSearchParams(location.search);
  const isDev = import.meta.env.DEV;
  if (!loading && user && !params.has("preview") && !isDev) {
    navigate("/dashboard");
  }
}, [user, loading, navigate, location.search]);
```

`import.meta.env.DEV`는 Vite 개발 서버에서 `true`, 프로덕션 빌드에서 `false`입니다.

## 결과

- **Lovable 프리뷰 (개발 모드)**: 로그인 상태에서도 랜딩 페이지 표시
- **배포된 사이트 (프로덕션)**: 기존처럼 로그인 시 `/dashboard`로 리다이렉트
- `?preview=true` 파라미터도 여전히 작동




## /login 페이지에 Footer 추가 및 로그인 카드 중앙 정렬

### 변경 사항

**파일: `src/pages/auth/Login.tsx`**

1. `LandingFooter` 컴포넌트를 import
2. 로그인 카드 컨테이너의 높이 계산을 수정하여 header와 footer 사이에서 수직 중앙 정렬
   - 기존: `min-h-[calc(100vh-80px)]` (header만 고려)
   - 변경: `min-h-[calc(100vh-80px)]` 제거, `flex-1`로 남은 공간 채우기
3. 전체 레이아웃을 `flex flex-col min-h-screen`으로 변경하여 header - content - footer 3단 구조 적용
4. 로그인 카드 영역의 `py-12`를 `py-6`으로 줄여서 카드를 약간 위로 배치
5. 페이지 하단에 `<LandingFooter />` 추가

### 레이아웃 구조 (변경 후)

```text
+---------------------------+
|  Header (로고 + 언어)      |
+---------------------------+
|                           |
|    [로그인 카드 - 중앙]     |  <-- flex-1, 수직/수평 중앙
|                           |
+---------------------------+
|  LandingFooter            |
+---------------------------+
```

### 기술 상세

- 최상위 `div`에 `flex flex-col` 추가
- 로그인 카드 컨테이너: `min-h-[calc(100vh-80px)]` -> `flex-1`로 변경하여 footer를 밀어내고 남은 공간에서 중앙 정렬
- `LandingFooter`는 기존 랜딩 페이지와 완전히 동일한 컴포넌트 재사용

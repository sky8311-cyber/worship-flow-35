

## InstituteComingSoon: Bottom Nav 제거

### 문제
Coming Soon 페이지에 `InstituteBottomNav`가 있으면 Institute 내부 네비게이션처럼 보이고, 메인 앱으로 돌아갈 수 없음. 이 페이지는 마케팅 프리뷰일 뿐이므로 기존 앱의 `BottomTabNavigation`이 보여야 함.

### 변경

**파일: `src/components/institute/InstituteComingSoon.tsx`**
- `InstituteBottomNav` 제거
- `inst-root` (fixed fullscreen overlay) 대신 일반 div로 변경 → 메인 앱 레이아웃 안에서 렌더링되어 기존 bottom nav 유지

**파일: `src/layouts/InstituteLayout.tsx`**
- Coming Soon 반환 시 `InstituteLayout`의 fullscreen wrapper 없이 `<InstituteComingSoon />` 단독 반환 (현재 이미 이렇게 동작)

### 핵심
- `inst-root` (position: fixed, inset: 0, z-index: 50) 제거 → 메인 앱 BottomTabNavigation 위에 덮어쓰지 않음
- "홈으로 돌아가기" 버튼은 유지


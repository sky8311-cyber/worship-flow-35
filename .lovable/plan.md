

## 튜토리얼 시스템 버그 & 성능 수정

### 발견된 문제

1. **`close` 스테일 클로저 버그** (`useTutorial.ts` line 37): `next()` 함수가 `close()`를 호출하지만, `close`가 dependency array에 포함되지 않음 → 마지막 스텝에서 "완료" 클릭 시 `close`가 오래된 참조를 사용하여 예상대로 동작하지 않을 수 있음

2. **스크롤 이벤트 과다 렌더링** (`TutorialOverlay.tsx`): `updatePosition`이 모든 scroll 이벤트마다 `setState`를 2개 호출 → 스크롤할 때마다 clip-path 재계산 + 리렌더 → 버벅임 원인. `transition-all duration-300` CSS가 매 프레임 clip-path 트랜지션을 유발하여 성능 악화.

3. **resize 이벤트도 동일** — throttle/debounce 없음

### 수정 계획

#### 1. `useTutorial.ts` — dependency 수정
- `next`의 dependency array에 `close` 추가
- `close`를 `next`보다 먼저 선언하도록 순서 변경

#### 2. `TutorialOverlay.tsx` — 성능 최적화
- scroll/resize 핸들러에 `requestAnimationFrame` 기반 throttle 적용
- clip-path에서 `transition-all duration-300` 제거 (매 프레임 트랜지션 불필요)
- spotlight ring의 `transition-all` → `transition-none` (scroll 중 지연 방지)
- tooltip에도 동일하게 불필요한 transition 제거

### 수정 파일 (2개)
1. `src/components/tutorial/useTutorial.ts` — close dependency 수정 + 선언 순서
2. `src/components/tutorial/TutorialOverlay.tsx` — rAF throttle + transition 제거


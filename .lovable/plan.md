

## 성능 분석 결과 및 개선 계획

### 발견된 문제점

**성능 프로파일 결과**:
- FCP: **4,880ms** (목표: 1,800ms 이하)
- 스크립트 127개 로드, 총 1,463KB
- 네트워크 요청에서 **중복 호출** 다수 발견

**핵심 원인 3가지**:

#### 1. AuthContext에서 fetchProfile 이중 호출
`initAuth()`에서 `fetchProfile()` 호출 → 직후 `onAuthStateChange`가 `INITIAL_SESSION` 이벤트로 다시 `fetchProfile()` 호출. 결과적으로 profiles, user_roles, community_members 쿼리가 **2번씩** 실행됨.

#### 2. last_active_at 중복 업데이트
- `AuthContext`: SIGNED_IN, TOKEN_REFRESHED, INITIAL_SESSION에서 profiles PATCH
- `usePageAnalytics`: 매 페이지 이동마다 profiles PATCH
- 결과: 초기 로드시 profiles PATCH가 **3~4회** 발생

#### 3. page_analytics INSERT 실패 반복
세션이 아직 준비 안 된 상태에서 INSERT 시도 → 403/401 에러 5회. 실패해도 재시도 없지만 불필요한 네트워크 요청과 에러 로그 발생.

---

### 수정 계획 (3개 파일)

**1. `src/contexts/AuthContext.tsx`**
- `initAuth`에서 `fetchProfile` 호출 후 플래그 설정
- `onAuthStateChange`의 `INITIAL_SESSION` 이벤트에서 이미 fetch된 경우 중복 호출 방지
- `last_active_at` 업데이트를 fetchProfile 내부로 통합하여 1회만 실행

**2. `src/hooks/usePageAnalytics.ts`**
- `last_active_at` 업데이트 로직 제거 (AuthContext에서 이미 처리)
- user 세션이 없으면 page_analytics INSERT 건너뛰기 (403 에러 방지)
- visibilitychange 이벤트에서 `recordPageView` 재호출 제거 (탭 복귀시 불필요한 중복)

**3. `src/components/tutorial/TutorialOverlay.tsx`**
- 이전 수정에서 `scrollIntoView("instant")`가 적용되었는지 확인하고, scroll 이벤트 리스너를 `passive: true`로 보장

### 예상 효과
- 초기 로드 네트워크 요청 ~8개 감소 (18 → ~10)
- profiles PATCH 3~4회 → 1회
- page_analytics 403 에러 제거
- 체감 로드 속도 30~40% 개선


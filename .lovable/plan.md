
문제 원인
- 현재 “더이상 보지 않기”는 `localStorage`에만 저장됩니다.
- 이 방식은 세션/도메인(특히 프리뷰 환경) 변화 시 값이 유지되지 않을 수 있어, 재접속 때 카드가 다시 뜰 수 있습니다.
- 또한 키가 사용자 공통(`wl-onboarding-dismissed`)이라 계정 전환 시에도 상태가 꼬일 여지가 있습니다.

수정 방향
1) 서버 영구 저장 추가 (핵심)
- DB 마이그레이션: `profiles`에 `wl_onboarding_dismissed_at timestamptz null` 컬럼 추가.
- 기존 프로필 RLS(본인 업데이트 허용)를 그대로 활용해 프론트에서 직접 업데이트.

2) 체크리스트 숨김 로직을 “서버 + 로컬” 이중화
- `WLOnboardingChecklist.tsx`에서 숨김 판정:
  - 1순위: 서버 컬럼(`wl_onboarding_dismissed_at` 존재 시 숨김)
  - 2순위: 로컬 fallback(`wl-onboarding-dismissed:${user.id}`) 존재 시 숨김
- user-scoped 로컬 키로 변경해 계정 간 충돌 제거.

3) “X 닫기”와 “더이상 보지 않기”를 동일한 dismiss 처리로 통합
- 공통 `dismissChecklist()` 함수:
  - 즉시 UI 숨김(optimistic)
  - 로컬 키 저장
  - 서버 `profiles` 업데이트(`wl_onboarding_dismissed_at = now()`)
- 서버 저장 실패 시 토스트로 안내하고 로컬은 유지(사용자 체감 우선).

4) 재접속 동작 안정화
- 컴포넌트 마운트 시 서버 값이 true면 로컬 키도 동기화.
- 결과적으로 새로고침/재로그인/기기 변경에서도 박스가 다시 뜨지 않게 고정.

검증 계획
- “더이상 보지 않기” 체크 → 즉시 카드 숨김 확인
- 새로고침 후 재진입 시 카드 미노출 확인
- 로그아웃/재로그인 후 미노출 확인
- 다른 기기/브라우저 로그인 시에도 미노출 확인(서버 저장 검증)

변경 대상
- DB migration (profiles 컬럼 추가)
- `src/components/dashboard/WLOnboardingChecklist.tsx` (숨김 상태 로직 + dismiss 저장 로직)

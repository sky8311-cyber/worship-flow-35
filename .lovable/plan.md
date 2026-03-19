
문제 원인 요약
- 전역 팝업(`CurationProfilePromptDialog`)이 모든 보호 라우트에서 마운트되고, `skills_summary`가 비어 있으면 조건이 계속 참이어서 다시 열립니다.
- 특히 “지금 설정하기”로 `/settings` 이동 후에도, 팝업 쪽에는 “온보딩 진행 중” 상태가 없어서 채팅 중 재등장합니다.
- 추가로 프로필 조회 query key가 화면별로 달라(`curation-profile-prompt` vs `curation-profile`) 저장 직후 상태 동기화가 늦어 재오픈 가능성이 있습니다.

수정 계획
1) 전역 팝업 재등장 방지 로직 추가 (`src/components/CurationProfilePromptDialog.tsx`)
- `useLocation`으로 현재 경로 확인 후, `/settings`에서는 팝업 오픈 로직을 중단.
- “지금 설정하기” 클릭 시 세션 단위 플래그(예: `sessionStorage`의 `kworship_profile_prompt_in_progress`)를 기록해 온보딩 중에는 전역 팝업이 다시 뜨지 않게 함.
- 다이얼로그 닫기 → 짧은 지연(100ms) → `navigate("/settings", { state: { openCurationChat: true } })` 순서로 전환해 닫힘/라우팅 경합 방지.

2) 프로필 상태 동기화 일원화
- 전역 팝업의 프로필 조회 `queryKey`를 `["curation-profile", user?.id]`로 통일.
- Settings의 `CurationProfileCard`에서 채팅 완료 시 `invalidateQueries(["curation-profile", user?.id])` 실행하도록 보완(현재 Settings 쪽은 완료 후 닫기만 함).
- 필요 시 팝업에서도 동일 key 구독으로 저장 직후 즉시 숨김 반영.

3) 라우트 state 재사용 방지 (`src/pages/Settings.tsx`)
- `openCurationChat`로 자동 오픈 후에는 `replace` 네비게이션으로 해당 state를 정리해, 뒤로가기/재진입 시 의도치 않은 재오픈 방지.

검증 계획 (수동 E2E)
- 케이스 A: 프로필 미완료 + Full/Church 유저
  1) 대시보드에서 팝업 노출 확인
  2) “지금 설정하기” 클릭 → Settings 채팅 열림
  3) 채팅 입력 중 전역 팝업이 다시 뜨지 않는지 확인
- 케이스 B: 채팅 완료 후
  1) 완료 메시지 후 시트 닫힘
  2) 다른 페이지 이동해도 팝업 미노출 확인
- 케이스 C: “나중에 하기”
  1) dismiss 저장 후 재방문 시 팝업 미노출 확인
- 케이스 D: Basic 멤버
  1) 전역 팝업 비노출 유지
  2) Settings의 “내 예배 프로필” 채팅 접근 가능 유지

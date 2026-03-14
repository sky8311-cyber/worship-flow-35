
목표: “iPhone Chrome에서 YouTube 앱 대신 새 탭 웹으로만 열리는 문제”를 이번에 한 번에 정리해서, 경로별 편차 없이 동일하게 동작하도록 고칩니다.

1) 코드베이스 진단 결과 (깊게 본 핵심)
- `src/lib/youtubeHelper.ts` iOS 브라우저 분기에서 `vnd.youtube://` 시도 후 2초 뒤 `window.open(..., "_blank")`를 무조건 실행합니다.
- iOS/Chrome에서는 새 탭(`_blank`)이 Universal Link 앱 전환을 약화시키거나 웹 탭으로 고정시키는 케이스가 많습니다.
- YouTube 열기 경로가 한 곳으로 통일되어 있지 않습니다. 현재 일부는 helper를 타고, 일부는 직접 `window.open`/`<a target="_blank">`를 씁니다.
  - 확인된 우회 경로: `SongDialog.tsx`(썸네일 클릭), `ProfileSidebarCard.tsx`, `DuplicateReviewDialog.tsx`, `AdminUserProfileDialog.tsx`
- 즉, helper만 고쳐도 “여전히 같은 증상”이 날 수 있는 구조입니다.

2) 원타임 구조 개선(핵심 설계)
- “YouTube 열기”를 단일 진입점으로 강제:
  - 모든 YouTube 클릭은 `openYouTubeUrl()`만 호출
  - 직접 `window.open`/`target="_blank"` YouTube 경로 제거
- iOS 브라우저 정책에 맞게 전환:
  - 우선 `https://youtu.be/{id}` 또는 canonical watch URL을 **same-tab**(`location.assign`)으로 시도
  - 앱 전환 감지(`visibilitychange`, `pagehide`, `blur`) 기반으로만 fallback 실행
  - fallback도 모바일에서는 **same-tab**으로 처리 (`_blank` 금지)
- 데스크톱만 `_blank` 유지
- Android 브라우저는 기존 `intent://` 유지 (fallback 포함)
- Capacitor 네이티브는 AppLauncher 경로 유지

3) 구현 파일 계획
- `src/lib/youtubeHelper.ts`
  - iOS 로직 재작성: 타이머 기반 무조건 새탭 fallback 제거
  - `appSwitchDetected` 플래그 + 이벤트 리스너 기반 fallback 가드
  - 모바일 fallback을 `window.location.assign(...)`으로 통일
  - URL/영상 ID 정규화 함수 추가 (watch/short/embed 링크 모두 처리)
  - 중복 탭 오픈 방지용 짧은 클릭 디바운스 추가
- `src/components/SongDialog.tsx`
  - 썸네일 클릭 `window.open(link.url, "_blank")` → `openYouTubeUrl(link.url)`
- `src/components/dashboard/ProfileSidebarCard.tsx`
  - YouTube `<a target="_blank">`를 helper 호출 방식으로 통일
- `src/components/DuplicateReviewDialog.tsx`
  - YouTube 링크 `<a target="_blank">`를 helper 호출 방식으로 통일
- `src/components/admin/AdminUserProfileDialog.tsx`
  - YouTube 버튼 `window.open` → helper 호출

4) 기술 상세 (왜 이게 “재발 방지”인지)
- 이번 문제의 본질은 “딥링크 문자열 1개”가 아니라 “경로 불일치 + 새탭 fallback 정책”입니다.
- 따라서 재발 방지는 다음 2가지로 달성됩니다:
  1) 경로 통일(모든 YouTube 오픈을 helper로 강제)
  2) 모바일에서 `_blank` 제거 + 앱 전환 감지형 fallback
- 이 구조면 특정 화면만 계속 실패하는 현상(지금까지 반복된 패턴)을 차단할 수 있습니다.

5) 검증 시나리오 (한 번에 끝내기 위한 체크)
- iPhone Chrome: SongCard / SetSongItem / SongDialog 썸네일 / Profile YouTube 버튼 각각 테스트
- iOS에서 YouTube 앱 설치/미설치 각각 확인
- Android Chrome 기존 intent 동작 회귀 확인
- Desktop에서 새 탭 열기 유지 확인
- BandView 내 임베드/플레이어 플로우 회귀 없음 확인

주의: iOS 사용자 기기에서 Universal Link가 사용자 설정으로 꺼진 경우(YouTube 앱 내부 설정 상태) 앱 강제 오픈은 OS 정책상 100% 보장 불가입니다. 하지만 위 구조로 “앱 코드 때문에 새탭 웹으로 고정되는 회귀”는 실질적으로 제거됩니다.

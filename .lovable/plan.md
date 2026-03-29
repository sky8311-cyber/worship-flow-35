
문제 원인부터 확실히 잡았습니다. 지금 BGM이 안 나오는 핵심은 **“재생 트리거 타이밍 + 토글 상태 로직”**이 동시에 꼬여서입니다.

## 확인된 원인

1. **재생 시작 타이밍 레이스**
   - 로그상 `Player ready`와 `Loading first video`까지는 도달합니다.
   - 그런데 실제 `PLAYING(state=1)` 상태로 넘어간 흔적이 없고, 사용자 클릭 이후 재생 명령이 준비 타이밍과 엇갈릴 수 있습니다.

2. **BGM 버튼 토글 로직이 재생 실패를 악화**
   - `SpaceCanvas`의 `BGMButton`은 `isBGMPlaying`이 false이면 다시 `startPlaylist()`를 호출합니다.
   - 재생이 아직 붙지 않은 상태에서 사용자가 다시 누르면 **play 재시도**가 아니라 **플레이어 재초기화**가 반복됩니다.
   - 실제 콘솔에 `Fetching proxy HTML`이 연속으로 찍히는 패턴이 이 증거입니다.

3. **로컬 상태(`hasStarted`) 의존**
   - BGM 실행 여부를 컴포넌트 로컬 상태로 판단해서, 전역 플레이어 실제 상태와 불일치가 생깁니다.

---

## 수정 계획 (구현 순서)

### 1) `BGMButton` 상태 판단을 전역 상태 기반으로 교체
- 파일: `src/components/worship-studio/spaces/SpaceCanvas.tsx`
- `hasStarted` 제거.
- 아래 기준으로 상태를 판정:
  - 현재 플레이리스트가 해당 BGM인지 (`setId === bgmRoomId` 또는 `playlist[0]?.videoId === bgmVideoId`)
  - `isPlaying` 여부
- 버튼 동작을 3상태로 분리:
  - **BGM 미로드**: `startPlaylist(...)` + hidden 전환
  - **BGM 로드됐고 일시정지 상태**: `sendCommand('play')`
  - **BGM 재생중**: `sendCommand('pause')` (또는 close 정책 유지 시 close)

### 2) 재생 의도를 Context 레벨에서 보장 (레이스 제거)
- 파일: `src/contexts/MusicPlayerContext.tsx`, `src/components/music-player/GlobalMusicPlayerDialog.tsx`
- Context에 `pendingPlayIntent`(또는 유사 플래그) 추가:
  - BGM 버튼 첫 클릭 시 true
  - `playerReady` 수신 후 `loadVideo`/`play`를 안정적으로 실행하고 성공 시 false
- 이렇게 하면 “준비 전 play 명령 유실”을 방지하고, 컴포넌트 재렌더와 무관하게 재생 시도가 이어집니다.

### 3) `proxyHtml` 중복 fetch 방지
- 파일: `src/contexts/MusicPlayerContext.tsx`
- `isFetchingProxyRef` 추가해 in-flight 중복 호출 차단.
- 동일 videoId 재요청 디듀프.
- 효과: 현재처럼 연속 클릭 시 불필요한 iframe 재생성/재요청 폭주 차단.

### 4) `GlobalMusicPlayerDialog` 초기 로드 로직 정리
- 파일: `src/components/music-player/GlobalMusicPlayerDialog.tsx`
- `ready` 직후 1회 로드 + 재생 시퀀스를 명확히 분리:
  - `loadVideo` 후 짧은 지연 `play` 재시도(소수 회)까지는 허용
  - 성공 state(1) 수신 시 추가 재시도 중단
- 오류 토스트는 현재 `error` 구조와 맞게 `code/message` 둘 다 처리하도록 보강.

### 5) 디버그 로그 최소 추가 후 검증
- 파일: `SpaceCanvas.tsx`, `MusicPlayerContext.tsx`, `GlobalMusicPlayerDialog.tsx`
- 다음 포인트에 한정 로그:
  - BGM 버튼 클릭 시 현재 판정 상태(loaded/playing/pending)
  - pending intent set/consume
  - ready 수신 후 실제 `play` 시도 횟수
  - stateChange 1/2/0
- 문제 해결 확인되면 과한 로그는 정리.

---

## 검증 시나리오

1. 스튜디오 진입 → BGM 버튼 1회 클릭 → 2초 내 재생 시작.
2. 재생 중 버튼 클릭 → 일시정지.
3. 일시정지 상태 재클릭 → 즉시 재생 재개(재초기화 없음).
4. 버튼 연타(3~5회)해도 `Fetching proxy HTML`가 폭증하지 않음.
5. 페이지 이동/스페이스 이동 후에도 BGM 상태가 예측 가능하게 유지.

---

## 기술 메모 (짧게)

- 이번 이슈는 “유튜브 자체 문제”보다 앱 내부 상태머신 문제입니다.
- 핵심은 **`startPlaylist` 남발 금지 + 재생 의도(pending) 단일화**입니다.
- 이 구조로 바꾸면 사용자 연타/모바일 지연 환경에서도 재생 성공률이 크게 올라갑니다.

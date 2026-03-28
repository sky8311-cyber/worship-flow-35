

# 스튜디오 BGM 미니플레이어 재설계

## 현재 문제
1. **StudioHeader 상단 nav**에 MiniBGMPlayer가 위치 → 공간 부족, 충돌 가능
2. **RoomView**에서 BGM 자동 재생 + 퇴장 시 `closePlayer()` → 플랫폼 음악까지 강제 종료
3. **GlobalMusicPlayer**에서 `/institute/` 경로를 PUBLIC_ROUTES로 차단 → 인스티튜트 접속 시 플레이어 사라짐

## 변경 계획

### 1. StudioHeader에서 BGM 미니플레이어 제거
**파일: `StudioHeader.tsx`**
- `MiniBGMPlayer` 컴포넌트 및 관련 props (`bgmSongTitle`, `bgmSongArtist`, `bgmVideoId`, `bgmRoomId`, `bgmOwnerName`) 전부 삭제
- header는 뒤로가기 + 타이틀 + 알림 + 프로필 메뉴만 남김

**파일: `WorshipStudio.tsx`**
- `StudioHeader`에 전달하던 BGM 관련 props 제거

### 2. SpaceCanvas 편집 툴바 라인에 BGM 미니플레이어 배치
**파일: `SpaceCanvas.tsx`**
- props에 `bgmSongTitle`, `bgmVideoId`, `bgmRoomId`, `bgmOwnerName`, `bgmSongArtist` 추가
- 모바일/데스크톱 sticky toolbar에 편집 버튼 옆에 싸이월드 스타일 BGM 버튼 렌더
- BGM이 있는 경우: ♪ 아이콘 + 곡명 (마퀴) + Play/Pause 버튼
- 자동 재생 아님 — 유저가 Play 버튼을 눌러야만 재생 시작

**파일: `StudioMainPanel.tsx`**
- BGM 정보를 `SpaceCanvas`에 전달하도록 props 추가 (WorshipStudio → StudioMainPanel → SpaceCanvas)

### 3. RoomView 자동 재생 및 강제 종료 제거
**파일: `RoomView.tsx`**
- `useEffect` 내 자동 `startPlaylist()` 호출 삭제
- cleanup 함수의 `closePlayer()` 삭제
- 이렇게 하면 플랫폼에서 음악 재생 중 스튜디오/룸 접속 시 기존 음악이 계속 재생됨

### 4. 인스티튜트에서 플랫폼 음악 계속 재생
**파일: `GlobalMusicPlayer.tsx`**
- PUBLIC_ROUTES에서 `'/institute'` 제거
- `location.pathname.startsWith('/institute/')` 조건 제거
- 이렇게 하면 인스티튜트 페이지에서도 GlobalMiniPlayer가 계속 표시됨

### 5. StudioBGMBar 정리
**파일: `StudioBGMBar.tsx`**
- 더 이상 사용되지 않으므로 삭제 (이미 미사용 상태)

## 동작 흐름

```text
[밴드뷰에서 음악 재생 중]
  → 스튜디오 접속 → 플랫폼 음악 계속 재생
  → 스튜디오 내 BGM Play 클릭 → 플랫폼 음악 대체 (동일 MusicPlayerContext 사용)
  → 스튜디오 퇴장 → 마지막 재생 상태 유지 (closePlayer 안 함)

[인스티튜트 접속]
  → 음악 계속 재생 (GlobalMusicPlayer가 더 이상 숨기지 않음)
```

## 변경 파일 요약
| 파일 | 작업 |
|------|------|
| `StudioHeader.tsx` | MiniBGMPlayer 및 BGM props 제거 |
| `WorshipStudio.tsx` | StudioHeader BGM props 제거, StudioMainPanel에 BGM props 전달 |
| `StudioMainPanel.tsx` | BGM props 받아서 SpaceCanvas에 전달 |
| `SpaceCanvas.tsx` | 편집 버튼 옆에 BGM 미니플레이어 추가 |
| `RoomView.tsx` | 자동 재생 / 퇴장 시 closePlayer 삭제 |
| `GlobalMusicPlayer.tsx` | institute 경로 차단 제거 |
| `StudioBGMBar.tsx` | 삭제 |


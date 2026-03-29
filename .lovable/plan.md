

# Worship Atelier 브랜드 교체 + 툴바 제거 + BGM 재생 수정

## 요약
1. "예배공작소" / "K-Worship Studio" → **Worship Atelier** 전면 브랜드 교체
2. 업로드된 WA 로고 이미지를 헤더에 적용, 왼쪽 화살표(뒤로가기) 제거
3. 스페이스 에딧 바(상단 툴바) 완전 삭제 → 버튼들 재배치
4. BGM 재생 버그 수정

---

## 1. 로고 및 헤더 변경 (`StudioHeader.tsx`)

- `user-uploads://Worship_Atelier_Logo.png` → `src/assets/worship-atelier-logo.png`으로 복사
- 왼쪽 `ArrowLeft` 버튼 제거
- 텍스트 "예배공작소" → `<img>` 로고 (높이 약 28-32px)

## 2. 브랜드명 전면 교체

| 파일 | 변경 |
|------|------|
| `StudioHeader.tsx` | 텍스트 → 이미지 로고 |
| `StudioSidePanel.tsx` (270, 306행) | "K-Worship Studio" → "Worship Atelier" |
| `WorshipStudio.tsx` (137행) | SheetTitle "K-Worship Studio" → "Worship Atelier" |
| `WorshipStudio.tsx` (50행) | featureName → "Worship Atelier" |
| `StudioContractPrompt.tsx` | "예배공작소" → "워십 아틀리에", "Worship Studio" → "Worship Atelier" |
| `AdminDashboard.tsx` (651행) | "Worship Studio" → "Worship Atelier" |
| `AdminStudio.tsx` (217행) | "예배공작소 관리" → "워십 아틀리에 관리" |
| `AdminNav.tsx` (132행) | "예배공작소" → "아틀리에", "Studio" → "Atelier" |
| `ProfileDropdownMenu.tsx` | 관련 텍스트 변경 |
| 네비게이션 아이템 DB | "예배공작소" 레이블 → "아틀리에" |

## 3. 스페이스 에딧 바 삭제 + 버튼 재배치 (`SpaceCanvas.tsx`)

**삭제**: 상단 툴바 (현재 218-223행의 `div` — 페이지번호, BGM, 편집, 설정 버튼 포함)

**재배치**:

```text
┌─────────────────────────────┐
│ [♪ BGM] [편집] [이웃+]      │  ← 캔버스 최상단 좌측, 그리드 선상에 배치
│                             │     (absolute positioned, 캔버스 내부)
│         Page Content        │
│                             │
├─────────────────────────────┤
│ 1/3              [◀] [▶]   │  ← 하단 바: 좌측에 페이지번호, 우측에 화살표
└─────────────────────────────┘
```

- 페이지번호 표시: 상단 툴바에서 → 하단 바 좌측으로 이동
- BGM 플레이어 + 편집 버튼 + 이웃추가 버튼: 캔버스 내부 최상단 좌측에 `absolute` 배치
- 설정(Settings) 버튼: 편집 버튼 옆에 유지
- 새 페이지 추가 버튼: 하단 바 유지
- 높이 계산: 상단 바 제거로 `calc(100dvh - 48px - 40px)` → `calc(100dvh - 48px)` (헤더만 제외, 하단 바는 flex 내부)

## 4. BGM 재생 버그 수정

**원인 분석**: `BGMButton.handleToggle`에서:
```js
startPlaylist([...], ..., bgmRoomId);  // playerState: 'full', isPlaying: false
setPlayerState("hidden");              // playerState: 'hidden'
```
`startPlaylist`이 `isPlaying: false`로 설정하고, 프록시 iframe이 로드되어 YouTube가 autoplay하더라도 `GlobalMusicPlayerDialog`의 message listener가 `stateChange`를 수신하여 `setIsPlaying(true)`를 호출해야 하지만, iframe 로드와 YouTube API 초기화 사이의 타이밍 이슈로 첫 재생 시 play 커맨드가 전달되지 않을 수 있음.

**수정** (`SpaceCanvas.tsx` BGMButton):
- `startPlaylist` 호출 후 `setPlayerState("hidden")` 대신, `playerReady` 상태를 감시하여 ready 되면 명시적으로 `sendCommand('play')` + `setIsPlaying(true)` 호출
- `useEffect`로 `playerReady` 변화를 감지:
  ```tsx
  useEffect(() => {
    if (hasStarted && playerReady && !isPlaying) {
      sendCommand('play');
      setIsPlaying(true);
    }
  }, [hasStarted, playerReady]);
  ```
- `setPlayerState("hidden")` 유지 (UI는 숨기되 재생은 보장)

---

## 변경 파일 목록

| 파일 | 작업 |
|------|------|
| `src/assets/worship-atelier-logo.png` | 로고 이미지 복사 |
| `StudioHeader.tsx` | ArrowLeft 제거, 이미지 로고 적용 |
| `SpaceCanvas.tsx` | 상단 툴바 삭제, 버튼 캔버스 내 재배치, 페이지번호 하단 이동, BGM 버그 수정 |
| `StudioSidePanel.tsx` | "K-Worship Studio" → "Worship Atelier" (2곳) |
| `WorshipStudio.tsx` | 브랜드명 교체 (2곳) |
| `StudioContractPrompt.tsx` | 브랜드명 교체 |
| `AdminDashboard.tsx` | 브랜드명 교체 |
| `AdminStudio.tsx` | 브랜드명 교체 |
| `AdminNav.tsx` | 브랜드명 교체 |


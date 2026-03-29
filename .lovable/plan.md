

# SpaceCanvas 버그 수정 3건

## 1. 빌딩 패널 X 닫기 + 패널 밖 클릭 시 닫힘
**현재 문제**: 모바일 빌딩 패널은 `Sheet` 컴포넌트(Radix)를 사용 중. `SheetContent`의 기본 X 버튼이 동작해야 하나, `onOpenChange`가 이미 연결되어 있으므로 정상 동작해야 합니다. 세션 리플레이로 확인이 필요하지만, 문제는 `SheetContent`에 close 버튼이 명시적으로 없을 가능성이 있습니다.

**수정**:
- `WorshipStudio.tsx`의 Sheet: `SheetContent`에 명시적 X 버튼 추가 (SheetClose 사용)
- Sheet 오버레이 클릭 시 닫힘은 `onOpenChange`로 이미 처리됨 — 동작 확인 후 필요 시 overlay click handler 보강

## 2. BGM 플레이어 재생 안 됨
**근본 원인**: `BGMButton`에서 `startPlaylist()` 호출 후 `setPlayerState('hidden')`으로 설정. 그러나 `GlobalMusicPlayerDialog`의 비디오 로드 로직이 `playerState === 'full'`일 때만 작동:
```
if (playerReady && playerState === 'full' && ...) { sendCommand('loadVideo', ...) }
```
`hidden` 상태에서는 비디오가 로드되지 않아 재생 불가.

**수정**:
- `GlobalMusicPlayerDialog.tsx` 라인 125: 조건을 `playerState === 'full'`에서 `playerState !== 'closed'`로 변경
- 이렇게 하면 `hidden`/`mini` 상태에서도 비디오가 로드됨

## 3. Marquee Text 전체 너비 사용
**현재 문제**: `MarqueeBar`가 `rounded-full`로 고정 높이에 제한적 너비. 텍스트가 컨테이너 내에서만 스크롤.

**수정**:
- `SpaceCanvas.tsx`의 `MarqueeBar`: `rounded-full` → `rounded-md`, 부모에서 `flex-1 min-w-0`으로 남은 공간 전체 사용 (이미 `min-w-0 flex-1 mx-2`로 감싸져 있으므로 정상)
- 모바일: `px-3 pt-2` wrapper에서 `w-full`로 전체 너비 차지하도록 변경
- CSS `animate-marquee` 키프레임이 `translateX(0%) → translateX(-100%)`이므로, 텍스트가 사라지고 다시 나타나려면 텍스트를 두 번 반복하거나 `translateX(100%)` 시작점 추가 필요. 현재는 텍스트가 왼쪽으로 사라지기만 하므로, 무한 스크롤 효과를 위해 텍스트를 복제하여 연속 흐름 구현.

### 변경 파일
| 파일 | 작업 |
|------|------|
| `WorshipStudio.tsx` | Sheet에 명시적 닫기 버튼 추가 |
| `GlobalMusicPlayerDialog.tsx` | 비디오 로드 조건 `playerState !== 'closed'`로 수정 |
| `SpaceCanvas.tsx` | MarqueeBar 전체 너비 + 연속 스크롤 효과, BGM hidden 상태 처리 |


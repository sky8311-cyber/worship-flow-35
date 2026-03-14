

## 탭 클릭 안됨 수정 + 탭 순서 변경

### 문제 원인
두 컴포넌트 모두 `Tabs`에 `value={...}`로 고정값을 넣고 있어서 탭 클릭 시 상태가 변경되지 않음 (controlled mode인데 `onValueChange` 없음).

### 수정 내용

#### 1. `src/components/music-player/GlobalMusicPlayerDialog.tsx` (라인 354-355)
- `value` → `defaultValue`로 변경하여 uncontrolled mode로 전환
- 탭 순서: **플레이리스트 먼저**, 가사 두번째
- `defaultValue`는 항상 `"playlist"`

#### 2. `src/components/band-view/MusicPlayerMode.tsx` (라인 427-428)
- 동일하게 `value` → `defaultValue="playlist"`
- 탭 순서: 플레이리스트 먼저, 가사 두번째

수정 파일: 2개




## 뮤직 플레이어 가사 표시 기능

### 변경 요약
재생 중인 곡에 가사가 등록되어 있으면 뮤직 플레이어 다이얼로그에서 가사를 스크롤 가능하게 표시. 가사가 없는 곡은 기존과 동일하게 플레이리스트만 표시.

### 수정 파일

#### 1. `src/contexts/MusicPlayerContext.tsx`
- `PlaylistItem` 인터페이스에 `lyrics?: string` 필드 추가

#### 2. `src/pages/BandView.tsx`
- `musicPlaylist` 빌드 시 `setSong.lyrics || song?.lyrics` 값을 `lyrics` 필드에 포함

#### 3. `src/components/music-player/GlobalMusicPlayerDialog.tsx`
- 플레이리스트 영역을 탭 구조로 변경: **가사** / **플레이리스트** 탭
- 현재 곡에 가사가 있으면 "가사" 탭이 기본 선택, 없으면 "플레이리스트" 탭이 기본
- 가사 탭: `ScrollArea`로 감싼 `<pre>` 태그에 가사 표시 (기존 BandView 가사 스타일과 동일)
- 곡 변경 시 가사 유무에 따라 자동 탭 전환

#### 4. `src/components/band-view/MusicPlayerMode.tsx` (밴드뷰 내장 플레이어)
- 동일한 가사 표시 로직 적용 (플레이리스트 영역 위 또는 탭으로)

### UI 레이아웃 (GlobalMusicPlayerDialog)
```text
┌──────────────────────┐
│  🎵 Header / Art     │
│  Controls / Seek     │
├──────────────────────┤
│  [가사]  [플레이리스트] │  ← 탭
├──────────────────────┤
│                      │
│  가사 내용 (scroll)   │
│                      │
└──────────────────────┘
```

수정 파일: 4개


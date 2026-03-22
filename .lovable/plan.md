

## 곡 라이브러리 액션 버튼 튜토리얼 생성 + 곡 추가 튜토리얼 제거

### 개요
SongDialog의 곡 추가 튜토리얼을 제거하고, 대신 SongLibrary 페이지에서 곡 카드의 액션 버튼들을 설명하는 튜토리얼을 새로 생성합니다.

### 수정 파일 (4개)

#### 1. `src/components/tutorial/tutorialSteps.ts`
- `SONG_ADD_STEPS` 제거
- `SONG_LIBRARY_STEPS` 신규 추가 (6~7스텝):
  1. **YouTube 버튼** (`song-youtube-btn`): "YouTube 버튼을 누르면 해당 곡의 영상이 바로 열립니다"
  2. **악보 미리보기** (`song-score-btn`): "악보 버튼으로 등록된 악보를 바로 확인할 수 있습니다"
  3. **카트 담기** (`song-cart-btn`): "카트 버튼으로 여러 곡을 담은 뒤, 한번에 워십세트에 추가할 수 있습니다"
  4. **사용 내역** (`song-usage-btn`): "사용 내역 버튼으로 이 곡이 포함된 다른 워십세트를 열람할 수 있습니다"
  5. **즐겨찾기** (`song-favorite-btn`): "하트 버튼으로 즐겨찾기에 추가하세요. 상단 네비게이션의 하트 아이콘을 눌러 즐겨찾기 목록을 확인할 수 있습니다"
  6. **곡 수정** (`song-edit-btn`): "수정 버튼으로 곡 정보를 편집할 수 있습니다"

#### 2. `src/components/SongCard.tsx`
- 첫 번째 곡 카드의 각 액션 버튼에 `data-tutorial` 속성 추가:
  - YouTube 버튼 → `data-tutorial="song-youtube-btn"`
  - 악보 버튼 → `data-tutorial="song-score-btn"`
  - 카트 버튼 → `data-tutorial="song-cart-btn"`
  - 사용 내역 버튼 → `data-tutorial="song-usage-btn"`
  - 즐겨찾기 버튼 → `data-tutorial="song-favorite-btn"`
  - 수정 버튼 → `data-tutorial="song-edit-btn"`
- 단, 모든 카드에 data-tutorial이 붙으면 첫 번째 카드만 하이라이트되므로 문제 없음 (querySelector는 첫 매칭 반환)

#### 3. `src/pages/SongLibrary.tsx`
- `useTutorial` + `TutorialOverlay` import 추가
- `SONG_LIBRARY_STEPS`로 튜토리얼 훅 연결 (`key: "song-library"`, `autoStart: true`)
- 헤더에 `?` 가이드 버튼 추가 (Tooltip 포함)

#### 4. `src/components/SongDialog.tsx`
- `useTutorial`, `TutorialOverlay`, `SONG_ADD_STEPS` import 및 관련 코드 제거
- `?` 가이드 버튼 제거
- `data-tutorial` 속성들은 남겨도 무해하지만 깔끔하게 제거


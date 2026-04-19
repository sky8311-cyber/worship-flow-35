
## 작업 이해

송 라이브러리(Song Library) 페이지의 두 가지 변경:
1. 데스크탑에서도 **카드 스타일 뷰가 기본(default)** — 현재 데스크탑은 테이블 뷰가 기본인 것으로 추정
2. 카드의 **썸네일 클릭** 시 YouTube로 이동하지 말고, "편집" 버튼과 동일하게 **SongDialog 편집 다이얼로그를 열어 상세 보기**

## 탐색 필요

- `src/pages/SongLibrary.tsx` (또는 유사 경로) — 뷰 모드(card/table) 기본값 결정 로직 확인
- 카드 컴포넌트 파일 (예: `SongCard.tsx`) — 썸네일 onClick 핸들러 위치 확인
- 모바일/데스크탑 분기 로직 (useIsMobile 등) 확인

## 변경 계획

### 1) 카드 뷰를 데스크탑 기본값으로
- 뷰 모드 state 초기값을 `"card"`로 통일 (현재 데스크탑에서 `"table"`로 분기되어 있을 가능성)
- 사용자가 토글 버튼으로 테이블/카드 전환은 그대로 유지 (선택지는 남김)
- localStorage에 저장된 사용자 선호가 있다면 존중, 없을 때만 카드를 default로

### 2) 썸네일 클릭 → 편집 다이얼로그 오픈
- 카드 컴포넌트 썸네일 영역의 `onClick` (현재 `window.open(youtube_url)`)을 제거
- 대신 부모(SongLibrary)에서 받은 `onEdit(song)` 핸들러 호출 → SongDialog 오픈
- YouTube로 직접 가고 싶은 사용자를 위한 진입점은 다이얼로그 내부 YouTube 링크 + (필요 시) 카드 우측 별도 작은 ▶︎ 아이콘 유지 여부는 현 상태 유지 (불필요하면 제거 안 함, 보존)

## 영향 파일 (탐색 후 확정)
1. `src/pages/SongLibrary.tsx` — viewMode 기본값 `"card"`
2. `src/components/song-library/SongCard.tsx` (또는 동일 역할 파일) — 썸네일 onClick → `onEdit(song)`

데이터/스키마 변경 없음. 순수 UI 동작 변경.


## 송 카드 헤더 — 편집/삭제 버튼 일관성 + 우측 여백 정리

### 진단 (스크린샷 기준)
- 편집 버튼(연필): 회색 ghost icon, 작음
- 삭제 버튼(X): 빨간색, 다른 크기/스타일
- 두 버튼이 너무 다르고 정렬도 어긋남
- 모바일: 제목 길면 버튼이 밀려 넘침
- 카드 본문(키 입력, 진행설정 박스 등)이 우측에 불필요한 여백을 두고 있어 좁은 화면에서 컬럼 폭이 작아짐

### 조사 필요
1. `src/components/SetSongItem.tsx` — 송 카드 헤더 + 본문 구조, padding/margin
2. 편집 버튼 / 삭제 버튼 위치 (헤더 우측에 같이 있는지, 분리되어 있는지)
3. 진행설정 박스(`SongProgressionSettings` 또는 유사) 컨테이너 padding

### 수정 방안

**1) 우측 액션 버튼 통일**
- 편집/삭제 버튼 모두 동일 스타일: `variant="ghost" size="icon"` + `h-8 w-8`
- 색상: 편집 = `text-muted-foreground hover:text-foreground`, 삭제 = `text-muted-foreground hover:text-destructive` (hover 시에만 빨강)
- 같은 컨테이너 `flex items-center gap-1 flex-shrink-0`로 묶어 정렬 일관성 확보
- 헤더 전체: `flex items-start gap-2` + 제목 영역 `flex-1 min-w-0` (제목 길어도 버튼 안 밀림, 제목은 `truncate`)

**2) 우측 여백 제거 — 컬럼 정렬**
- 카드 본문 컨테이너의 `pr-*` (우측 패딩) 제거 또는 헤더와 동일한 padding으로 통일
- 진행설정 박스, 키 입력 영역의 `max-w-*` / 우측 margin 제거
- 컨테이너: `px-3 sm:px-4` 양쪽 균일, 우측 추가 여백 없음
- 결과: 본문 컨트롤들이 헤더 액션 버튼 우측 끝선까지 폭을 활용

### 영향 파일
- `src/components/SetSongItem.tsx` (메인)
- 필요 시 진행설정 박스 컴포넌트 (이전 수정에서 `p-2` 처리됨)

### 진행
승인 시 default 모드에서 `SetSongItem.tsx` 헤더 버튼 통일 + 본문 우측 패딩 제거. 데이터 변경 없음. iPad/모바일 재테스트 요청.

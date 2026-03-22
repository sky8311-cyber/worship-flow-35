

## 인터랙티브 튜토리얼 시스템 — 첫 접속 자동 시행

### 개요
스텝별 스포트라이트 가이드 시스템 구현. 첫 접속 시 자동으로 시작되고, 이후에는 수동 트리거 가능.

### 변경 사항

#### 1. 튜토리얼 엔진 (신규 3개)

**`src/components/tutorial/TutorialOverlay.tsx`**
- 풀스크린 반투명 backdrop (`bg-black/60 z-[80]`)
- 현재 step의 `data-tutorial` target 요소 위치를 `getBoundingClientRect()`로 계산
- CSS `clip-path` 또는 box-shadow로 spotlight 구멍 생성
- 툴팁: 제목, 설명, "X / Y", 이전/다음/닫기 버튼
- 마지막 스텝에서 "완료" 버튼

**`src/components/tutorial/useTutorial.ts`**
- `isOpen`, `currentStep`, `start()`, `next()`, `prev()`, `close()` 관리
- `close()` 시 `localStorage`에 `tutorial_seen_{key}` 저장
- `shouldAutoStart(key)` — localStorage에 기록 없으면 true 반환

**`src/components/tutorial/tutorialSteps.ts`**
- `SET_BUILDER_STEPS` (5~6스텝): 예배 정보 → 곡 추가 → 예배 요소 → 순서 변경 → 저장
- `SONG_ADD_STEPS` (4~5스텝): 곡 제목 → 미디어 → 악보 → 가사 → 저장

#### 2. SetBuilder.tsx 통합
- 주요 UI 요소에 `data-tutorial="set-*"` 속성 추가
- 페이지 마운트 시 `shouldAutoStart("set-builder")` 체크 → 자동 시작
- 헤더에 `?` 아이콘 버튼으로 수동 재시작 가능

#### 3. SongLibrary.tsx + SongDialog.tsx 통합
- SongLibrary의 "곡 추가" 버튼에 `data-tutorial` 속성
- SongDialog 열릴 때 `shouldAutoStart("song-add")` 체크 → 자동 시작
- SongDialog 내부 주요 필드에 `data-tutorial="song-*"` 속성
- 다이얼로그 헤더에 `?` 아이콘으로 수동 재시작

#### 4. 첫 접속 자동 시행 로직
- localStorage 키: `tutorial_seen_set_builder`, `tutorial_seen_song_add`
- 해당 키가 없으면 컴포넌트 마운트 후 500ms 딜레이 → 자동 시작
- 완료 또는 닫기 시 키 저장 → 다시 자동 시작 안 됨

### 수정 파일 (5개)
1. `src/components/tutorial/TutorialOverlay.tsx` — 신규
2. `src/components/tutorial/useTutorial.ts` — 신규
3. `src/components/tutorial/tutorialSteps.ts` — 신규
4. `src/pages/SetBuilder.tsx` — data-tutorial 속성 + 자동 시작 연동
5. `src/components/SongDialog.tsx` — data-tutorial 속성 + 자동 시작 연동


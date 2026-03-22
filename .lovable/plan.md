

## 곡 추가 UI 개선 (4가지 수정)

### 1. YouTube 링크 라벨 기본값을 아티스트명으로

**파일: `SmartSongFlow.tsx`** — `handleSelectYoutubeResult` (line 174-184)
- 첫 번째 YouTube 링크의 label에 `artist` 값을 기본으로 세팅 (기존에는 `t("songFlow.original")`)
- Step3에서도 첫 번째 링크의 label이 비어있으면 artist 이름을 placeholder로 표시

### 2. YouTube 링크 추가 시 placeholder 개선

**파일: `SmartSongFlow.tsx`** — Step3 라벨 placeholder (line 729)
- 현재: `t("songFlow.labelPlaceholder")` → "라벨 (예: 원곡, 라이브)"
- 변경: placeholder를 더 구체적으로: "예: 베이스 연주, 드럼 연주, 라이브 버전, 스튜디오 버전"
- `translations.ts`에 해당 키 업데이트

### 3. 악보 자동 스캔 문구 제거

**파일: `SmartSongFlow.tsx`** — line ~800 부근
- `{t("songFlow.autoScanNote")}` 라인 삭제
- `translations.ts`에서 `autoScanNote` 키 유지 (다른 곳에서 참조할 수 있으므로)

### 4. ArtistSelector 드롭다운 스크롤 수정

**파일: `ArtistSelector.tsx`** — CommandGroup (line 98)
- 현재: `<CommandGroup className="max-h-64 overflow-y-auto">` — CommandList가 이미 스크롤을 관리하므로 CommandGroup의 overflow가 충돌
- 수정: `CommandList`에 `className="max-h-64 overflow-y-auto"` 적용, `CommandGroup`에서 스크롤 관련 클래스 제거
- cmdk의 CommandList는 기본적으로 wheel scroll을 지원하므로, max-h를 CommandList 레벨에서 설정하면 wheel 스크롤 작동

### 5. X 버튼 프리즈 수정

**파일: `SongDialog.tsx`** — `handleOpenChange` (line 429-439)
- **원인**: SmartSongFlow에서 X 클릭 → `setShowCancelConfirm(true)` → AlertDialog 열림. 그런데 `Dialog`의 overlay/escape 닫기도 `handleOpenChange`를 호출하고, `hasUnsavedChanges()`가 edit form의 `formData`를 체크하여 `showCloseConfirm` AlertDialog도 열림 → 두 AlertDialog 충돌로 프리즈
- **수정**: `handleOpenChange`에서 SmartSongFlow 모드일 때 (`!song || song?.status === 'draft'`) 별도 처리 — unsaved changes 체크를 건너뛰고 SmartSongFlow 자체의 취소 확인에 위임

### 수정 파일 목록
1. `src/components/songs/SmartSongFlow.tsx` — label 기본값, placeholder 변경, autoScan 문구 제거
2. `src/components/ArtistSelector.tsx` — 스크롤 수정
3. `src/components/SongDialog.tsx` — X 버튼 프리즈 수정
4. `src/lib/translations.ts` — labelPlaceholder 업데이트


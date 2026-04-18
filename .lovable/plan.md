
사용자 확인 사항: 레거시 `song_scores` 데이터는 **DB에 그대로 보존** (기존 워십세트 보호). 단, 신규 워십세트에서는 더 이상 참조/사용하지 않음. PDF→이미지 변환 기능은 유지되어야 함.

## 최종 계획 (검증됨)

### 1. BandView.tsx — 신규 세트에서 레거시 fallback 제거
- `getScoreFilesWithFallback` fallback 체인 단축:
  - ✅ 1단계: `set_song_scores` (선택된 키 매칭)
  - ✅ 2단계: `set_song_scores` (primary)
  - ✅ 3단계: `set_songs.score_ref_url` / `private_score_file_url`
  - ❌ 4단계: `song_scores` (레거시) — **제거**
  - ❌ 5단계: `songs.score_file_url` (레거시 기본) — **제거**
- `getAvailableKeysForSong`도 `set_song_scores` 기반 키만 노출
- **레거시 데이터 보호**: DB 데이터는 그대로 두고, UI 렌더링 경로에서만 차단. 기존 레거시 세트도 깨지지 않도록 처리 (해당 세트들은 단순히 "악보 없음" 또는 사용자가 새로 추가하라는 안내가 노출됨 — DB 자체는 안전).

### 2. ScorePreviewDialog.tsx — `song_scores` 조회 제거
- 현재 `loadScoreVariations()`가 `song_scores` 테이블을 직접 조회 → **제거**
- `set_song_scores` 기반 또는 BandView에서 해결된 URL을 prop으로 받아 단순 표시
- `shouldShowOldScore` 레거시 분기 제거

### 3. SmartSongFlow / Song Library 등록 흐름
- 신규 곡 등록 시 악보 업로드 단계가 있다면 UI 안내로 변경 (악보는 워십세트에서 직접 추가하도록 유도)
- 기존 데이터는 손대지 않음

### 4. PDF → 다중 페이지 이미지 변환 검증 (변경 없음)
- `src/utils/pdfToImages.ts` (pdfjs-dist + Canvas) — **그대로 유지**
- `SetSongScoreDialog.tsx`의 업로드 탭에서 호출 경로만 코드 확인
- 실제 동작은 사용자 end-to-end 테스트로 검증

### 5. DB / 마이그레이션
- **변경 없음**. `song_scores`, `songs.score_file_url` 컬럼은 그대로 유지.
- 레거시 데이터 보존 보장.

### 6. 영향받는 파일
- `src/pages/BandView.tsx`
- `src/components/ScorePreviewDialog.tsx`
- (필요 시) `src/components/song-library/SmartSongFlow.tsx`

### 7. 검증 흐름
- 신규 워십세트 생성 → 곡 추가 → 악보 dialog → 외부 URL 또는 PDF 업로드 (다중 페이지 분할 확인) → 저장 → BandView/Preview에서 정확히 선택한 악보 렌더링
- 레거시 song_scores만 있는 곡 → "악보 없음" 안내 (DB는 안전)
- PDF 다중 페이지 업로드 → 페이지별 PNG로 분할되어 `set_song_scores`에 저장되는지 확인

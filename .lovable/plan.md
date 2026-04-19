
## 3가지 작업

### 1. 보관함 악보 삭제 기능
- `SetSongScoreDialog.tsx` "내 보관함" 탭 카드에 휴지통 아이콘 추가
- AlertDialog 확인 → `DELETE FROM user_score_vault WHERE id=? AND user_id=auth.uid()`
- `set_song_scores.vault_score_id`는 ON DELETE SET NULL이라 기존 세트 안전 (score_url은 set_song_scores에 직접 저장됨)
- 로컬 보관함 목록 + selectedScores에서 제거, toast 표시

### 2. "링크공유" vs "공유 링크 생성" 통합
**조사 필요 후 진행**: 
- 기존 "링크공유" 버튼 (다이얼로그 방식, `public_share_token` 사용 → `/public-view/:token`) 위치/동작 확인
- 새로 만든 `PrivateShareControls`의 "공유 링크 생성" (`share_token` + `band_view_visibility='link'` → `/band-view/:id?token=xxx`) 비교

**통합 방안**:
- 기존 "링크공유" 다이얼로그 UX 유지 (사용자가 선호)
- `has_private_scores=true`인 경우에만 다이얼로그 안에 "팀 전용 / 링크 공유 / 비공개로 되돌리기" 옵션 추가
- `has_private_scores=false`인 경우 기존 공개 링크 공유 그대로
- `PrivateShareControls` 별도 헤더 버튼 제거 → 기존 "링크공유" 다이얼로그에 통합
- 두 토큰 시스템(`public_share_token` vs `share_token`) 중 어떤 걸 쓸지 결정:
  - 공개 세트(has_private_scores=false): 기존 `public_share_token` + `/public-view/:token` 유지
  - 비공개 세트(has_private_scores=true): 새 `share_token` + `/band-view/:id?token=xxx` (private score 인증 필요)

### 3. 악보 미리보기 위치 이동
- SetSongScoreDialog 하단 "선택된 악보" 영역의 썸네일 클릭 시 → 기존 `ScorePreviewDialog` 열기 (레거시 미리보기 기능 재사용)
- 썸네일에 hover 시 돋보기 아이콘 표시 또는 클릭 시 바로 미리보기

### 영향 파일
- `src/components/SetSongScoreDialog.tsx` (3가지 모두)
- `src/pages/SetBuilder.tsx` (PrivateShareControls 제거)
- `src/components/set-builder/PrivateShareControls.tsx` (삭제 또는 다이얼로그 내부로 이동)
- 기존 링크공유 다이얼로그 컴포넌트 (조사 후 확인) — 옵션 추가

### ⚠️ 확인 필요
- 기존 "링크공유" 다이얼로그 정확한 컴포넌트명/위치 (SetBuilder 헤더에 있는 것)를 코드 조사 후 진행
- 기능 1, 3은 즉시 진행 가능. 기능 2는 코드 조사 결과에 따라 통합 방식 미세 조정

승인하시면 코드 조사 → 3가지 동시 구현 진행하겠습니다.

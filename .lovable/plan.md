
사용자가 BandView에서 E키 악보로 화살표를 눌렀는데 이미지가 깨져서 표시됨 (스크린샷에 깨진 이미지 아이콘 + "빛 되신 주 - Page 1" alt 텍스트만 보임).

## 원인 조사 필요

스크린샷 분석:
- "E (인도자 선택: F)" → 사용자가 E키를 선택해서 보고 있음 (인도자는 F키 선택)
- "(1/2)" → 2페이지짜리 악보
- 깨진 이미지 + "빛 되신 주 - Page 1" alt → `<img src="...">`의 src가 잘못된 URL이거나 만료된 signed URL

가능한 원인 후보:
1. **`set_song_scores`에 저장된 `score_url`이 외부 URL (예: 인터넷 검색 결과 링크)** 인데 BandView/Preview는 이를 `getSignedScoreUrl`로 통과시켜 storage signed URL로 변환하려다 실패
2. **`score_url`이 storage path는 맞지만 `scores` 버킷에 실제로 존재하지 않음** (E키는 외부 링크로만 등록되어 storage에 파일이 없음)
3. **`SignedScoreImage` retry 로직이 외부 URL에 대해 잘못 동작** (외부 URL인 경우 그냥 그대로 써야 하는데 signed URL 변환을 시도)
4. **PDF 변환 실패** — E키 악보가 PDF로 업로드됐는데 변환된 PNG 페이지가 일부만 저장됨

## 조사 계획 (READ-ONLY)

1. `src/utils/scoreUrl.ts`의 `getSignedScoreUrl` 로직 확인 — 외부 URL (http로 시작하는 풀 URL) vs storage path를 어떻게 구분하는지
2. `set_song_scores` 테이블에서 현재 세트(`fba3a4c7-5727-4a88-b89a-bc252454c839`)의 E키 row들의 `score_url` 실제 값 확인 (storage path인지 외부 URL인지)
3. `SetSongScoreDialog.tsx`의 외부 URL 등록 경로 vs PDF 업로드 경로가 `score_url`에 무엇을 저장하는지 확인
4. `SignedScoreImage`가 외부 URL을 받았을 때의 동작 확인
5. 콘솔/네트워크 로그로 실제로 어떤 URL을 요청하다 실패했는지 확인

## 가설

가장 유력: **E키 악보를 외부 검색(예: Praise.kr, 워십리더 등)에서 URL로 추가했는데**, `set_song_scores.score_url`에 외부 URL 그대로 저장됨 → `SignedScoreImage` → `getSignedScoreUrl`이 이를 storage path로 오인하고 `scores` 버킷에서 signed URL 생성 시도 → 404 또는 잘못된 URL 반환 → 이미지 깨짐.

또는: 외부 URL이 hotlink-protected라서 `<img>` 직접 로드 시 차단됨.

## 수정 방향 (조사 후 확정)

- `getSignedScoreUrl`/`SignedScoreImage`에서 URL 종류 판별:
  - `http(s)://` 외부 URL → 그대로 사용 (signed URL 변환 안 함)
  - storage path (예: `userId/setSongId/...`) → `scores` 버킷에서 signed URL 생성
- 외부 URL이 hotlink-protected인 경우 → 사용자에게 "외부 사이트에서 직접 보기" 링크 제공 또는 업로드 권유
- E키 row의 실제 `score_url` 값 확인 후 정확한 fix 결정

## 다음 단계

읽기 전용 모드라 코드/DB 조사부터 진행 필요. 사용자 승인 후 default 모드에서:
1. `src/utils/scoreUrl.ts`, `SetSongScoreDialog.tsx`의 외부 URL 저장 경로 정독
2. DB에서 해당 set의 E키 `set_song_scores.score_url` 값 확인 (Supabase select)
3. 콘솔/네트워크 로그 확인 (깨진 이미지 요청의 실제 URL & 응답)
4. URL 타입 판별 분기를 `getSignedScoreUrl`에 추가
5. 필요 시 `SetSongScoreDialog`의 외부 URL 등록 흐름에서 사용자에게 "외부 링크는 미리보기가 제한될 수 있으니 다운로드 후 업로드 권장" 안내 추가

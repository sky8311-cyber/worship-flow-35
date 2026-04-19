
## 진단: 게시된 워십셋의 악보 이미지가 안 보이는 문제

### 증상
- 라우트: `/band-view/fb2b4635-6dfd-4abb-9739-84c5c2e499fd` (이미 게시된 셋)
- 이전 세션에서 만들어진 레거시 셋들의 악보 이미지가 보이지 않음
- 사용자는 명시적으로 "레거시 시스템(저장된 악보 이미지 파일)을 건드리지 말라"고 요청했었음

### 원인 가설
오늘/최근 세션에서 악보 표시 컴포넌트(`SignedScoreImage`, `useSignedScoreUrl`, `scoreUrl` 유틸)가 도입/변경되면서 **레거시 데이터 형식**(예: 외부 URL, 다른 버킷 경로, public URL 등)을 처리하지 못하게 되었을 가능성.

특히 `extractScorePath` 함수가:
- `scores` 버킷의 경로만 추출하도록 만들어졌다면
- 레거시 셋이 다른 버킷/외부 URL/public URL을 사용했을 경우 → `null` 반환 → 서명 URL 생성 실패 → 빈 placeholder

### 조사 계획 (READ-ONLY)
1. `src/utils/scoreUrl.ts` 의 `extractScorePath` / `getSignedScoreUrl` 로직 검토 — 어떤 형식의 URL을 처리하는지
2. BandView에서 악보 렌더링하는 컴포넌트 찾기 (`SetSongScoreDisplay`, `BandView` 등) — 최근에 `<img src>` → `<SignedScoreImage>`로 바꾼 곳이 있는지
3. 해당 셋(`fb2b4635-...`)의 `set_songs.score_url` / `score_image_urls` 실제 DB 값 조회 → 어떤 형식인지 확인
4. 콘솔/네트워크 로그 확인 — 404, 403, 또는 빈 URL 요청이 있는지

### 수정 방향 (조사 후)
- `extractScorePath` 가 레거시 URL 형식(직접 public URL, 외부 호스트, 다른 버킷 등)을 인식하면 **원본 URL 그대로 반환**하도록 fallback 추가
- `SignedScoreImage` 컴포넌트가 서명 URL 생성 실패 시 **원본 src로 fallback** 렌더링
- 즉, "서명 URL 변환이 가능한 경우만 변환, 아니면 원본 그대로" 정책

### 다음 단계
승인 시 default 모드로 전환 → DB에서 해당 셋 데이터 조회 + `scoreUrl.ts` 로직 검토 → 레거시 호환 fallback 패치 적용. 기존 데이터는 절대 수정하지 않음 (코드 레벨 호환성만 추가).

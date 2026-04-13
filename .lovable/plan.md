

# Private Bucket 이후 악보 이미지 표시 오류 수정

## 문제 원인

`scores` 버킷이 private으로 전환된 후, 두 곳에서 여전히 **raw URL을 직접 사용**하고 있어 이미지가 로드되지 않음:

1. **SongDialog 악보 썸네일 + 미리보기** — `<img src={file.url}>` (서명 없는 URL)
2. **PrintOptionsDialog 인쇄 HTML** — `<img src="${score.url}">` (서명 없는 URL)

`SignedScoreImage` 컴포넌트나 `getSignedScoreUrl()` 을 사용하는 곳은 정상 작동하지만, 위 두 곳은 적용이 안 되어 있음.

## 수정 계획

### 1. SongDialog.tsx — 썸네일 + 미리보기에 SignedScoreImage 적용

**파일:** `src/components/SongDialog.tsx`

- **썸네일 (line ~1109):** `<img src={file.url}>` → `<SignedScoreImage src={file.url}>` 로 교체
- **미리보기 다이얼로그 (line ~1676):** `<img src={...url}>` → `<SignedScoreImage src={...url}>` 로 교체
- `SignedScoreImage` import 추가

### 2. PrintOptionsDialog.tsx — 인쇄 전 Signed URL 일괄 생성

**파일:** `src/components/band-view/PrintOptionsDialog.tsx`

인쇄 HTML은 별도 iframe/window에서 렌더링되므로 React 컴포넌트를 사용할 수 없음. 대신:

- `handlePrint`를 `async`로 변경
- 인쇄 HTML 생성 전에 `getSignedScoreUrls()`로 모든 악보 URL을 일괄 서명
- `generatePrintHtml`에 서명된 URL Map을 전달하여 `score.url` 대신 서명된 URL 사용
- `getSignedScoreUrls` import 추가

## 영향 범위

- SongDialog 악보 편집 화면의 썸네일 미리보기
- SongDialog 내 악보 확대 미리보기
- BandView 인쇄 기능 (악보만 / 전체 모드)


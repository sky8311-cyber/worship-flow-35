

## Admin 과목 관리 — 이미지 직접 업로드 + 사이즈 가이드

### 현재 문제
- `thumbnail_url`, `badge_image_url`, `certificate_template_url` 모두 URL 텍스트 입력만 가능
- 관리자가 직접 이미지를 업로드할 수 없음
- 이미지 권장 사이즈 안내 없음

### 해결

#### 1. 재사용 가능한 이미지 업로드 컴포넌트 생성
`src/components/institute/AdminImageUpload.tsx`

- 기존 `CommunityAvatarUpload` 패턴 참고 (Supabase Storage `profile-images` 버킷 사용)
- Props: `currentUrl`, `onUploadSuccess`, `folder` (저장 경로), `sizeGuide` (권장 사이즈 텍스트), `aspectHint` (미리보기 비율)
- UI: 현재 이미지 미리보기 + 업로드 버튼 + HelpTooltip으로 사이즈 가이드 표시
- 업로드 성공 시 public URL 반환 → 부모가 DB 업데이트

#### 2. AdminInstituteCourses.tsx 적용 (2곳)
- **Thumbnail** (line ~404): URL Input → `AdminImageUpload` 교체
  - 사이즈 가이드: "권장: 1280×720px (16:9), 최대 5MB"
  - 미리보기: aspect-video
- **Badge Image** (line ~408): URL Input → `AdminImageUpload` 교체
  - 사이즈 가이드: "권장: 400×400px (1:1), 최대 2MB"
  - 미리보기: aspect-square

#### 3. AdminInstituteCertifications.tsx 적용 (2곳)
- **Badge Image** (line ~378): URL Input → `AdminImageUpload` 교체
  - 사이즈 가이드: "권장: 400×400px (1:1), 최대 2MB"
- **Certificate Template** (line ~382): URL Input → `AdminImageUpload` 교체
  - 사이즈 가이드: "권장: 1920×1357px (A4 가로), 최대 5MB"

### 수정 파일 (3개)
1. `src/components/institute/AdminImageUpload.tsx` — 신규 생성
2. `src/components/institute/AdminInstituteCourses.tsx` — thumbnail_url, badge_image_url 필드 교체
3. `src/components/institute/AdminInstituteCertifications.tsx` — badge_image_url, certificate_template_url 필드 교체


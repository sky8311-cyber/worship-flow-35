

# OG 이미지 교체 계획

업로드된 K-Worship 브랜드 이미지를 플랫폼 전체의 OG 이미지로 교체합니다.

## 현재 상태

OG 이미지는 Supabase Storage(`og-assets` 버킷)에 호스팅되어 있으며, 아래 3곳에서 참조 중:

| 위치 | 현재 URL |
|------|----------|
| `index.html` (og:image, twitter:image) | `supabase.co/.../og-assets/og-image.jpg` |
| `og-news/index.ts` (뉴스 fallback) | `kworship.app/images/og-default.png` |
| `og-public-view/index.ts` (콘티 공유) | `kworship.app/images/og-worship-set.png` |

## 작업 내용

### Step 1: 업로드 이미지를 Supabase Storage에 업로드
업로드된 `IMG_5934.png`를 `og-assets` 버킷에 `og-image.png`로 업로드하여 기존 이미지를 교체합니다.

### Step 2: `index.html` OG 태그 URL 업데이트
`og:image`와 `twitter:image` 메타 태그의 URL을 새 이미지 경로로 변경합니다. 파일 확장자가 `.jpg`에서 `.png`로 바뀌므로 URL도 함께 수정합니다.

### Step 3: Edge Function fallback 이미지도 통일
- `og-news/index.ts`: `og-default.png` fallback → 새 OG 이미지 URL로 교체
- `og-public-view/index.ts`: 별도 이미지(`og-worship-set.png`)를 사용 중이므로, 이것도 새 이미지로 통일할지는 선택사항 (콘티 전용 이미지를 유지할 수도 있음)

### 변경 파일

| 파일 | 변경 |
|------|------|
| Supabase Storage `og-assets` 버킷 | 새 이미지 업로드 |
| `index.html` | og:image, twitter:image URL 교체 |
| `supabase/functions/og-news/index.ts` | fallback OG 이미지 URL 교체 |


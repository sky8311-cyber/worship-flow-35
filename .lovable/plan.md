

## Plan: Institute 페이지 개선

### 변경 사항 3가지

#### 1. Music Player 숨기기 — `/institute` 경로 추가
`src/components/music-player/GlobalMusicPlayer.tsx`의 `PUBLIC_ROUTES`에 `/institute`를 추가하고, `location.pathname.startsWith('/institute/')` 조건도 추가하여 Institute 내 모든 페이지에서 뮤직 플레이어를 숨긴다.

#### 2. 폰트 크기 + 레이아웃 개선 — `Institute.tsx`
현재 폰트가 전반적으로 작음 (섹션 헤더 9px, 과목명 13px, 메타 11px 등). 다른 페이지와 맞추기 위해:

- 섹션 헤더 텍스트: `9px` → `11px`
- Certification 카드 제목: `13px` → `15px`, 메타: `11px` → `12px`, 태그: `9px` → `10px`, 이모지: `26px` → `32px`, 카드 min-width: `175px` → `200px`, padding 증가
- 과목 카드 제목: `13px` → `15px`, 강사명: `11px` → `12px`, 진행률: `10px` → `11px`, 수료증 배지: `9px` → `10px`
- 썸네일: `46x46` → `52x52`
- 카드 padding: `14px 16px` → `16px 18px`, gap: `14px` → `16px`
- courseList gap: `8px` → `10px`
- 빈 상태 텍스트: `13px` → `14px`, padding 증가
- 페이지 padding: `20px` → `24px`
- certScroll gap: `12px` → `14px`, marginBottom: `24px` → `28px`
- 섹션 간 spacing 추가 (certifications 섹션 marginBottom)
- chevron: `16px` → `20px`

#### 3. 헤더 로고 교체 — `InstituteLayout.tsx`
텍스트 워드마크를 `src/assets/kworship-institute-logo.png` 이미지로 교체. 헤더 내 가운데 정렬. 구조:
- 왼쪽: 빈 공간 (또는 하위 페이지에서 뒤로가기)
- 가운데: 로고 이미지 (height ~32px)
- 오른쪽: ProfileDropdownMenu

`justify-between` 유지하되 3-column flex 구조로 변경하여 로고를 가운데 배치.

### 수정 파일
| 파일 | 변경 |
|------|------|
| `src/components/music-player/GlobalMusicPlayer.tsx` | `/institute` 경로 추가 |
| `src/pages/Institute.tsx` | 폰트 크기, spacing, 레이아웃 전반 업사이징 |
| `src/layouts/InstituteLayout.tsx` | 로고 이미지 가운데 정렬 |


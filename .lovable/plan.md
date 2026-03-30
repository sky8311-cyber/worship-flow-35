

# 뮤직필 + 빌딩 아이콘 + 페이지 내비 바 통일 디자인

현재 MusicPill은 `h-10` (40px), 빌딩 아이콘은 `h-12` (48px), 페이지 내비 바는 `py-2`로 각각 다른 높이. 모두 MusicPill 높이(h-10, 40px) 기준으로 통일.

## 변경 내용

### 1. MusicPill 모양 변경 (`MusicPill.tsx`)
- `left-4 rounded-full` → `left-0 rounded-r-xl` (왼쪽 스크린에 붙이고, 빌딩 아이콘과 같은 라운드 코너)
- `bottom-16` → `bottom-2` (빌딩 아이콘과 같은 위치, 빌딩 위에 쌓임)
- 높이 `h-10` 유지 (기준)

### 2. 빌딩 아이콘 높이 축소 (`WorshipStudio.tsx`)
- `h-12 w-14` → `h-10 w-14` (MusicPill과 동일 높이)

### 3. 페이지 내비 바 컴팩트화 (`WorshipStudio.tsx`)
- `py-2` → `py-1` + 높이를 `h-10`으로 제한하여 MusicPill과 동일 높이
- `bottom-2` 마진 유지

### 4. 뮤직필과 빌딩 아이콘 겹침 처리
- 빌딩 아이콘은 `bottom-2`, 뮤직필은 빌딩 위에 배치 → `bottom-12` (빌딩 높이 40px + 간격)

## 변경 파일
- `src/components/music-player/MusicPill.tsx`
- `src/pages/WorshipStudio.tsx`


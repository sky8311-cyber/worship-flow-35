# 모바일 레이아웃 겹침 해결 + 뮤직필 복구 + 빌딩 아이콘 위치 수정

## 문제 3가지

1. **Bottom nav + 미니플레이어 + 페이지 내비 겹침**: 미니플레이어(`bottom-14`)와 플로팅 페이지 내비(`bottom-4`)가 겹침
2. **MusicPill 사라짐**: 스튜디오 페이지가 `z-50`인데 MusicPill이 `z-40`이라 뒤에 가려짐
3. **빌딩 아이콘 위치/크기**: 현재 `bottom-20 w-12 h-12`로 nav bar와 분리되어 있음 → nav bar 바로 위, 같은 높이/크기로 조정

## 수정 계획

### 1. BottomTabNavigation 높이 축소

- `h-14` → `h-12` (48px)로 축소하여 하단 공간 확보

### 2. GlobalMiniPlayer 위치 조정

- `bottom-14` → `bottom-12`로 변경 (nav 높이 축소에 맞춤)

### 3. 플로팅 페이지 내비 위치 조정 (WorshipStudio.tsx)

- 미니플레이어 활성화 시 겹치지 않도록 `bottom-4` → `bottom-28` (mini player + nav 위)로 올림
- 미니플레이어 비활성화 시 `bottom-16` (nav 위)

### 4. MusicPill z-index 복구 (MusicPill.tsx)

- `z-40` → `z-[55]`로 올려서 스튜디오 `z-50` 위에 표시되도록 함
- 위치도 `bottom-32` → `bottom-16`으로 nav 바로 위에 배치

### 5. 빌딩 아이콘을 bottom nav와 같은 위치/크기로 (WorshipStudio.tsx)

- 현재: `fixed bottom-20 left-4 w-12 h-12 rounded-full`
- 변경: `fixed bottom-0 left-4 z-[55] h-12` — nav bar와 같은 높이에, 같은 사이즈로 배치
- `paddingBottom: env(safe-area-inset-bottom)`도 적용

## 변경 파일

- `src/components/layout/BottomTabNavigation.tsx` — 높이 축소
- `src/components/music-player/GlobalMiniPlayer.tsx` — bottom 위치 조정
- `src/components/music-player/MusicPill.tsx` — z-index + 위치 수정
- `src/pages/WorshipStudio.tsx` — 빌딩 버튼 위치/크기 + 페이지 내비 위치 조정
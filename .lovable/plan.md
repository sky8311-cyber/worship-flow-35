

# 탑 네비게이션과 공간 탭 사이 구분선 제거

## 변경 사항

### 1. AppHeader — 하단 border 제거
`src/components/layout/AppHeader.tsx` (line 102):
- `border-b border-border/50` 제거

### 2. SpaceTabBar — 상단 배경/border 정리 (선택)
`src/components/worship-studio/spaces/SpaceTabBar.tsx` (line 83):
- 컨테이너의 `border-b border-[#d0c8bc]`는 탭과 캔버스 구분이므로 유지
- 탭 바 자체와 헤더 사이 시각적 끊김이 없도록 확인

## 파일
1. `src/components/layout/AppHeader.tsx` — `border-b border-border/50` 제거
2. (필요시) `src/components/worship-studio/spaces/SpaceTabBar.tsx` — 탭 바 상단 여백/배경 조정




# 로고 교체 + 페이지 네비 바 플로팅 전환

## 1. 로고 SVG 교체 & 사이즈 조정
- `src/assets/worship-atelier-logo.svg` → 업로드된 `worship_atelier_final_v2.svg`로 교체
- `StudioHeader.tsx`: `h-28` → `h-16`

## 2. 페이지 네비게이션 바를 플로팅 바텀 바로 이동

현재 구조: 페이지 넘김 바가 `SpaceCanvas` 컴포넌트 내부 하단에 존재 (3단 프레임 안).

변경: 페이지 넘김 UI를 `WorshipStudio.tsx` 레벨로 끌어올려 전체 레이아웃 위에 플로팅.

### 변경 파일

| 파일 | 작업 |
|------|------|
| `src/assets/worship-atelier-logo.svg` | 새 SVG로 교체 |
| `src/components/worship-studio/StudioHeader.tsx` | `h-28` → `h-16` |
| `src/components/worship-studio/spaces/SpaceCanvas.tsx` | 하단 네비 바 JSX 제거, `pageIndicator`/`canGoNext`/`canGoPrev`/`navigatePage`/`handleAddPage` 등을 props로 노출하거나, 부모가 직접 계산 |
| `src/pages/WorshipStudio.tsx` | 플로팅 바텀 바 컴포넌트 추가 — `fixed bottom-4 left-1/2 -translate-x-1/2 z-40` 스타일, 반투명 배경 + 라운딩 |
| `src/components/worship-studio/StudioMainPanel.tsx` | 페이지 상태(`currentPage`, `pageCount`, 네비게이션 함수)를 상위로 전달하는 콜백 추가 |

### 플로팅 바 디자인
- 가운데 정렬, 좌측에 페이지 번호 + 새 페이지 버튼, 우측에 ◀▶
- `rounded-full bg-background/90 backdrop-blur-sm border shadow-sm px-4 py-2`
- 데스크톱/모바일 동일 위치 (화면 하단 중앙)
- 모바일 미니플레이어/FAB 등과 겹치지 않도록 `bottom-20` 정도 조정

### 상태 흐름
현재 `currentPage`와 `onPageChange`는 `StudioMainPanel`에서 `useState`로 관리 → `SpaceCanvas`로 전달. 이 상태를 `WorshipStudio.tsx`로 끌어올리거나, `StudioMainPanel`이 플로팅 바에 필요한 정보(pageCount, canGoNext 등)를 콜백으로 올려줘야 함.

가장 깔끔한 방법: `currentPage`/`onPageChange` 상태를 `WorshipStudio.tsx`로 리프트하고, `pageCount`/`isEditMode`/`isOwner` 등도 올려서 플로팅 바를 `WorshipStudio` 내에서 직접 렌더.




# 9가지 개선 사항 구현 계획

## 1. BGM 선택기 전체 곡 리스트 표시
**파일:** `src/components/worship-studio/StudioBGMSelector.tsx`
- `.limit(50)` 제거 또는 `.limit(500)`으로 변경
- ScrollArea 높이를 `h-48` → `h-64`로 확대
- 검색 없이도 전체 곡이 표시되도록 수정

## 2. 설정의 공간관리 아이콘/색깔을 생성 다이얼로그와 일치시키기
**파일:** `src/components/worship-studio/StudioSettingsDialog.tsx`
- 현재 `ICONS` (10개) → `SpaceCreateDialog`의 `ICON_CATEGORIES` (30개, 카테고리별 분류) 방식으로 교체
- 현재 `COLORS` (10개) → `SpaceCreateDialog`의 `COLOR_SWATCHES` (10개, 다른 색상 세트) 로 통일
- 카테고리 라벨 (예배/신앙, 일상/감성, 폴더/시스템) 포함

## 3. 공간탭에 비공개/친구 배지 추가
**파일:** `src/components/worship-studio/spaces/SpaceTabBar.tsx`
- `useStudioSpaces`에서 가져온 `space.visibility` 확인
- `"private"` → 작은 "비공개" 배지, `"friends"` → "친구만" 배지 표시
- `"public"` → 배지 없음
- 탭 이름 옆에 `text-[8px]` 크기의 배지

## 4. 블록 삭제 버튼 (쓰레기통 아이콘)
**파일:** `src/components/worship-studio/spaces/SpaceBlock.tsx`
- Props에 `onDelete` 콜백 추가
- **비편집 모드**: 마우스 hover 시 우측 상단 코너에 쓰레기통 아이콘 표시 → 클릭 시 즉시 삭제
- **편집 모드**: 모든 블록에 항상 우측 상단 코너에 쓰레기통 아이콘 표시
- `useState`로 hover 상태 관리, `onPointerEnter`/`onPointerLeave` 사용

**파일:** `src/components/worship-studio/spaces/SpaceCanvas.tsx`
- `useDeleteBlock` import 및 `handleDeleteBlock` 함수 생성
- `SpaceBlock`에 `onDelete` prop 전달

## 5. 캔버스 상단 버튼 바 일관성 개선
**파일:** `src/components/worship-studio/spaces/SpaceCanvas.tsx`
- 모든 버튼을 동일한 pill 스타일로 통일: `rounded-full`, `px-2.5 py-1`, `text-[11px]`
- 편집 버튼도 같은 스타일 적용
- 방명록 버튼을 이웃추가 버튼과 동일한 디자인으로 확인/수정
- **설정 아이콘을 맨 오른쪽으로 이동**: 버튼 바를 `justify-between`으로 변경하거나, 설정을 별도 `absolute right-3`으로 배치
- 버튼 순서: BGM | 이웃추가 | 편집(저장/취소) | 방명록 | (공간) ... | ⚙️설정(맨 우측)

## 6. 방문 버튼 → 문 열림 애니메이션 홈 아이콘
**파일:** `src/components/worship-studio/StudioUnit.tsx`
- "방문" 텍스트 제거, 아이콘으로 대체
- 기본: `DoorClosed` 아이콘 (lucide-react)
- 마우스 hover 시: `DoorOpen` 아이콘으로 전환 (CSS transition으로 부드러운 전환)
- `useState`로 hover 상태 관리

## 7. 페이지 삭제 기능 추가
**파일:** `src/components/worship-studio/spaces/SpaceCanvas.tsx`
- 편집 모드일 때 각 페이지 우측 상단에 "🗑️ 삭제" 버튼 표시
- `renderPage` 함수 내에 조건부 렌더링
- 클릭 시: 해당 페이지의 모든 블록 삭제 + `page_count - 1` 업데이트
- 최소 1페이지는 유지 (1페이지일 때 삭제 비활성화)

**파일:** `src/components/worship-studio/StudioMainPanel.tsx`
- `handleDeletePage(pageNum)` 함수 생성 → SpaceCanvas에 prop 전달
- 해당 페이지 블록 삭제 + 이후 페이지 블록들의 `page_number` 재조정

## 8. 페이지 넘김 애니메이션 개선
**파일:** `src/components/worship-studio/spaces/SpaceCanvas.tsx`
- 현재: 단순 translate + opacity fade (350ms)
- 개선: 3D perspective 회전 효과 (책 페이지 넘기는 느낌)
  - `perspective(1200px) rotateY()`로 페이지 넘김 효과
  - 그림자가 동적으로 변하는 효과 추가
  - duration 400ms

## 9. 두 페이지 가운데 접힘 디자인 개선
**파일:** `src/components/worship-studio/spaces/SpaceCanvas.tsx`
- 현재: `w-3` div에 단순 linear-gradient
- 개선: 더 섬세한 책 바인딩 효과
  - 중앙에 미세한 세로선 (spine)
  - 양쪽으로 미세한 곡면 그림자
  - `box-shadow: inset` 여러 겹으로 깊이감 추가
  - 폭을 `w-4`로 약간 확대

## 10. 페이지 추가 단위: 2 → 1
**파일:** `src/components/worship-studio/StudioMainPanel.tsx`
- `page_count: activePageCount + 2` → `page_count: activePageCount + 1`

---

## 파일 변경 요약

| 파일 | 변경 |
|------|------|
| `StudioBGMSelector.tsx` | limit 제거, ScrollArea 확대 |
| `StudioSettingsDialog.tsx` | 아이콘/색깔 피커를 SpaceCreateDialog과 동일하게 |
| `SpaceTabBar.tsx` | 비공개/친구 배지 추가 |
| `SpaceBlock.tsx` | hover/편집 시 삭제 버튼 추가 |
| `SpaceCanvas.tsx` | 버튼바 일관성, 페이지 삭제, 애니메이션 개선, 바인딩 디자인 |
| `StudioUnit.tsx` | 방문 → 문 열림 아이콘 애니메이션 |
| `StudioMainPanel.tsx` | 페이지 삭제 로직, +1 페이지 |


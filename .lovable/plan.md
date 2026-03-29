

# 모바일 워크플로우 개선 + 탭 바 정리 + 캔버스 스크롤 비활성화

## 변경 사항 요약

### 1. 모바일 FAB 아이콘/텍스트 동적 변경
**파일:** `src/components/worship-studio/StudioMainPanel.tsx`
- 현재: 편집 모드일 때만 FAB(+) 표시
- 변경: 편집 모드에서 항상 FAB 표시. `selectedBlockId` 유무에 따라:
  - 선택 없음 → `Plus` 아이콘 + "블록 추가" 텍스트 (아래 작게)
  - 선택 있음 → `Pencil` 아이콘 + "블록 수정" 텍스트 (아래 작게)
- FAB 아래에 `text-[9px]` 라벨 추가 (`flex-col` 레이아웃)

### 2. 블록 드래그 핸들을 좌측 → 상단으로 이동
**파일:** `src/components/worship-studio/spaces/SpaceBlock.tsx`
- 현재: 왼쪽 외부에 세로 `GripVertical` 핸들
- 변경: 상단 외부에 가로 핸들 배치
  - `top: -handleH`, `left: 0`, `width: 100%`, `height: handleH` (20~24px)
  - `GripVertical` → `GripHorizontal` 아이콘
  - `rounded-l-md` → `rounded-t-md`
  - `borderLeftWidth` 스타일 제거, 대신 `borderTopWidth: 4px` + `borderTopColor: color` (비편집 모드)

### 3. 탭 바에서 DnD 드래그 정렬 제거
**파일:** `src/components/worship-studio/spaces/SpaceTabBar.tsx`
- `DndContext`, `SortableContext`, `useSortable` 관련 코드 모두 제거
- `SortableTab` → 일반 탭 컴포넌트로 변경 (transform/listeners 제거)
- `ContextMenu` 래퍼도 제거 (우클릭 버그 해결 + 설정이 스튜디오 설정으로 이동)
- 방명록 버튼도 탭 바에서 제거 (캔버스 컨트롤로 이동)

### 4. 스튜디오 설정에 "공간 탭 관리" 섹션 추가
**파일:** `src/components/worship-studio/StudioSettingsDialog.tsx`
- 기존 내용(공개 설정, BGM) 아래에 "공간 관리" 섹션 추가
- 각 공간을 리스트 형태로 표시: 아이콘 | 이름 | 공개/비공개/친구 배지
- 드래그 정렬 (dnd-kit sortable, 세로 리스트)
- 각 공간 클릭/확장 시: 아이콘 픽커, 색깔 픽커, 공개 설정 (radio), 방명록 활성화 (switch)
- Props에 `spaces` 데이터 + `reorderSpaces`/`updateSpace` 뮤테이션 전달 필요
  - `StudioSettingsDialog`에서 `useStudioSpaces(room.id)`, `useUpdateSpace()`, `useReorderSpaces()` 직접 호출

### 5. 방명록 버튼을 캔버스 컨트롤 영역으로 이동
**파일:** `src/components/worship-studio/spaces/SpaceCanvas.tsx`
- 편집 버튼 오른쪽에 방명록 버튼 추가
- 이웃추가 버튼과 동일한 스타일 (rounded-full pill)
- Props에 `guestbookEnabled`, `onOpenGuestbook`, `guestbookCount` 추가
- `StudioMainPanel.tsx`에서 guestbook 데이터를 SpaceCanvas로 전달

### 6. 캔버스 수직 스크롤 비활성화
**파일:** `src/components/worship-studio/spaces/SpaceCanvas.tsx`
- 컨테이너에 `overflow-hidden` 유지 (현재도 설정됨)
- 내부 페이지 영역에 `overflow-y: hidden` 명시적 추가

## 파일 변경 목록

| 파일 | 작업 |
|------|------|
| `StudioMainPanel.tsx` | FAB 동적 아이콘/텍스트, 방명록 데이터를 SpaceCanvas로 전달 |
| `SpaceBlock.tsx` | 드래그 핸들 좌측→상단, 선택 인디케이터 상단 |
| `SpaceTabBar.tsx` | DnD 제거, ContextMenu 제거, 방명록 버튼 제거 |
| `StudioSettingsDialog.tsx` | 공간 관리 섹션 추가 (정렬, 아이콘/색/공개/방명록) |
| `SpaceCanvas.tsx` | 방명록 버튼 추가, 스크롤 비활성화 확인 |


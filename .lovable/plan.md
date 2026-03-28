

# Phase I — 5가지 개선 구현 계획

## 1. 아파트 타워 비주얼 (StudioSidePanel.tsx)

**현재**: 평범한 `bg-gradient-to-b from-slate-50` 배경의 사이드바
**변경**: 하늘 배경 + 구름 장식 + 건물 본체 컨테이너 + 도로 바

파일: `src/components/worship-studio/StudioSidePanel.tsx`

- 최외곽 div를 하늘 그라데이션(`#87CEEB → #b8d9f0 → #daeeff`)으로 변경
- `!collapsed` 시 구름 이모지 3개를 `absolute`로 배치 (클릭 불가, select-none)
- 건물 본체: `absolute bottom-6 left-0 right-0 top-[28px]` — 기존 bg-gradient 유지, `rounded-t-xl`, 좌측 border에 `#b8902a` 그림자
- 기존 ScrollArea + PH/Friends/Ambassadors를 건물 본체 안으로 이동
- 맨 아래 도로 바: `absolute bottom-0 h-6 bg-[#555]`, 중앙 점선, 🚗 이모지
- `collapsed=true`: 구름 숨김, 도로 유지, 건물 본체는 기존 아이콘 모드 그대로
- `isSheet` 모드: 하늘/구름/도로 장식 없이 기존처럼 동작 (모바일 Sheet에서는 불필요)

## 2. 새 공간 만들기 자동 팝업 1회 제한 (SpaceTabBar.tsx)

**현재**: `spaces.length === 0 && roomId && isOwner`이면 매번 `setCreateOpen(true)` (line 150)
**변경**: localStorage 체크 추가

파일: `src/components/worship-studio/spaces/SpaceTabBar.tsx` (line 149-151)

```tsx
useEffect(() => {
  if (spaces.length === 0 && roomId && isOwner) {
    const key = `kworship-studio-setup-seen-${roomId}`;
    if (!localStorage.getItem(key)) {
      setCreateOpen(true);
      localStorage.setItem(key, 'true');
    }
  }
}, [spaces.length, roomId, isOwner]);
```

roomId별로 키를 분리하여, 다른 스튜디오 방문 시에는 영향 없음.

## 3. 블록 편집 모드 (Edit Mode)

**현재**: 블록 드래그/리사이즈 시 매번 Supabase 호출 (500ms debounce지만 여전히 느림)
**변경**: Edit Mode 토글 → 로컬 상태로만 드래그/리사이즈 → 저장 버튼으로 일괄 커밋

### 3A. StudioMainPanel.tsx
- `isEditMode` state 추가, SpaceCanvas와 SpaceBlockPicker에 전달
- `isEditMode=true`일 때만 우측 패널 표시 (기존 `rightPanelOpen` 제거하거나 editMode와 연동)

### 3B. SpaceCanvas.tsx
- `isEditMode` prop 추가
- `pendingUpdates: Map<string, Partial<SpaceBlockType>>` state 추가 (블록별 로컬 변경)
- 편집 모드 토글 버튼 (✏️ 편집 / 💾 저장 / 취소) — 캔버스 우측 상단 absolute
- `isEditMode=false`: `handleUpdateBlock`이 즉시 Supabase 호출 (기존 동작, 콘텐츠 편집용)
- `isEditMode=true`: pos/size 변경은 `pendingUpdates`에만 저장
- 저장: pendingUpdates를 순회하며 `updateBlock.mutate()` 일괄 호출 후 초기화
- 취소: pendingUpdates 초기화
- 블록 렌더링 시 `pendingUpdates[block.id]`로 pos/size 오버라이드

### 3C. SpaceBlock.tsx
- `isEditMode` prop 추가
- `isEditMode=false`이면 드래그 핸들/리사이즈 핸들 비활성화 (onPointerDown에서 early return)
- 콘텐츠 편집(BlockRenderer)은 editMode와 무관하게 항상 작동

## 4. 블록 피커 아이콘 크기 개선 (SpaceBlockPicker.tsx)

**현재**: `h-5 w-5` 아이콘, `p-3` 버튼, `grid-cols-3`
**변경**:

파일: `src/components/worship-studio/spaces/SpaceBlockPicker.tsx`

- 각 버튼: `p-3` → `p-3 w-16 h-16` (명시적 크기)
- 아이콘: `h-5 w-5` → `h-7 w-7`
- hover 효과 강화: `hover:bg-amber-50 hover:border-amber-200`
- 아이콘에 `group-hover:scale-110 transition-transform` 추가
- 레이블: `text-[10px]` → `text-[10px] font-medium`
- `grid-cols-3 gap-2` → `grid-cols-3 gap-2.5`

## 5. 유튜브 블록 버그 수정 (YoutubeBlock.tsx)

**현재 문제**: URL 에러 시 블록이 고착(선택/이동 불가)
**원인 분석**: iframe의 onPointerDown `e.stopPropagation()`이 에러 상태에서도 이벤트를 삼킴

파일: `src/components/worship-studio/spaces/blocks/YoutubeBlock.tsx`

- `onError` state 추가 → iframe 로드 실패 시 fallback UI 표시
- 유효하지 않은 URL일 때 에러 메시지 표시 (`content?.url`이 있지만 videoId가 null)
- iframe의 `onPointerDown` stopPropagation은 유지하되, 에러/빈 상태에서는 iframe 자체가 렌더링되지 않으므로 문제 없음
- 블록 전체를 `div`로 감싸서 부모 드래그 핸들이 항상 잡힐 수 있도록 보장

---

## 수정 파일 요약

| 파일 | 변경 내용 |
|---|---|
| `StudioSidePanel.tsx` | 하늘 배경 + 구름 + 건물 컨테이너 + 도로 바 |
| `SpaceTabBar.tsx` | 새 공간 팝업 localStorage 1회 제한 |
| `StudioMainPanel.tsx` | isEditMode state + 하위 전달 |
| `SpaceCanvas.tsx` | 편집 모드 토글 UI + pendingUpdates 로컬 상태 |
| `SpaceBlock.tsx` | isEditMode prop, 비편집 시 드래그 비활성화 |
| `SpaceBlockPicker.tsx` | 아이콘/버튼 크기 확대 |
| `YoutubeBlock.tsx` | 에러 핸들링 + fallback UI |


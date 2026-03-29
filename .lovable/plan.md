

# 스튜디오 다이어리 페이지 시스템 + SpaceTabBar 개선

## 요약
1. Marquee 텍스트 완전 삭제
2. 확대/축소 기능 완전 삭제
3. 무한 캔버스 → 고정 크기 페이지 시스템 전환
4. SpaceTabBar 스크롤 비활성화 + 좌우 스와이프(Instagram stories 방식)
5. 모바일 1페이지, 데스크톱 2페이지 책 펼침 레이아웃
6. 페이지 넘김 애니메이션 + 페이지 번호 표시

---

## 1. 삭제 항목

### Marquee 완전 삭제
| 파일 | 삭제 내용 |
|------|----------|
| `StudioSettingsDialog.tsx` | marquee state 4개, UI 섹션 (라인 85-148), handleSave에서 marquee 필드 |
| `SpaceCanvas.tsx` | `MarqueeBar` 컴포넌트, marquee props 4개, 툴바 내 marquee 렌더링 |
| `StudioMainPanel.tsx` | marquee props 4개, SpaceCanvas 전달 부분 |
| `WorshipStudio.tsx` | marquee props 4개 전달 부분 |
| `useWorshipRoom.ts` | `useUpdateRoom`에서 marquee 필드 4개 |

### 확대/축소 완전 삭제
| 삭제 대상 (SpaceCanvas.tsx) |
|---|
| `zoom` state, `fitZoom` callback, `ResizeObserver` |
| 줌 버튼 UI (ZoomIn, ZoomOut, Maximize2 아이콘 및 버튼들) |
| `transform: scale(zoom)` 스타일 |

---

## 2. DB 변경

```sql
ALTER TABLE public.space_blocks ADD COLUMN page_number integer NOT NULL DEFAULT 0;
ALTER TABLE public.studio_spaces ADD COLUMN page_count integer NOT NULL DEFAULT 2;
```

- 기존 블록 → `page_number = 0` (첫 페이지)
- 기존 공간 → `page_count = 2` (기본 2페이지)

---

## 3. SpaceTabBar 개선

**현재**: `overflow-x-auto` (브라우저 스크롤바)
**변경**: `overflow-hidden` + 터치 스와이프 / 드래그로 좌우 이동 (Instagram stories 방식)

- 수직 스크롤 완전 차단 (`overflow-y: hidden`)
- 수평 이동은 touch swipe / mouse drag로 처리
- 데스크톱과 모바일 동일한 UX
- 탭이 넘치면 좌우 스와이프로 나머지 탭 접근

구현: `useRef` + `onTouchStart/Move/End` + `onMouseDown/Move/Up` → `scrollLeft` 직접 조작, CSS `overflow: hidden`, `scrollbar: none`

---

## 4. 페이지 시스템 (SpaceCanvas 전면 재구현)

### 페이지 크기
- 너비: `CANVAS_WIDTH = 430px` 유지
- 높이: 컨테이너의 사용 가능한 높이에 맞춤 (동적 `calc`, 더 이상 늘어나지 않음)

### 모바일 뷰
```text
┌──────────────┐
│ 1/3    [BGM] │  ← 상단: 페이지번호(좌), 액션버튼(우)
├──────────────┤
│              │
│   Page 1     │  ← 뷰포트 크기에 맞춘 단일 페이지
│              │
├──────────────┤
│        [◀][▶]│  ← 하단 우측: 이전/다음
└──────────────┘
```

### 데스크톱 뷰
```text
┌────────────┬────────────┐
│ 1-2/6 [BGM]│  [Edit][⚙] │  ← 상단 툴바
├──────┬─┬───┴────────────┤
│      │ │                │
│ Pg 1 │▒│ Pg 2           │  ← 2페이지 + 가운데 fold shadow
│      │ │                │
├──────┴─┴────────────────┤
│                  [◀][▶] │  ← 하단 우측
└─────────────────────────┘
```

- 가운데 fold: 세로 `div` with `box-shadow` + 미세 gradient (책 접힘 효과)
- 2페이지씩 넘김 (데스크톱), 1페이지씩 넘김 (모바일)

### 페이지 넘김 애니메이션
- CSS `transition: transform 0.4s ease` + `translateX` 기반 슬라이드
- 현재 페이지 세트가 좌로 밀리고 새 페이지 세트가 우에서 진입

### 페이지 추가 (편집 모드)
- 편집 모드에서 "새 페이지 +" 버튼 → `page_count += 1`
- 무제한 추가 가능

### 블록 생성 시 `page_number` 전달
- 현재 보고 있는 페이지 번호를 `useCreateBlock`에 전달

---

## 5. SpaceBlockPicker 조정

데스크톱 `grid-cols-3` → `grid-cols-2` (2페이지 책 + 사이드 패널 공간 확보)

---

## 변경 파일 목록

| 파일 | 작업 |
|------|------|
| **Migration SQL** | `space_blocks.page_number`, `studio_spaces.page_count` 추가 |
| `SpaceCanvas.tsx` | 전면 재구현: marquee/zoom 삭제, 고정 높이 페이지 시스템, 책 펼침 레이아웃, 페이지 네비게이션, 애니메이션 |
| `SpaceTabBar.tsx` | `overflow-x-auto` → hidden + touch/mouse swipe 구현 |
| `StudioMainPanel.tsx` | marquee props 삭제 |
| `WorshipStudio.tsx` | marquee props 삭제 |
| `StudioSettingsDialog.tsx` | marquee 설정 섹션 삭제 |
| `useWorshipRoom.ts` | marquee 업데이트 필드 삭제 |
| `useStudioSpaces.ts` | `StudioSpace` 타입에 `page_count` 추가, 페이지 수 업데이트 mutation |
| `useSpaceBlocks.ts` | 블록 생성 시 `page_number` 지원, `SpaceBlock` 타입에 `page_number` 추가 |
| `SpaceBlockPicker.tsx` | 데스크톱 grid 3열 → 2열 |
| `tailwind.config.ts` | `page-slide` keyframe 추가 (필요 시) |


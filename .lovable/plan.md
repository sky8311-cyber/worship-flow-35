

## Worship Studio — Mobile Optimization

### Problems Identified

1. **CanvasEditor**: Right panel (280px) is completely hidden on mobile — no way to add blocks or edit properties
2. **CanvasHeader**: Stage selector buttons + publish button + title input all squeeze into one row on 430px viewport — overflows
3. **StudioBoardView**: 3-column board grid renders as single column on mobile but columns are too cramped
4. **StoryBar**: Works well (horizontal scroll), no changes needed
5. **Tab bar**: 4 tabs (with Discover on mobile) + "새 블록" button compete for space in 430px
6. **CanvasBlockList**: Empty state says "오른쪽 패널에서 블록을 추가하세요" — misleading on mobile since panel is hidden
7. **SortableCanvasBlock**: Drag handle uses hover (invisible on touch devices)

### Changes

#### 1. CanvasEditor — Mobile Bottom Sheet for Right Panel
- On mobile, add a floating "+" button (bottom-right, `bg-[#b8902a]`) that opens a bottom drawer/sheet
- The sheet contains the same content as `CanvasRightPanel` (add blocks grid + selected block properties)
- Update empty state text on mobile: "하단 + 버튼으로 블록을 추가하세요" / "Tap + below to add blocks"

#### 2. CanvasHeader — Mobile Layout
- On mobile, split into two rows:
  - Row 1: Back button + title input + publish button
  - Row 2: Stage selector pills (full width, centered)
- Publish button: icon-only on mobile (`<Send />` without text)

#### 3. StudioMainPanel Tab Bar — Mobile Compact
- On mobile, hide tab text labels and show icons only (already small but the "새 블록" button text can shrink)
- "새 블록" button: icon-only (`<Plus />`) on mobile with a round shape

#### 4. SortableCanvasBlock — Touch-Friendly
- On mobile, always show drag handle (remove `opacity-0 group-hover:opacity-100`)
- Add touch sensor alongside pointer sensor in `CanvasBlockList` for better mobile DnD
- Delete button: always visible on mobile too

#### 5. StudioBoardView — Mobile Horizontal Scroll
- On mobile, render columns as horizontal scroll (each column min-width ~260px) instead of stacked vertically
- This gives the "kanban wall" feel on mobile

### Files Modified
- `src/pages/CanvasEditor.tsx` — mobile FAB + bottom sheet
- `src/components/worship-studio/canvas/CanvasHeader.tsx` — 2-row mobile layout
- `src/components/worship-studio/canvas/CanvasBlockList.tsx` — touch sensor + mobile empty state
- `src/components/worship-studio/canvas/SortableCanvasBlock.tsx` — always-visible handles on mobile
- `src/components/worship-studio/StudioMainPanel.tsx` — compact mobile tab bar
- `src/components/worship-studio/StudioBoardView.tsx` — horizontal scroll on mobile

### Technical Details
- Use `@dnd-kit/core` `TouchSensor` alongside `PointerSensor` with `activationConstraint: { delay: 250, tolerance: 5 }` for mobile
- Bottom sheet uses shadcn `Drawer` component (already available via vaul)
- Mobile detection via existing `useIsMobile()` hook
- No new dependencies needed


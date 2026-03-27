

## Fix: Block Editor - Empty Row for Cursor + Button Visibility

### Problem
1. No empty space below the last block to place the cursor
2. The "블록 추가" button is cut off at the bottom

### Changes

**File: `src/components/institute/faculty/ChapterBlockEditor.tsx`**

1. **Add clickable empty row** below the blocks (inside the editor scroll area, after `</DndContext>`): Add a `div` with `min-h-[120px]` that, when clicked, inserts a new paragraph block at the end. This gives a persistent cursor landing area.

2. **Ensure sticky bar visibility**: The sticky bar at line 471 already uses `flex-shrink-0`, so it should not shrink. The issue is likely the parent `fixed inset-0 flex flex-col` layout combined with the scroll area. Add `min-h-0` to the `flex-1 overflow-y-auto` div (line 452) to ensure proper flex overflow behavior, preventing the sticky bar from being pushed off-screen.

### Summary of Edits

| Line | Change |
|------|--------|
| 452 | Add `min-h-0` to the scrollable editor div |
| 466-467 | Add an empty clickable area (`min-h-[120px]`) after `</DndContext>` for cursor placement |


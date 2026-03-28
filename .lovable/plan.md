

# Mobile Edit Mode Redesign

## Problems
1. **Side panel covers canvas**: `SpaceBlockPicker` (w-72) renders beside canvas on edit mode, but on mobile (430px) it takes most of the screen
2. **Blocks don't auto-reflow on mobile**: Blocks use absolute positioning (`pos_x`, `pos_y`) which doesn't adapt to narrow screens

## Solution

### 1. Mobile Block Picker → Bottom Sheet
Instead of rendering `SpaceBlockPicker` as a side panel on mobile, show it as a bottom drawer/sheet.

**StudioMainPanel.tsx**:
- Import `useIsMobile`, `Drawer`/`DrawerContent`/`DrawerTrigger` (or `Sheet`)
- On desktop: keep current side panel behavior
- On mobile: hide the side panel, add a floating action button (e.g. `+` or toolbox icon) that opens a bottom Drawer containing `SpaceBlockPicker`
- Pass `isMobile` prop to `SpaceBlockPicker` for compact styling

**SpaceBlockPicker.tsx**:
- Accept optional `isMobile` prop
- When mobile: use a horizontal scrolling strip or compact 4-column grid with smaller icons (`h-5 w-5`) and smaller text (`text-[9px]`)
- Remove the `w-72 border-l` wrapper on mobile, use `w-full` instead

### 2. Mobile Auto-Layout for Blocks
Blocks are absolutely positioned using `pos_x`/`pos_y`/`size_w`/`size_h`. On mobile screens, these pixel coordinates don't work well.

**SpaceCanvas.tsx** + **SpaceBlock.tsx**:
- Detect mobile via `useIsMobile()`
- On mobile (non-edit mode): render blocks in a **vertical stack layout** instead of absolute positioning
  - Wrap blocks in a `flex flex-col gap-3 p-3` container
  - Each block becomes `position: relative; width: 100%` with auto height
  - Sort blocks by `pos_y` then `pos_x` to maintain logical reading order
- On mobile (edit mode): keep absolute positioning so drag/resize still works, but scale coordinates to fit viewport width (e.g. scale factor = `viewportWidth / canvasWidth`)

**SpaceBlock.tsx**:
- Accept `mobileLayout` prop
- When `mobileLayout === true`: don't use absolute positioning, render as a flow block with `w-full` and min-height based on `size_h`

### 3. Edit Mode Toolbar (Mobile)
**SpaceCanvas.tsx**:
- Move the Save/Cancel buttons to a sticky bottom bar on mobile instead of `absolute top-3 right-3`
- Compact styling: smaller text, full-width bar

## Files to Change
1. **`src/components/worship-studio/StudioMainPanel.tsx`** — mobile Drawer for block picker
2. **`src/components/worship-studio/spaces/SpaceBlockPicker.tsx`** — compact mobile variant
3. **`src/components/worship-studio/spaces/SpaceCanvas.tsx`** — mobile stacked layout + bottom toolbar
4. **`src/components/worship-studio/spaces/SpaceBlock.tsx`** — `mobileLayout` prop for flow positioning


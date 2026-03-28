

# Drag Handle Outside Block for YouTube (and all blocks)

## Problem
The drag handle is **inside** the block, so for YouTube blocks the iframe swallows all touch/pointer events. On mobile there's no handle at all, making YouTube blocks impossible to select or drag.

## Solution
Move the drag handle **outside** the block boundary (to the left) so it never overlaps with block content like iframes.

### `SpaceBlock.tsx`

**1. External drag handle (both mobile and desktop in edit mode)**
- Remove the `!isMobile` condition — show the handle on both platforms
- Position it **outside** the block using negative `left` offset: `left: -24px` (instead of `left: 0` inside)
- Make it taller, always visible in edit mode, with the block's accent color
- Width: `20px` on desktop, `28px` on mobile for touch friendliness

**2. Adjust block container**
- When in edit mode, add `margin-left: 28px` (mobile) or `24px` (desktop) to the block's `left` calculation so blocks don't shift off-canvas — OR simply let the handle extend outside without affecting block position (use `overflow: visible` on parent)
- The handle is absolutely positioned relative to the block with negative left, so it sits outside the block boundary

**3. Layout approach**
```text
Desktop edit mode:
  [Handle -24px outside] [Block at pos_x, pos_y]
  
Mobile edit mode:
  [Handle -28px outside] [Block at pos_x, pos_y]
```

- The handle div: `position: absolute; left: -24px; top: 0; bottom: 0; width: 24px`
- This keeps it outside the block's border/content area, so iframe can't intercept events
- The block container already has `overflow-visible` when selected — extend this to edit mode

**4. Remove `borderLeftWidth: 4` colored border in edit mode** (optional)
- The external handle replaces the left accent bar visually in edit mode
- In non-edit mode, keep the 4px left border as before

### Changes summary

**File: `SpaceBlock.tsx`**
- Show drag handle on both mobile and desktop when `canDrag`
- Position handle with `left: -24px` (desktop) / `left: -28px` (mobile), outside the block
- Add `overflow-visible` class when in edit mode (not just when selected)
- Handle uses `handleDragPointerDown` for immediate drag (no long-press needed since handle is outside iframe)
- Keep long-press on block body as fallback for non-iframe blocks


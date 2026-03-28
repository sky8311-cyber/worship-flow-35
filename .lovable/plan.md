

# Unify Mobile/Desktop Canvas View + Mobile Drag & Resize

## Changes

### 1. Remove mobile stacked layout (`SpaceCanvas.tsx`)
- Remove `mobileLayout` variable and the `sortedBlocks` memo
- Remove the `mobileLayout ? (stacked view) : (canvas view)` branch -- always render the fixed-width canvas with absolute positioning
- On mobile, skip zoom controls but still render the 430px canvas (it fits naturally)
- Remove `canvasHeight` dependency on `mobileLayout`

### 2. Remove mobile layout from `SpaceBlock.tsx`
- Remove the `mobileLayout` prop and the early-return branch (lines 89-113)
- Remove `!mobileLayout` check from `canDrag` -- drag is allowed in edit mode on both platforms

### 3. Long-press drag on mobile (`SpaceBlock.tsx`)
- Instead of requiring the grip handle to initiate drag, implement a **long-press** (500ms) on the block itself to start dragging in edit mode
- Add a `longPressTimer` ref; on `pointerDown` (in edit mode), start a 500ms timeout
- If the timer completes without `pointerUp`/`pointerCancel`, activate drag mode (set `isDragging`, capture pointer, store start coords)
- If user moves finger before timer completes, cancel the timer (it's a scroll)
- On `pointerMove` after drag is activated, move the block as before
- Keep the grip handle visible on desktop as an alternative

### 4. Mobile resize (`SpaceBlock.tsx` + `ResizeHandle.tsx`)
- Currently resize handles show when `isSelected && isOwner && isEditMode` but the `canDrag` check blocks mobile -- now that we removed `!mobileLayout` from `canDrag`, resize handles will appear
- Make resize handle dots larger on mobile (12px instead of 8px) for touch friendliness
- Pass `isMobile` or use a larger touch target size

### 5. Drawer padding (`StudioMainPanel.tsx`)
- Add padding to `DrawerContent`: change `<DrawerContent className="max-h-[60vh]">` to `<DrawerContent className="max-h-[60vh] pb-6">`
- Also add `px-1` or `p-4` to the compact picker container

## Files
1. **`SpaceCanvas.tsx`** -- remove mobileLayout branch, always use canvas view
2. **`SpaceBlock.tsx`** -- remove mobileLayout prop/branch, add long-press drag for mobile
3. **`ResizeHandle.tsx`** -- larger touch targets on mobile
4. **`StudioMainPanel.tsx`** -- add padding to DrawerContent


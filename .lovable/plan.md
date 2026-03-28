

# Fixed-Width Canvas + Always-On Picker + Zoom Controls

## Concept
Set a fixed canvas width (e.g. **430px**) that matches the mobile viewport. On desktop, the canvas is centered within its available area with the block picker always visible on the right. Add **zoom controls** (CSS `transform: scale()`) so users can zoom in/out on desktop. This makes block coordinates identical between mobile and desktop -- what you see on desktop is exactly what mobile users see.

## Changes

### 1. `StudioMainPanel.tsx`
- **Always show** `SpaceBlockPicker` on desktop when `isOwnStudio` (remove the `isEditMode` condition)
- Remove the mobile drawer FAB (keep the Drawer for mobile edit mode only)

### 2. `SpaceCanvas.tsx` -- Fixed-width canvas + zoom
- Add `zoom` state (default `1.0`) with `+`, `-`, reset buttons in the toolbar
- Wrap the absolute-positioned canvas in a **fixed-width container** (`width: 430px`) centered with `mx-auto`
- Apply `transform: scale(zoom)` with `transform-origin: top center` to the canvas container
- On mobile: no zoom controls, canvas is naturally 430px (full width)
- The outer scrollable div stays `flex-1` and scrolls the zoomed content
- Adjust `canvasHeight` calculation to account for zoom

### 3. `SpaceBlock.tsx`
- No changes needed -- blocks already use absolute positioning with pixel coords that will now be consistent across devices

### 4. `SpaceBlockPicker.tsx`
- Minor: always visible on desktop means it needs to show the "Add Block" grid even outside edit mode (or show a read-only state when not editing). In non-edit mode, show a collapsed/minimal version or keep the full grid but disable adding.

## Layout Math (Desktop)
```text
[Sidebar ~256px] [Canvas area: flex-1] [Picker 288px]

Canvas area ≈ 1400 - 256 - 288 = ~856px
Inside: centered 430px canvas at zoom 1.0
Zoom range: 0.5x to 2.0x
At 2.0x: canvas appears 860px (fills the area perfectly)
```

## Zoom Controls UI
- Small floating controls in top-left of canvas area: `[-]  100%  [+]  [fit]`
- "Fit" button auto-calculates zoom to fill available width
- Zoom stored in local state (resets on navigation)

## Files
1. **`StudioMainPanel.tsx`** -- always show picker on desktop
2. **`SpaceCanvas.tsx`** -- fixed 430px canvas, zoom state + controls, centered layout
3. **`SpaceBlockPicker.tsx`** -- handle non-edit-mode display


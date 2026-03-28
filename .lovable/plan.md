

# Studio v2 Phase C: Figma-style Space Canvas

## Overview
Replace the Muji dot grid placeholder in `StudioMainPanel` with a fully interactive Figma-style infinite canvas. Blocks can be freely placed, dragged, resized, and selected on a pan/zoom grid surface.

## Components to Create

### 1. `src/components/worship-studio/spaces/SpaceCanvas.tsx`
Main canvas container:
- Load blocks via `useSpaceBlocks(spaceId)`
- Render Muji dot grid background (existing CSS)
- Pan: mouse drag on background (middle-click or hold Space+drag), touch two-finger
- State: `offset` (pan x/y), `zoom` (scale 0.25–2.0, default 1.0)
- Transform wrapper: `transform: scale(${zoom}) translate(${offset.x}px, ${offset.y}px)`
- Click on empty area → deselect all blocks
- Owner: right-click or double-click on empty area → open `BlockAddMenu` at cursor position
- Props: `spaceId`, `isOwner`

### 2. `src/components/worship-studio/spaces/SpaceBlock.tsx`
Individual block on canvas:
- Absolute positioned at `pos_x, pos_y` with `size_w × size_h`
- Draggable (mouse/touch) → `useUpdateBlock` on drag end (debounced)
- Resizable via bottom-right corner handle (8×8 dot) → update `size_w/size_h`
- Click → select (blue outline `ring-2 ring-blue-400`)
- Owner only: drag + resize enabled
- Content rendering by `block_type` (reuse color scheme from `SortableCanvasBlock`)
- Z-index from `block.z_index`
- Min size: 100×80

### 3. `src/components/worship-studio/spaces/BlockAddMenu.tsx`
Floating menu for adding blocks:
- Appears at cursor/tap position on canvas
- Grid of block type buttons (same 6 types: song, worship_set, scripture, prayer_note, audio, note)
- On select: `useCreateBlock` with `pos_x/pos_y` at menu position, default `size_w=200, size_h=150`
- Click outside → dismiss
- Reuses icon/color scheme from `CanvasRightPanel`

### 4. `src/components/worship-studio/spaces/BlockPropertyPanel.tsx`
Right-side property panel (desktop) / Bottom sheet (mobile):
- Shows when a block is selected
- Reuses `BlockPropertyForm` logic from `CanvasRightPanel.tsx`
- Additional controls: delete block button, z-index up/down
- Width: 260px fixed on desktop, full-width Drawer on mobile
- Updates via `useUpdateBlock`

## Changes to Existing Files

### `StudioMainPanel.tsx`
- Replace the Muji placeholder `<div>` with `<SpaceCanvas spaceId={activeSpaceId} isOwner={isOwnStudio} />`

## Technical Details

### Drag implementation
- Use native `onPointerDown/Move/Up` for block dragging (not @dnd-kit — free positioning, not list sorting)
- Track `dragStart` position and block's initial `pos_x/pos_y`
- On pointer up: call `useUpdateBlock` to persist final position
- Optimistic local state during drag for smooth UX

### Resize implementation
- Bottom-right handle: same pointer event approach
- Constrain min 100×80, snap to 10px grid optional
- Persist on pointer up via `useUpdateBlock`

### Pan & Zoom
- Pan: track `isPanning` state, update `offset` on pointer move
- Zoom: wheel event with `e.deltaY`, centered on cursor position
- Mobile: pinch-to-zoom via touch events (two-finger distance delta)
- Store offset/zoom per space in component state (reset on space switch)

### Block type rendering
Color scheme (from existing codebase):
- song: `#7c6a9e` | worship_set: `#b8902a` | scripture: `#4a7c6a`
- prayer_note: `#8b5e52` | audio: `#3a6b8a` | note: `#6b6560`

Each block shows: 4px left border in type color, type icon + label badge, content preview text

## Files

| Action | File |
|--------|------|
| Create | `src/components/worship-studio/spaces/SpaceCanvas.tsx` |
| Create | `src/components/worship-studio/spaces/SpaceBlock.tsx` |
| Create | `src/components/worship-studio/spaces/BlockAddMenu.tsx` |
| Create | `src/components/worship-studio/spaces/BlockPropertyPanel.tsx` |
| Edit | `src/components/worship-studio/StudioMainPanel.tsx` |

No database changes — uses `space_blocks` table and hooks from Phase A.


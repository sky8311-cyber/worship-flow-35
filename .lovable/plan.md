

# Studio v2 Phase C — Canvas Components Implementation

## Overview
Rewrite the canvas system with 5 components: MujiGridBackground, SpaceCanvas, SpaceBlock, ResizeHandle, SpaceBlockPicker. Remove old BlockAddMenu and BlockPropertyPanel. Remove pan/zoom — use simple scrollable canvas with absolute-positioned blocks.

## Files to Create/Edit

### 1. Create `MujiGridBackground.tsx`
- Simple div with Muji dot grid: `radial-gradient(circle, #c8bfb0 1px, transparent 1px)`, bg `#faf7f2`, size 20px
- `width: 100%`, `height: 100%`, absolute inset-0, pointer-events-none

### 2. Rewrite `SpaceCanvas.tsx`
- Remove pan/zoom/wheel logic entirely
- Structure: scrollable div with dynamic height
- Height calc: `blocks.length === 0 ? '100vh' : max(block.pos_y + block.size_h) + 400 + 'px'`
- Render `<MujiGridBackground />` + blocks via `<SpaceBlock>`
- Click empty area → deselect (`selectedId = null`)
- Props: `spaceId`, `isOwner`; expose `selectedBlockId` state for picker

### 3. Rewrite `SpaceBlock.tsx`
- `position: absolute`, `left/top/width/height` from block data
- Selection ring: `ring-2 ring-[#b8902a] shadow-lg`
- Interior: colored placeholder with icon + type name (from 12-type map)
- **Drag** via Pointer Events + `setPointerCapture`:
  - `GRID_SNAP = 20`, snap via `Math.round(v/20)*20`
  - Optimistic local state during drag
  - Drag visual: `opacity-85`, `rotate(0.3deg) scale(1.02)`, enhanced shadow, `cursor: grabbing`
  - Boundary clamp: `pos_x >= 0`, `pos_y >= 0`
  - `onPointerUp` → call `useUpdateBlock()` to persist
- Owner-only drag

### 4. Create `ResizeHandle.tsx`
- Renders 8 handles (4 corners + 4 edges) around selected block
- Each handle: 8×8px white circle, `border: 2px solid #b8902a`
- Pointer events for resize with `GRID_SNAP = 20`
- Min size: 80×60
- Appropriate cursors per direction (nw-resize, ne-resize, etc.)
- Handles adjust both position and size depending on direction

### 5. Create `SpaceBlockPicker.tsx` (right panel, w-72)
**State A — No block selected:**
- Title: "블록 추가"
- 3-column grid with 12 block types: 제목/부제목/포스트잇/번호목록/체크리스트/사진/유튜브/음악/예배셋/링크/파일/명함
- Click → `useCreateBlock()` at canvas center

**State B — Block selected:**
- Top: position/size readout `X: pos_x  Y: pos_y  W: size_w  H: size_h`
- Middle: placeholder text "Phase D에서 settings 구현 예정"
- Bottom: red "블록 삭제" button with confirm dialog → `useDeleteBlock()`

### 6. Update `StudioMainPanel.tsx`
- Layout: `flex row` — `SpaceCanvas` (flex-1) + `SpaceBlockPicker` (w-72 fixed right)
- Pass `selectedBlockId` and setter between canvas and picker
- Remove old BlockAddMenu/BlockPropertyPanel imports

### 7. Delete old files
- `BlockAddMenu.tsx` — replaced by SpaceBlockPicker
- `BlockPropertyPanel.tsx` — replaced by SpaceBlockPicker

## Block Types (12 total, expanded from 6)
| Type | Icon | Label | Color |
|------|------|-------|-------|
| title | Type | 제목 | #4a4a4a |
| subtitle | Type | 부제목 | #6b6b6b |
| sticky_note | StickyNote | 포스트잇 | #e8c840 |
| numbered_list | ListOrdered | 번호목록 | #5a7a5a |
| checklist | CheckSquare | 체크리스트 | #4a7c6a |
| photo | Image | 사진 | #7c6a9e |
| youtube | Youtube | 유튜브 | #cc3333 |
| song | Music | 음악 | #7c6a9e |
| worship_set | Calendar | 예배셋 | #b8902a |
| link | Link | 링크 | #3a6b8a |
| file | FileText | 파일 | #6b6560 |
| business_card | Contact | 명함 | #8b5e52 |

## Technical Notes
- `useSpaceBlocks`, `useCreateBlock`, `useUpdateBlock`, `useDeleteBlock` hooks remain unchanged
- No pan/zoom — canvas scrolls naturally via `overflow-y: auto` on parent
- `selectedBlockId` state lives in SpaceCanvas, passed to picker via props or lifted to StudioMainPanel


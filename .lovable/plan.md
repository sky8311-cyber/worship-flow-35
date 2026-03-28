

# Studio v2 Phase B: Space Tab System

## Overview
Replace the existing Worktable/Board/Archive tabs in `StudioMainPanel` with a dynamic Space tab system backed by `studio_spaces`. Remove `StudioCoverEditor` usage. Create two new components: `SpaceTabBar` and `SpaceCreateDialog`.

## Changes

### 1. Create `src/components/worship-studio/spaces/SpaceTabBar.tsx`
- Load spaces via `useStudioSpaces(roomId)`
- Render horizontal tab strip with `@dnd-kit/sortable` for drag reorder (owner only)
- Each tab: `space.icon + space.name`, active tab gets `border-b-2` in `space.color`
- Double-click tab → inline rename input (Enter/blur saves via `useUpdateSpace`)
- "+ 새 공간" button visible when `spaces.length < 10` and `isOwner`
- If zero spaces exist, auto-open `SpaceCreateDialog`
- Props: `roomId`, `activeSpaceId`, `onSpaceSelect`, `isOwner`

### 2. Create `src/components/worship-studio/spaces/SpaceCreateDialog.tsx`
- Dialog with 4 fields: name input, emoji icon grid (3 categories × 10), color swatches (10 colors), visibility radio
- First space rule: when `existingCount === 0`, force visibility to `public`, disable radio, show yellow info box
- On save: `useCreateSpace()` with `sort_order = existingCount`
- Props: `open`, `onOpenChange`, `roomId`, `existingCount`

### 3. Rewrite `src/components/worship-studio/StudioMainPanel.tsx`
- Remove all `Tabs`/`TabsContent` imports and old tab logic (Worktable/Board/Archive/Discover)
- Remove `BlockTypeSelector`, `useCanvas`, `StudioView`, `StudioBoardView`, `StudioArchiveView`, `StudioDiscover` imports
- New structure:
  - State: `activeSpaceId` (auto-set to first space on load)
  - Top bar: `<SpaceTabBar />`
  - Body: if `activeSpaceId` → Muji dot grid placeholder div; if no spaces → empty state triggering `SpaceCreateDialog`
  - Muji grid CSS: `bg-[#faf7f2]` with `radial-gradient(circle, #c8bfb0 1px, transparent 1px)` at `20px 20px`, `min-h-screen`

### 4. Update `src/components/worship-studio/StudioView.tsx`
- Remove `StudioCoverEditor` import and usage (line 108)

### 5. Update `src/components/worship-studio/index.ts`
- Remove `StudioCoverEditor` export
- Add exports for `SpaceTabBar` and `SpaceCreateDialog`

## Files

| Action | File |
|--------|------|
| Create | `src/components/worship-studio/spaces/SpaceTabBar.tsx` |
| Create | `src/components/worship-studio/spaces/SpaceCreateDialog.tsx` |
| Rewrite | `src/components/worship-studio/StudioMainPanel.tsx` |
| Edit | `src/components/worship-studio/StudioView.tsx` |
| Edit | `src/components/worship-studio/index.ts` |

## Technical Notes
- `@dnd-kit/sortable` already in project (used by CanvasBlockList)
- `useStudioSpaces` hooks already created in Phase A
- Mobile: tabs scroll horizontally with `overflow-x-auto`; SpaceCreateDialog uses existing shadcn Dialog (responsive by default)
- No database changes needed — tables created in Phase A


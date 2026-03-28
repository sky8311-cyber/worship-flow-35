

# Phase J — Apartment Panel Height Fix

## Problem
The building body container (line 285-296) uses `absolute` positioning with `top: 28, bottom: 24`, which removes it from flex flow. Inside it, `ScrollArea className="flex-1"` gets `height: 0` because the absolute container uses `overflow-hidden` but the flex-1 child lacks `min-h-0`, and the absolute container itself doesn't establish a proper flex height chain.

## Fix

**File: `src/components/worship-studio/StudioSidePanel.tsx`**

The building body div (line 285-296) is already absolutely positioned with explicit `top`/`bottom` — so it *should* have a computed height. The real issue is the `overflow-hidden` on the building body combined with `ScrollArea`'s internal structure.

Change line 286:
- **Before**: `className="absolute left-0 right-0 z-10 flex flex-col bg-gradient-to-b ... overflow-hidden"`
- **After**: `className="absolute left-0 right-0 z-10 flex flex-col bg-gradient-to-b ... overflow-hidden"` — keep as-is

Change line 293 (ScrollArea wrapper):
- **Before**: `<ScrollArea className="flex-1">`
- **After**: `<ScrollArea className="flex-1 min-h-0">`

Also ensure the outer wrapper (line 254) has `overflow-hidden` instead of `overflow-visible` to properly contain the absolute children and give them a reference height:
- **Before**: `relative overflow-visible flex flex-col shrink-0 h-full`
- **After**: `relative overflow-hidden flex flex-col shrink-0 h-full`

The collapse toggle button uses `translate-x-1/2` to protrude outside — with `overflow-hidden` it would be clipped. Move the collapse button **outside** the sky wrapper (before the wrapper div, or use a sibling wrapper).

### Changes summary:
1. Outer div: `overflow-visible` → `overflow-hidden` (so absolute children get proper height reference)
2. Move collapse button outside the main div (render it as a sibling with absolute positioning relative to a new parent wrapper)
3. ScrollArea: add `min-h-0` to ensure flex-1 computes height correctly
4. Wrap the whole return in a `relative` container so the collapse button can float outside


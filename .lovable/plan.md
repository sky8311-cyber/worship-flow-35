

## Problem

On mobile, when the ArtistSelector drawer opens and the keyboard appears, the virtual keyboard reduces the visible viewport. The drawer with `max-h-[60vh]` doesn't adapt well — the content area becomes too cramped, showing only the search input and one result (as seen in the screenshot).

## Solution

1. **Replace fixed `max-h-[60vh]` with dynamic height** in the ArtistSelector's mobile drawer. Use CSS `dvh` (dynamic viewport height) units which account for the mobile keyboard, or use a smaller fixed max-height that works better with keyboard visible.

2. **Reduce padding and optimize spacing** inside the drawer when used for ArtistSelector to maximize content area.

3. **Use `dvh` units**: Change `max-h-[60vh]` to `max-h-[50dvh]` — `dvh` dynamically adjusts when the mobile keyboard appears, ensuring the drawer resizes properly.

4. **Reduce CommandList max-height** from `max-h-64` to something more flexible so it fills available space.

## Files to Change

- **`src/components/ArtistSelector.tsx`** (lines 126-129):
  - Change `max-h-[60vh]` → `max-h-[50dvh]`
  - Reduce padding from `p-4` → `p-2 pt-2`
  - Change CommandList `max-h-64` → `max-h-[40dvh]` for flexible scrolling


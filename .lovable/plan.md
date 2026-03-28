

# Fix: Studio Settings Dialog Scroll on Mobile

## Problem
The `DialogContent` uses `fixed` positioning with `top-[50%] translate-y-[-50%]` (vertically centered), but has no `max-height` or `overflow-y: auto`. On a 430x659 viewport, the content (visibility options + BGM selector + buttons) overflows and gets clipped with no way to scroll.

## Solution

### `StudioSettingsDialog.tsx`
- Add `max-h-[85vh] overflow-y-auto` to the `DialogContent` so it constrains to viewport height and scrolls when content
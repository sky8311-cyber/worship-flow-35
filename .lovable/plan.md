

# Fix: Mobile Building Panel Can't Be Closed

## Problem
The mobile Sheet panel at `h-[95vh]` fills nearly the entire screen. The default close button (X) from the Sheet component sits at `top-4 right-4` but is hidden behind the `StudioSidePanel` content (building roof, etc.) which has `overflow-hidden` and `p-0`. The user cannot close the panel.

## Solution

### 1. `WorshipStudio.tsx` — Reduce height + add drag handle
- Change `h-[95vh]` → `h-[85vh]` so there visible overlay area to tap-to-close
- Add a visible drag handle bar at the top of the sheet content (a small gray pill indicator) so users know they can swipe down

### 2. `sheet.tsx` — Ensure close button z-index
- The close button already has `z-50` but the `StudioSidePanel` content might layer on top
- Move the close button's z-index higher or ensure it renders above building content

### 3. `StudioSidePanel.tsx` — Ensure close button isn't covered
- Add `pt-6` or top padding to the mobile panel content so the X close button from Sheet is not obscured by the roof graphic

## Files

| File | Change |
|------|--------|
| `WorshipStudio.tsx` | `h-[95vh]` → `h-[85vh]`, add drag handle indicator |
| `StudioSidePanel.tsx` | Add top padding in mobile mode so X button is visible |


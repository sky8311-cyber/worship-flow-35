

# Show Section Labels on Mobile

## Problem
The "친구/Friends" and "앰배서더/Ambassadors" section labels are conditionally hidden on mobile (`!collapsed && !isMobile`).

## Fix
In `StudioSidePanel.tsx`, change the label visibility conditions:

1. **Line 107**: Change `!collapsed && !isMobile` → `!collapsed` so the Friends label shows on mobile
2. **Line 163**: Change `!collapsed && !isMobile` → `!collapsed` so the Ambassadors label shows on mobile
3. **Line 189** (placeholder ambassadors label): Same condition fix if applicable

This is a two-line change — just remove `&& !isMobile` from those conditions.


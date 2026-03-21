

## Bottom Nav: Support 6 Icons

### Problem
The `gridColsClass` mapping only goes up to 5. Icons use `h-5 w-5` with `px-3` padding and `rounded-full` pill style, which is too wide for 6 items on small screens.

### Changes — Single File: `src/components/layout/BottomTabNavigation.tsx`

1. **Add `grid-cols-6`** to the static mapping (line 138-144)
2. **Reduce icon size** from `h-5 w-5` → `h-4 w-4` when totalItems ≥ 6
3. **Reduce padding** from `px-3 py-1.5` → `px-1.5 py-1` when totalItems ≥ 6
4. **Reduce font size** from `text-[10px]` → `text-[9px]` when totalItems ≥ 6
5. **Update loading skeleton** to also use 6 columns dynamically
6. **Reduce badge sizes** slightly for compact layout (scale down the notification dots)

All changes are conditional on `totalItems >= 6`, so 5-item layouts remain unchanged.


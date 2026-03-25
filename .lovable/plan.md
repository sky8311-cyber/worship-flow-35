

## Problem

Draft song cards only show the "곡 등록 마무리" button but no delete button. Non-draft cards have a small icon-only delete button (`h-7 w-7`) with an `AlertDialog` confirmation. The draft delete button needs to match this same style and position.

## Changes

**`src/components/SongCard.tsx`** (lines 226-237):

Add a delete icon button next to the "곡 등록 마무리" button in the draft branch, using the exact same pattern as the non-draft delete button (lines 323-353):

- Same `variant="outline"` `size="icon"` with `h-7 w-7 sm:h-8 sm:w-8`
- Same destructive styling: `text-destructive hover:bg-destructive hover:text-white hover:border-destructive`
- Same `AlertDialog` confirmation wrapping
- Uses the existing `handleDelete` function (which already handles the "used in worship sets" check)
- Wrapped in `Tooltip` with delete label
- Condition: show when `onDelete` is provided (same as non-draft)

The draft action buttons section becomes:
```
[곡 등록 마무리 button] [🗑️ delete icon button with AlertDialog]
```

This is a single-file change affecting only the draft branch inside the action buttons section.


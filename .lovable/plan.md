

## Bug: Delete fires twice / fires after Cancel

**What happened**: The session replay shows that after deleting the first draft song and then clicking "Cancel" on the second draft's delete dialog, the success toast "곡이 삭제되었습니다" still appeared. This means `handleDelete` executed when it shouldn't have.

**Root cause**: The `handleDelete` function has no guard against double execution. When the first delete triggers `queryClient.invalidateQueries` + `onDelete()` (which calls `refetch()`), the rapid re-render cycle can cause the AlertDialog's action handler to fire unexpectedly on remounted components. Additionally, there's no `isDeleting` state to prevent concurrent calls.

## Fix

**`src/components/SongCard.tsx`** — single file change:

1. Add an `isDeleting` state (`useState(false)`)
2. Guard `handleDelete` with an early return if already deleting, and set `isDeleting = true` at the start
3. Disable the delete buttons while `isDeleting` is true (both draft and non-draft AlertDialogAction buttons)

This prevents any double-fire scenario regardless of the cause — re-renders, event bubbling, or rapid clicks.


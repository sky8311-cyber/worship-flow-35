

# Fix: Remove duplicate X button in search bar

## Problem
The search bar shows two X buttons because:
1. `SearchInput` component has a built-in clear (X) button when text is present
2. `InlineCommunitySearch` adds a separate close (X) button overlaid on the input

## Solution
Remove the separate close X button from `InlineCommunitySearch`. Instead, use `SearchInput`'s `onClear` callback to handle both clearing text AND closing the search when the input is empty.

### `src/components/dashboard/InlineCommunitySearch.tsx`
- Remove the extra `{onClose && <Button>X</Button>}` block (lines 140-150)
- Remove `pr-16` from the SearchInput className (revert to default padding)
- Add `onClear` handler: if query is empty, call `onClose()`; if query has text, clear the text

This way there's only one X button — the one built into `SearchInput` — and it serves double duty: clear text first, then close on second tap (or close immediately if empty).


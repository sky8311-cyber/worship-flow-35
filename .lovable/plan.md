

## Problem

The draft song card looks visually unbalanced compared to regular song cards. It uses a large orange "곡 등록 마무리" button that doesn't match the icon-button style used by regular cards. The card also feels empty with too much whitespace.

## Solution

Make draft cards use the same icon-button pattern as regular cards: replace the orange text button with a standard edit icon button (same as non-draft), and keep the delete icon button. Both use `variant="outline"`, `size="icon"`, `h-7 w-7 sm:h-8 sm:w-8`.

## Changes

**`src/components/SongCard.tsx`** (lines 226-270):

Replace the draft action buttons block. Instead of the large orange button + delete icon, use:
- Edit icon button: same as non-draft edit button (lines 341-355) — `variant="outline"`, `size="icon"`, `h-7 w-7 sm:h-8 sm:w-8`, with `Edit` icon and tooltip
- Delete icon button: keep as-is (already matches non-draft style)

The draft buttons become two small icon buttons sitting at the bottom-left, identical in size/style to the regular card's edit and delete buttons.




# Studio v2 Phase A: Database Foundation

## Overview
Create 3 new tables (`studio_spaces`, `space_blocks`, `space_guestbook`) with RLS policies and 3 React Query hook files. This is a database + hooks-only phase — no UI changes.

## Step 1 — Database Migration

Single migration creating all 3 tables, indexes, and RLS policies as specified:

- **`studio_spaces`**: Room sub-sections with icon/color/visibility/guestbook settings
- **`space_blocks`**: Figma-style free-position blocks (pos_x/y, size_w/h, z_index, content jsonb)
- **`space_guestbook`**: Per-space guestbook entries with author reference

RLS rules:
- Spaces/blocks: owner full access, public rooms readable by all authenticated
- Guestbook: public read, authenticated insert (own author_id), delete by author or room owner

**Note**: Will use validation triggers instead of CHECK constraints for `visibility` and `guestbook_permission` columns per project guidelines.

## Step 2 — Hook: `useStudioSpaces.ts`

Pattern follows existing `useStudioWidgets.ts` (React Query + Supabase client).

Exports:
- `useStudioSpaces(roomId)` — query spaces ordered by `sort_order`
- `useCreateSpace()` — insert with room_id, name, icon, color
- `useUpdateSpace()` — partial update (name/icon/color/visibility/guestbook fields)
- `useDeleteSpace()` — delete by id (cascade handles blocks)
- `useReorderSpaces()` — batch update sort_order via Promise.all

Query key: `['studio-spaces', roomId]`

## Step 3 — Hook: `useSpaceBlocks.ts`

Exports:
- `useSpaceBlocks(spaceId)` — query all blocks for a space
- `useCreateBlock()` — insert with space_id, block_type, pos_x/y, size_w/h, content
- `useUpdateBlock()` — partial update (position, size, content, z_index)
- `useDeleteBlock()` — delete by id

Query key: `['space-blocks', spaceId]`

## Step 4 — Hook: `useGuestbook.ts`

Exports:
- `useGuestbook(spaceId)` — query entries ordered by created_at DESC, joined with profiles for author info
- `useCreateGuestbookEntry()` — insert with space_id, body, author_user_id from auth
- `useDeleteGuestbookEntry()` — delete by id

Query key: `['space-guestbook', spaceId]`

## Files

| Action | File |
|--------|------|
| Migration | `supabase/migrations/…_studio_v2_foundation.sql` |
| Create | `src/hooks/useStudioSpaces.ts` |
| Create | `src/hooks/useSpaceBlocks.ts` |
| Create | `src/hooks/useGuestbook.ts` |

No existing files modified. No UI changes in this phase.


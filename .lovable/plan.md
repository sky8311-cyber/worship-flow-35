

## Plan: Three Worship Studio Extensions

### Addition 1 — Comment System for room_posts

**Database migration** — Create `room_post_comments` table:
```sql
CREATE TABLE room_post_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES room_posts(id) ON DELETE CASCADE NOT NULL,
  author_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE room_post_comments ENABLE ROW LEVEL SECURITY;

-- Read: anyone who can view the room the post belongs to
CREATE POLICY "Can read comments on viewable posts"
ON room_post_comments FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM room_posts rp
    JOIN worship_rooms wr ON wr.id = rp.room_id
    WHERE rp.id = room_post_comments.post_id
    AND can_view_room(wr.id, auth.uid())
  )
);

-- Insert: authenticated users (tier gating handled client-side via useTierFeature)
CREATE POLICY "Authenticated users can comment"
ON room_post_comments FOR INSERT TO authenticated
WITH CHECK (author_user_id = auth.uid());

-- Delete: authors can delete own comments
CREATE POLICY "Authors can delete own comments"
ON room_post_comments FOR DELETE TO authenticated
USING (author_user_id = auth.uid());
```

**New hook** — `src/hooks/usePostComments.ts`: fetch comments for a post_id (with author profile join), create comment mutation, delete comment mutation.

**UI changes** — In `PostDetailDialog.tsx`: below the reactions section, render a comment list (avatar, name, body, time) and a comment input. Gate the input with `useTierFeature('studio_comment')` — if the user lacks access, show `<LockedFeatureBanner feature="studio_comment" compact />` instead of the input.

---

### Addition 2 — Post Search & Category Filter

**UI changes** — In `StudioPostList` component (`PostDisplayCard.tsx`, lines 166-242):
- Add state for `searchQuery` and `activeCategory` (default: `null` = all).
- Above the post grid, add a `<SearchInput>` (already exists in `src/components/ui/search-input.tsx`) filtering posts client-side by `title` and `content` (case-insensitive includes).
- Add a row of category filter buttons using `useEnabledCategories()` from `useStudioCategories.ts`. Each button shows the category label (bilingual). Filter posts by matching `post.post_type` to the selected category key. An "All" button clears the filter.
- Apply both filters before the existing display-type grouping logic.

No new tables or hooks needed.

---

### Addition 3 — Per-Post Visibility Selector in Editor

**UI changes** — In `StudioPostEditor.tsx`:
- Add `visibility` state, defaulting to `room?.visibility || "friends"`.
- In the "Display Settings" section, add a visibility selector with three options: Private (비공개) / Friends (친구공개) / Public (전체공개), using the same button-grid pattern as display type.
- Pass `visibility` to the `createPost.mutate()` call (the `useCreateStudioPost` hook already accepts `visibility`).

No database or hook changes needed — the column and mutation support already exist.

---

### Files Changed Summary

| File | Change |
|---|---|
| **Migration SQL** | Create `room_post_comments` table + RLS |
| `src/hooks/usePostComments.ts` | New hook: fetch/create/delete comments |
| `src/components/worship-studio/PostDetailDialog.tsx` | Add comment list + gated input below post |
| `src/components/worship-studio/PostDisplayCard.tsx` | Add search input + category filter to `StudioPostList` |
| `src/components/worship-studio/StudioPostEditor.tsx` | Add visibility selector, pass to mutation |


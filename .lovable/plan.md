

## Plan: Replace Placeholder Avatars with Real KWorship User Profile Photos

### What
Replace the 5 static `pravatar.cc` placeholder images in the Social Proof strip (Section 2) with real profile photos fetched randomly from the `profiles` table.

### How

**File: `src/pages/Institute.tsx`**

1. **Add a query** using `useQuery` to fetch ~10 random user profile photos:
   ```sql
   SELECT avatar_url FROM profiles
   WHERE avatar_url IS NOT NULL
   ORDER BY random()
   LIMIT 10
   ```
   - Cache with a long `staleTime` (e.g. 5 min) so it doesn't refetch on every render
   - The query returns more than needed (10) so we have a pool; display only 5

2. **Replace the static avatar loop** (lines 226–234):
   - If query data exists and has results, render up to 5 real `avatar_url` images
   - If query is loading or returns empty, fall back to the existing pravatar.cc URLs as placeholder
   - Each `<img>` keeps the same classes: `w-8 h-8 rounded-full border-2 border-background`

3. **No other file changes needed** — the profiles table already has `avatar_url` and public read access.

### Single file edit
`src/pages/Institute.tsx` — ~15 lines changed (add query + update avatar rendering block)


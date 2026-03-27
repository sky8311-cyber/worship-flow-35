

## Plan: Add Rotating Profile Avatars to the "200+" Counter Section

### What
Add a row of profile avatar images below the "200+" counter that randomly rotate on every page load/refresh, fetched from the `profiles` table.

### How

**File: `src/pages/InstituteAbout.tsx`**

1. **Add imports**: `useQuery` from `@tanstack/react-query`, `supabase` client
2. **Add query** (same pattern as Institute.tsx) to fetch ~10 random avatars with `staleTime: 0` and `refetchOnMount: 'always'` so every visit gets fresh random profiles
3. **Render avatars** between the counter number and the subtitle text (line ~314), showing 5-7 overlapping circular avatars in a horizontal stack with negative margins (like a social proof strip)

### Technical Details
- Query: `SELECT avatar_url FROM profiles WHERE avatar_url IS NOT NULL ORDER BY random() LIMIT 10`
- `staleTime: 0` + `refetchOnMount: 'always'` ensures fresh rotation every time
- Display: overlapping circles with `-ml-2` stacking, `ring-2 ring-background` for separation
- Fallback: hide avatar strip if no results

### Single file edit
`src/pages/InstituteAbout.tsx` — ~20 lines added


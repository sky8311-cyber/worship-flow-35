

## AI Worship Set: Song Loss and Duplication Issues

### Root Cause Analysis

**Problem 1: Songs lost on first try**
- In `AISetBuilderPanel.tsx` line 143-147, the AI returns `song_id` values, then the client fetches those songs from the `songs` table via `.in("id", songIds)`. If the AI hallucinates or returns an ID not in the original 500-song fetch (due to the DB limit), the song silently disappears from `songMap`.
- At line 164-165, `result.filter(item => songMap[item.song_id])` silently drops any song whose ID wasn't found. No warning is shown to the user about dropped songs.

**Problem 2: Duplication / more songs than requested on second try**
- In `SetBuilder.tsx` line 2429-2431, `onAddSongs` calls `handleAddSong` in a loop which does `setItems(prev => [...prev, newSetItem])` — it **appends** to existing items. There is no "replace" or "clear AI songs first" logic. Running AI generation twice stacks songs on top of each other.
- The AI model sometimes returns more songs than the requested `songCount` (no server-side enforcement).

### Proposed Fixes

**1. Edge Function: Enforce song count cap** (`generate-worship-set/index.ts`)
- After parsing the AI response, truncate `worshipSet` to the requested `songCount`.
- Validate that every returned `song_id` exists in the fetched song list before returning.

**2. Client: Warn about dropped songs** (`AISetBuilderPanel.tsx`)
- After building `songsToAdd`, if `songsToAdd.length < result.length`, show a warning toast indicating how many songs were not found in the database.

**3. Client: Replace instead of append** (`SetBuilder.tsx`)
- In `onAddSongs`, before adding AI-generated songs, remove any existing song items from the set (or ask the user whether to replace or append).
- Add a confirmation dialog: "현재 세트에 곡이 있습니다. 교체하시겠습니까?" with Replace/Append options.

**4. Edge Function: Validate song_ids against fetched list** (`generate-worship-set/index.ts`)
- Build a `Set` of valid song IDs from the fetched songs.
- Filter the AI's `worshipSet` to only include songs with valid IDs before returning the response.
- Log any invalid IDs for debugging.

### Files to Change

| File | Change |
|------|--------|
| `supabase/functions/generate-worship-set/index.ts` | Validate song_ids, enforce songCount cap |
| `src/components/AISetBuilderPanel.tsx` | Warn user about dropped songs |
| `src/pages/SetBuilder.tsx` | Replace-or-append dialog before adding AI songs |


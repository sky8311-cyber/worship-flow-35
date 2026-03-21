## I'm Performance Audit: Song Library & Search

### Critical Issues Found

#### 1. SongLibrary — `select("*")` fetches ALL columns including `lyrics` (HIGH impact)

**File**: `src/pages/SongLibrary.tsx` line 192

- Every search query fetches the entire `lyrics` text for every song — potentially thousands of rows with large text blobs
- No `.limit()` on the query — returns ALL matching songs (could be 500+)
- `lyrics.ilike.%...%` forces a full-text scan on large text columns — very slow at DB level
- Combined: each keystroke (even debounced) triggers a heavy DB scan + large payload transfer

#### 2. StudioBGMSelector — No debounce (MEDIUM impact)

**File**: `src/components/worship-studio/StudioBGMSelector.tsx`

- `searchQuery` is used directly in queryKey with no debounce — fires a DB query on every keystroke

#### 3. RoomBGMSelector — No debounce (MEDIUM impact)

**File**: `src/components/worship-rooms/RoomBGMSelector.tsx`

- Same issue — no debounce on search input

#### 4. SongSelectorDialog — No debounce (LOW impact)

**File**: `src/components/worship-studio/editor/SongSelectorDialog.tsx`

- Direct `search` state in queryKey, fires per keystroke

#### 5. SongLibrary debounce too short (LOW-MEDIUM)

- 300ms debounce exists but may feel insufficient on slow connections with heavy queries

---

### Fix Plan

#### A. SongLibrary query optimization (biggest win)

1. **Select only needed columns** — replace `select("*")` with explicit columns (id, title, subtitle, artist, default_key, language, tags, is_private, status, created_by, created_at, bpm, youtube_url). Exclude `lyrics` and `notes` from list query.
2. **Add `.limit(200)**` — cap results to prevent massive payloads
3. **Remove `lyrics.ilike` from search** — searching inside lyrics text is the slowest operation. Instead, search only title/subtitle/artist/tags. If lyrics search is essential, make it a separate "deep search" toggle.
4. **Increase debounce to 500ms** — gives more breathing room for the DB

#### B. Add debounce to 3 other search components

- `StudioBGMSelector`: add 300ms debounce
- `RoomBGMSelector`: add 300ms debounce
- `SongSelectorDialog`: add 300ms debounce

Pattern: same `useState` + `useEffect` + `setTimeout` pattern already used in SongLibrary.

#### C. CommunitySearch — already audited, no debounce but client-side filtering (acceptable)

---

### Modified Files


| File                                                          | Change                                                                                                            |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `src/pages/SongLibrary.tsx`                                   | Select specific columns (drop lyrics/notes), add `.limit(200)`, remove `lyrics.ilike`, increase debounce to 500ms |
| `src/components/worship-studio/StudioBGMSelector.tsx`         | Add 300ms debounce                                                                                                |
| `src/components/worship-rooms/RoomBGMSelector.tsx`            | Add 300ms debounce                                                                                                |
| `src/components/worship-studio/editor/SongSelectorDialog.tsx` | Add 300ms debounce                                                                                                |


### Expected Impact

- **Payload size**: ~80% reduction (excluding lyrics column from list queries)
- **DB query speed**: ~3-5x faster (removing full-text lyrics scan)
- **Network requests**: ~50% fewer (debounce on 3 additional components)
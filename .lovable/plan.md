

## Song Save Freeze Fix

### Root Cause

The "freeze" users experience is caused by the `handleSubmit` flow in `SongDialog.tsx` (line 359-458):

```text
handleSubmit flow (current):
  setLoading(true)
  → INSERT song (network call #1)
  → dynamic import rewardsHelper (async module load)
  → await saveScoreVariations (DELETE + INSERT = 2 network calls)
  → await saveYoutubeLinks (DELETE + INSERT = 2 network calls)
  → await queryClient.invalidateQueries(["songs"])  ← THIS IS THE KILLER
  → setShowAddToSetPrompt(true)
  → setLoading(false)
```

**The `await invalidateQueries` on line 443 waits for the entire songs list to refetch before proceeding.** If the library has hundreds of songs, this can take 2-5+ seconds. During this entire chain (5-6 sequential network calls), the save button shows "로딩 중..." and the dialog is unresponsive. Users think it froze and close/reopen/re-save.

Additionally, there's **no double-click guard** — the `loading` state is async so rapid clicks can fire two submissions.

### Fix (1 file: `SongDialog.tsx`)

#### 1. Don't await `invalidateQueries` — fire and forget
Change line 443 from `await queryClient.invalidateQueries(...)` to just `queryClient.invalidateQueries(...)` (no await). The UI doesn't need to wait for the background refetch.

#### 2. Add `useRef` double-submit guard
Add `const submittingRef = useRef(false)` — set synchronously at the start of `handleSubmit`, return early if already true, reset in `finally`. This prevents double-clicks that slip past the async `setLoading`.

#### 3. Parallelize score + youtube saves
Change lines 439-440 from sequential awaits to `Promise.all([saveScoreVariations(songId), saveYoutubeLinks(songId)])`. These are independent operations — no reason to run sequentially.

#### 4. Show immediate visual feedback
After the INSERT succeeds (line 408), immediately show the toast AND change button text to "✓ 저장됨" before proceeding with the secondary saves. This gives users instant confirmation that the song was saved, even while scores/links are still being written.

### Expected Impact
- Save-to-feedback time: ~3-6s → ~0.5s (toast appears right after INSERT)
- Double-submit: impossible (ref guard)
- Dialog responsiveness: no longer blocked by query refetch


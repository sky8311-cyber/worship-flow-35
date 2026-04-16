

# Further Speed Up Score Loading

## Current State (already implemented)
- Batch `createSignedUrls` call warms an in-memory cache
- `SignedScoreImage` checks cache synchronously before going async
- This avoids N individual API calls → 1 batch call

## Remaining Bottlenecks

1. **Queries refetch every mount** — `staleTime: 0` + `refetchOnMount: "always"` on `band-view-song-scores` forces a fresh DB round-trip every time, even when navigating back. The signed URL batch can't start until this query finishes.

2. **No image preloading** — After the batch-sign call populates the cache, each `<img>` still starts downloading only when it enters the DOM/viewport (most use `loading="lazy"`). The browser doesn't begin fetching image bytes until React renders each card.

3. **Missing `decoding="async"`** — Without it, image decode blocks the main thread, causing jank as scores appear.

## Plan

### 1. Add `staleTime` to score queries (BandView.tsx)
Set `staleTime: 60_000` (1 min) on `band-view-song-scores` and `band-view-songs` queries so repeat visits / re-renders skip the DB round-trip. Data is still fresh for practical use.

### 2. Preload images after batch-sign resolves
In the batch-prefetch `useEffect`, after `getSignedScoreUrls` resolves, use `new Image()` to kick off browser downloads immediately — before React even renders the score cards. This runs in parallel with the rest of the page render.

```typescript
// After batch-sign resolves:
getSignedScoreUrls(allUrls).then((map) => {
  // Preload into browser cache
  for (const url of map.values()) {
    const img = new Image();
    img.src = url;
  }
});
```

### 3. Add `decoding="async"` to SignedScoreImage
Prevents image decode from blocking the main thread, reducing perceived jank.

### 4. Use `loading="eager"` for first visible scores
The first 2-3 scores (above the fold) should use `loading="eager"` instead of `"lazy"` so they start downloading immediately. Pass an `eager` prop or index-based logic from BandView.

## Files to Change
1. `src/pages/BandView.tsx` — add staleTime to queries, preload images after batch-sign
2. `src/pages/PublicBandView.tsx` — same changes
3. `src/components/score/SignedScoreImage.tsx` — add `decoding="async"`, accept `priority` prop for eager loading

## Expected Impact
- **Repeat visits**: instant (no DB re-query, cached signed URLs, browser-cached images)
- **First visit**: images start downloading ~200-500ms earlier (preload during render) instead of waiting for DOM insertion
- **Smoother rendering**: async decode eliminates decode jank


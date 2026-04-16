

# Speed Up YouTube & Score Loading

## Problem
1. **Scores**: Each `SignedScoreImage` makes an **individual** `createSignedUrl` API call. A worship set with 5 songs × 3 pages = 15 sequential network requests before images even start loading.
2. **YouTube (native)**: The bridge page loads the full YouTube IFrame API script (`iframe_api`) every time, with no preloading. On native, there's an extra hop through the HTTPS bridge host.

## Plan

### 1. Batch-prefetch signed URLs in BandView
Instead of each `SignedScoreImage` independently calling `getSignedScoreUrl`, collect **all** score URLs from the query data and batch-sign them upfront using the existing `getSignedScoreUrls` utility.

**Files**: `src/pages/BandView.tsx`, `src/pages/PublicBandView.tsx`
- After the main data query resolves, extract all `file_url` values
- Call `getSignedScoreUrls(allUrls)` once → populates the in-memory cache
- `SignedScoreImage` will then hit the cache instantly (no network calls)

### 2. Add prefetch cache warming to SignedScoreImage
Make `SignedScoreImage` check the existing `signedUrlCache` synchronously before going async. If the URL is already cached, render immediately with no loading placeholder.

**File**: `src/components/score/SignedScoreImage.tsx`, `src/utils/scoreUrl.ts`
- Export a `getCachedSignedUrl(path)` sync function from `scoreUrl.ts`
- In `SignedScoreImage`, check cache first → skip the loading shimmer if already resolved

### 3. Preconnect to YouTube domains
Add `<link rel="preconnect">` hints so the browser establishes connections early.

**File**: `index.html`
- Add preconnect for `https://www.youtube.com` and `https://i.ytimg.com`

### 4. Add loading="lazy" to off-screen YouTube iframes
YouTube embeds in blocks below the fold should use `loading="lazy"` on the iframe.

**File**: `src/components/ui/NativeSafeYouTubeEmbed.tsx`
- Add `loading="lazy"` attribute to the iframe element

### 5. Preload YouTube IFrame API in bridge page
In `YouTubeBridgePage.tsx`, the IFrame API script tag can use `async` (already implicit) but we can also add a `dns-prefetch` inline for the video CDN.

**File**: `src/components/YouTubeBridgePage.tsx` — minor, low impact

---

## Expected Impact
- **Scores**: ~15 individual API calls → 1 batch call. Images appear 3-5× faster.
- **YouTube**: Marginal improvement from preconnect hints; lazy loading reduces initial page weight.

## Files to Change
1. `src/pages/BandView.tsx` — batch prefetch scores
2. `src/pages/PublicBandView.tsx` — batch prefetch scores  
3. `src/utils/scoreUrl.ts` — export sync cache lookup
4. `src/components/score/SignedScoreImage.tsx` — use sync cache
5. `index.html` — preconnect hints
6. `src/components/ui/NativeSafeYouTubeEmbed.tsx` — lazy loading
7. `src/components/dashboard/UpcomingServicesWidget.tsx` — batch prefetch (optional)


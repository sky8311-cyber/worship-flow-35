

# Fix: K-Worship Primary Branding & Remove Orphaned Index Page

## Problem

The `/index` route (which some users may land on) shows a bare placeholder page with "Welcome to KWorship" — no SEO, no branding, no logo, no value proposition. This gives the impression the platform identity is confused.

Meanwhile, the proper K-Worship landing is at `/` (MobileAppLanding.tsx), and Worship Atelier is correctly scoped to `/atelier-welcome`. The branding is actually fine across the platform — the issue is this orphaned `Index.tsx` page.

## Plan

### Step 1: Redirect `/index` to `/`
In `App.tsx`, add a redirect route so `/index` goes to the main landing page (`/` → MobileAppLanding):
```
<Route path="/index" element={<Navigate to="/" replace />} />
```

### Step 2: Clean up Index.tsx
Either delete `src/pages/Index.tsx` entirely (it's not imported anywhere) or repurpose it. Since it's orphaned, deletion is cleanest.

### Step 3: Verify Worship Atelier sub-branding
Ensure the Atelier section footer reads **"Worship Atelier by K-Worship"** (already correct) and that Atelier FAQ clearly states it's a feature of K-Worship (already correct in the FAQ content).

### Step 4: SEO audit pass
- `index.html` — already properly branded as K-Worship ✅
- `MobileAppLanding.tsx` SEOHead — already K-Worship ✅  
- `llms.txt`, `manifest.json`, `robots.txt` — verify K-Worship is primary name (quick check, fix if needed)

### Files Changed
| File | Action |
|------|--------|
| `src/App.tsx` | Add `/index` → `/` redirect |
| `src/pages/Index.tsx` | Delete (orphaned, unused) |

### What Won't Change
- Worship Atelier landing (`/atelier-welcome`) — this is a legitimate sub-brand/feature section, correctly positioned under K-Worship
- All other K-Worship branded pages — already correct




# Add Safe Area Top Spacing to Atelier & Institute Pages

## Problem
On the native iOS app, all pages created before Worship Atelier and Institute correctly use the `safe-top` CSS class (which applies `padding-top: env(safe-area-inset-top)`) to push content below the iPhone camera/notch area. The Atelier and Studio pages are missing this.

**What's missing:**
- `AtelierNav` — uses `fixed top-0` with no `safe-top` class
- `AtelierWelcome` page — no safe area padding on the container
- `StudioHeader` (Worship Studio) — no `safe-top` class
- `WorshipStudio` parent container — `fixed inset-0` without safe area offset

`InstituteHeader` already has `safe-top` ✓ — no change needed there.

## Changes

### 1. `src/components/atelier-landing/AtelierNav.tsx`
Add `safe-top` class to the `<nav>` element so the fixed nav bar sits below the notch.

### 2. `src/pages/AtelierWelcome.tsx`
Add `safe-top` to the outer `<div>` or add top padding so content below the fixed nav doesn't get hidden behind the notch area. Since the nav is fixed and already will get `safe-top`, the page body just needs matching top offset — the existing `pt-16` (implied by fixed nav) should account for the extra safe area. No change needed here if the nav handles it.

### 3. `src/components/worship-studio/StudioHeader.tsx`
Add `safe-top` class to the `<header>` element.

### 4. `src/pages/WorshipStudio.tsx`
The parent `div` uses `fixed inset-0`. Add `safe-top` class to ensure the entire studio layout starts below the notch.

**3 files changed, 3 one-line class additions.**


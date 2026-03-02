

## Fix: Reduce Excessive Top Spacing on iOS

### Problem
The header currently applies **both** `safe-top-offset` (top: env(safe-area-inset-top)) **and** `safe-top` (padding-top: env(safe-area-inset-top)) on the same element. This creates double the spacing -- the element is pushed down AND padded, resulting in the oversized gap you see in the simulator.

### Solution
Remove `safe-top-offset` from all sticky headers and keep only `safe-top`. For sticky elements, `top: 0` with internal safe-area padding is the correct approach -- the padding ensures content clears the status bar, while the element itself sticks to the top of the viewport.

### Files to Update (5 files, same one-line change each)

1. **`src/components/layout/AppHeader.tsx`** -- Remove `safe-top-offset` from header class
2. **`src/pages/auth/Login.tsx`** -- Remove `safe-top-offset` from header class
3. **`src/components/landing/LandingNav.tsx`** -- Remove `safe-top-offset` from both header elements
4. **`src/components/landing/PublicPageHeader.tsx`** -- Remove `safe-top-offset` from header class
5. **`src/components/admin/AdminNav.tsx`** -- Remove `safe-top-offset` from nav class

Each change is simply removing the word `safe-top-offset` from the className string, keeping `safe-top` in place.

### After Changes
Run `git pull`, `npm run build`, `npx cap sync ios`, then rebuild in Xcode to verify the spacing is correct.

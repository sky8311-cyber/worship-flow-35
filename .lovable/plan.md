

# Fix Safe-Area on FeatureComingSoon Page

## Problem
The screenshot shows the **FeatureComingSoon** gating page — not the actual Atelier Studio or landing page. This component renders when `isStudioEnabled` is `false`, and it's a full-screen fixed overlay with **no safe-area handling** on its header.

The previous fixes targeted `AtelierNav`, `StudioHeader`, `CanvasHeader`, and `InstituteHeader` — but none of those render on this screen. The `FeatureComingSoon` component has its own header that was never patched.

## Fix
**File: `src/components/common/FeatureComingSoon.tsx`** (1 change)

Add `pt-[env(safe-area-inset-top,0px)]` to the root `<div>` (line 31) so the entire fixed overlay respects the notch. This pushes the header and all content below the safe area.

```tsx
// Line 31: change
<div className="fixed inset-0 z-50 flex flex-col bg-background">
// to
<div className="fixed inset-0 z-50 flex flex-col bg-background pt-[env(safe-area-inset-top,0px)]">
```

This is a single-line fix that covers both the Atelier and Institute "coming soon" gating screens.


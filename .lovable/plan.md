

# Fix: Mobile 1F Cafe/Gallery Bottom Artifacts Clipped

## Root Cause

The `GroundFloorShops` container is `h-20` (80px). Inside each shop column:
- Awning: `h-3` (12px) + scallop `h-1.5` (6px) = 18px
- Label: ~8px
- **Remaining for SVG: ~54px**

The SVGs have `viewBox="0 0 120 70"` (aspect ratio 120:70 ≈ 1.71:1). At ~54px height, the rendered width would be ~92px, but the column is wider, so the SVG scales to fit width and the height exceeds 54px — bottom content (stools at y=62, bench legs at y=59) gets clipped by `overflow-hidden`.

## Solution (2 changes in 1 file)

### 1. Increase mobile 1F height: `h-20` → `h-28`
Line 362 — make height conditional:
```tsx
<div className={cn("flex border-t border-[#7a8a9a]", isMobile ? "h-28" : "h-20")}>
```
This gives ~112px total → ~84px for SVG area → enough for all bottom artifacts.

### 2. Anchor SVGs to bottom: `xMidYMid` → `xMidYMax`
Lines 209 and 278 — change `preserveAspectRatio` on both CafeSVG and GallerySVG:
```tsx
preserveAspectRatio="xMidYMax meet"
```
This ensures bottom elements (stools, bench, pedestals) are always visible first, with any clipping happening at the top instead.

### Files
- `src/components/worship-studio/StudioSidePanel.tsx` (3 line changes)

Desktop is unaffected since `GroundFloorShops` receives `isMobile` prop and desktop keeps `h-20`.


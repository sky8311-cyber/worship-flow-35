

# Mobile-Optimized Studio Building + Remove "아파트" References

## Summary
Two changes: (1) Render the full apartment building visual in the mobile bottom sheet instead of a plain list, and (2) replace all "아파트"/"Apartment" text with "K-Worship Studio".

## Changes

### 1. `src/pages/WorshipStudio.tsx`
- **Line 130**: Change `"아파트"` → `"K-Worship Studio"` and `"Apartment"` → `"K-Worship Studio"`
- **Mobile Sheet content**: Instead of rendering `StudioSidePanel` with `mode="sheet"` (which skips the building visuals), render it with a new mode like `"mobile"` that shows a scaled-down version of the full building with sky, rooftop, ground floor, etc.

### 2. `src/components/worship-studio/StudioSidePanel.tsx`
- Add a `"mobile"` mode alongside `"sidebar"` and `"sheet"`
- When `mode === "mobile"`: render the full building visual (sky background, rooftop sign, building body with scroll area, ground floor with doors/stairs, lawn, sidewalk, road) but adapted for full-width
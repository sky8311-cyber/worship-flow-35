

# Gothic Building Fixes: Star Removal + Entrance Downsizing

## Changes

### 1. Remove star from center finial (`GothicRoof.tsx`, line 100)
- Delete `<text x="6" y="1" fontSize="5" fill="#b8902a">★</text>` — daytime sky makes stars look out of place.

### 2. Drastically shrink entrance (`GothicEntrance.tsx`)
- Current entrance is ~55 SVG units tall with full columns, lancet windows, brick wall — way too large relative to building.
- Redesign to a compact ~30 SVG unit entrance: small pointed arch door centered on a narrow brick strip.
- Remove the large columns, lancet side windows, and wide brick background.
- Keep: small arch door, door split line, tiny knobs, minimal brick texture behind.
- Target rendered height: ~60px (about 1.5x a tenant unit row).
- Update the wrapper div padding from `px-2 pt-2 pb-0` to `px-2 pt-1 pb-0`.

### 3. Adjust `StudioSidePanel.tsx` entrance area
- The cornice divider above the entrance stays (h-2).
- The plinth below the entrance: reduce from `h-3` to `h-2`.
- Sidewalk: reduce from `h-2` to `h-1`.

## Files

| File | Change |
|------|--------|
| `GothicRoof.tsx` | Remove star text element (line 100) |
| `GothicEntrance.tsx` | Redesign to compact ~60px door, remove columns/lancet windows |
| `StudioSidePanel.tsx` | Reduce plinth + sidewalk heights |


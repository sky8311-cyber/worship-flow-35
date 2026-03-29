# Gothic Building Refinements

## 1. Two Gothic doors (GothicEntrance.tsx)

Replace the single centered door with two, symmetrical pointed-arch doors — proper Gothic double-door design. Each door gets its own arch, panels, split line, and knobs. Keep the stone block lines on the brick background surrounding both doors.

## 2. Stone block texture on entire base (GothicEntrance.tsx + StudioSidePanel.tsx)

- The entrance already has subtle brick/stone lines — extend them to fill the full width
- The plinth and cornice areas in StudioSidePanel already have stone texture — ensure consistency

## 3. Uniform building background on studio units (StudioSidePanel.tsx + StudioUnit.tsx)

Currently the building body has sandstone gradient (`#e8ddd0` → `#d4c5a9`) but each StudioUnit row has `bg-white` and `bg-white/80` windows on a transparent row background. The stone wall shows through between units but the individual unit windows are white.

**Change**: Give each StudioUnit row a subtle sandstone background matching the building wall (`bg-[#d4c5a9]/30` or similar) so units blend into the building rather than floating on transparent backgrounds. The windows (avatar, name, visit button) stay white — they represent actual windows in the facade.

## 4. Roof width fix (GothicRoof.tsx)

The roof SVG viewBox is `0 -10 240 120` but the building body below uses different container widths (`mx-3` sidebar, `mx-6` mobile). The roof has no horizontal margin, so it extends wider than the building walls.

**Fix**: Wrap the roof in the same `mx-3`/`mx-6` as the building body, or adjust the roof's container to match the building width exactly.

## Technical Details


| File                  | Changes                                                                                                             |
| --------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `GothicEntrance.tsx`  | Replace single door with two symmetric Gothic arch doors; keep stone block lines across full background             |
| `StudioUnit.tsx`      | No change needed — windows are white (correct for Gothic windows in stone wall)                                     |
| `StudioSidePanel.tsx` | Move `<GothicRoof>` inside the same `mx-3`/`mx-6` wrapper as the building body so roof width matches building width |
| `GothicRoof.tsx`      | No structural change needed                                                                                         |

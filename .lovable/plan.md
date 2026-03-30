

# Fix: Entrance Door Height + Rooftop Object Placement

## Problem 1: Entrance Door Too Tall
The entrance door column uses `flex-1` making it stretch to the full container height (`h-28` = 112px on mobile). A real door should be proportional — roughly 60-70% of the shop height, with a visible transom/wall above.

**Fix in `GroundFloorShops`** (lines 388-405):
- Remove `flex-1` from door frame, give it a fixed height (`h-16` on mobile, `h-12` on desktop)
- Add visible door knob circle (brass colored, ~2px diameter) at proper handle height (~40% from bottom)
- Add a small wall/transom area above the door arch
- Keep `justify-end` so door sits at ground level

## Problem 2: Rooftop Objects Floating on Railing
Currently all objects (trees, parasols, stage, instruments) are anchored to `h - 6` / `h - 7.5` which is essentially the railing top. There's no visible floor surface, so everything looks like it's balanced on the railing bars.

**Fix in `RooftopScene`** (lines 30-146):
- Add a visible rooftop floor rectangle below the railing (e.g. `y = h-3` to `h`, darker tone like `#8a9aaa`) — this represents the building's top surface
- Move the railing UP slightly so it sits on the floor edge (visual front-fence)
- Rebase all object positions: trees, parasols, and stage stand on the floor surface (behind railing)
- Instruments remain on the stage (their y-coordinates relative to `stageY` stay the same)
- Net effect: objects appear grounded on a solid surface with the railing as a decorative fence in front

## Files
- `src/components/worship-studio/StudioSidePanel.tsx`


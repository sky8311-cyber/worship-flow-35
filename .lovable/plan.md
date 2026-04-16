
# One-Shot Fix for Top Safe-Area Spacing on Atelier + Institute

## What’s actually wrong
The previous approach treated all pages the same, but these surfaces use 3 different layout patterns:

```text
1) Atelier landing: fixed top nav
2) Atelier studio/canvas: full-screen fixed shell + custom header
3) Institute: normal layout shell + shared header
```

That matters because `.safe-top` behaves differently in each case:

- On a **fixed nav** (`AtelierNav`), `safe-top` protects the nav itself, but it does **not** push the page content down.
- On a **full-screen fixed shell** (`WorshipStudio`), putting `safe-top` on both the shell and the header is the wrong pattern.
- On **Institute**, the safe area should be owned once at the shared header/layout boundary, not guessed per page.

I also found one more Atelier screen that would still stay broken if we only patched the visible pages:
- `CanvasEditor` uses a full-screen fixed shell and its header currently has no safe-area handling.

## One-shot fix
### 1) Fix Atelier landing correctly
Make the page content start below the fixed Atelier nav by adding a real top offset/spacer equal to:

`nav height + env(safe-area-inset-top)`

This will be applied in the landing page shell, not only on the nav.

Files:
- `src/pages/AtelierWelcome.tsx`
- `src/components/atelier-landing/AtelierNav.tsx`

### 2) Fix Atelier studio correctly
Use a single owner for the top safe area:
- remove top safe-area padding from the full-screen `WorshipStudio` wrapper
- keep the safe area on `StudioHeader` only
- harden the header as a non-shrinking top bar

Files:
- `src/pages/WorshipStudio.tsx`
- `src/components/worship-studio/StudioHeader.tsx`

### 3) Fix Atelier canvas too
Apply the same full-screen pattern as Studio:
- keep the shell clean
- move safe-area ownership to `CanvasHeader`

Files:
- `src/pages/CanvasEditor.tsx`
- `src/components/worship-studio/canvas/CanvasHeader.tsx`

### 4) Normalize Institute at the shared header boundary
Institute already routes through one shared layout, so the right fix is centralized:
- keep safe-area ownership at `InstituteHeader`
- harden the shared header/layout pattern so every Institute page inherits the same top spacing consistently

Files:
- `src/components/institute/InstituteHeader.tsx`
- if needed for full-height pages: `src/layouts/InstituteLayout.tsx`

## Technical details
### Safe-area ownership rule I will apply
```text
Fixed nav page:
- header gets safe-top
- page content gets explicit top offset

Full-screen fixed page:
- shell does NOT get safe-top
- header gets safe-top

Normal layout page:
- shared header gets safe-top
- main content stays in normal flow
```

### Why this is the right fix
- It avoids the current “safe-top in the wrong place” issue.
- It avoids double-applying the safe area on Studio.
- It fixes Atelier landing in the only place that can actually move the page start.
- It covers the hidden Atelier canvas route too, so this is truly one-shot.

## Files I expect to change
1. `src/pages/AtelierWelcome.tsx`
2. `src/components/atelier-landing/AtelierNav.tsx`
3. `src/pages/WorshipStudio.tsx`
4. `src/components/worship-studio/StudioHeader.tsx`
5. `src/pages/CanvasEditor.tsx`
6. `src/components/worship-studio/canvas/CanvasHeader.tsx`
7. `src/components/institute/InstituteHeader.tsx`
8. Possibly `src/layouts/InstituteLayout.tsx` for final layout hardening

## Expected result
- Atelier landing begins below the iPhone camera/notch area
- Atelier Studio top controls are correctly positioned with no overlap and no double inset
- Atelier Canvas matches the same safe-area behavior
- Institute pages inherit one consistent top spacing from the shared header
- The native app should finally match the older app pages’ top spacing behavior

## QA after implementation
I will verify all of these specifically:
- `/atelier-welcome`
- `/atelier`
- `/atelier/canvas/:canvasId`
- `/institute`
- full-height Institute pages like module/chapter screens

And because this is a native safe-area issue, the final validation should be done in the rebuilt iOS package, not only in web preview.

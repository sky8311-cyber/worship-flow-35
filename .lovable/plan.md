

# Fix: Studio Page Blank Screen & Missing Tabs

## Problem Summary

The `/studio` page is showing a blank screen where the tabs (Studio, Feed, New Post) and content area should appear. The issue is a combination of CSS height chain problems and a missing translation key.

---

## Root Causes

### 1. Height Chain Break in `StudioMainPanel.tsx`
The `TabsContent` elements are not properly configured for the flex height chain pattern. They use classes like `flex-1 h-0` but without `flex flex-col`, causing the inner content to collapse to zero height.

### 2. Missing `min-h-0` Constraint
Flexbox requires `min-h-0` on flex children to allow them to shrink below their content size. Without this, the overflow chain breaks.

### 3. Missing Translation Key
`navigation.studio` is referenced in `navigationConfig.ts` but doesn't exist in `translations.ts`. This causes a console warning and may affect navigation rendering.

---

## Solution

### File 1: `src/components/worship-studio/StudioMainPanel.tsx`

**Changes:**
- Add `min-h-0` to the root container for proper flexbox shrinking
- Update all `TabsContent` elements to include full flex chain: `flex-1 flex flex-col min-h-0`
- Keep existing `h-0 overflow-hidden mt-0 p-0` overrides

**Current (broken):**
```tsx
<TabsContent value="studio" className="flex-1 h-0 flex flex-col overflow-hidden mt-0 p-0">
```

**Fixed:**
```tsx
<TabsContent value="studio" className="flex-1 flex flex-col min-h-0 overflow-hidden mt-0 p-0">
```

Apply this pattern to all `TabsContent` elements (studio, feed, newpost, discover).

### File 2: `src/lib/translations.ts`

**Changes:**
- Add `studio: "Studio"` under `navigation` in English translations (around line 134)
- Add `studio: "스튜디오"` under `navigation` in Korean translations

---

## Technical Details

### Height Chain Pattern (from project memory)

For proper rendering, the flex chain must be:
```
Parent: flex flex-col h-full overflow-hidden
  └─ Child: flex-1 flex flex-col min-h-0 overflow-hidden
       └─ Scrollable: flex-1 overflow-y-auto
```

The `min-h-0` is critical for preventing flex items from overflowing their container.

### Files Modified

| File | Change |
|------|--------|
| `src/components/worship-studio/StudioMainPanel.tsx` | Add `min-h-0` to root, fix all TabsContent flex chains |
| `src/lib/translations.ts` | Add `navigation.studio` key in both languages |

---

## Expected Result

1. Studio page tabs appear correctly
2. Content area renders (either Studio view with cover/posts or Contract prompt for new users)
3. Navigation menu shows correct "Studio" label instead of the key fallback


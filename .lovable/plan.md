

# Route Consolidation: `/rooms` → `/studio` + Blank Page Fix

## Current Problems

### 1. Duplicate Routes
Both `/rooms` and `/studio` exist and point to the same component - confusing and inconsistent.

### 2. URL References Still Use `/rooms`
```typescript
// WorshipStudio.tsx line 69
window.history.replaceState(null, '', `/rooms/${studioId}`);

// WorshipStudio.tsx line 74  
window.history.replaceState(null, '', '/rooms');
```

### 3. Navigation Config Uses `/rooms`
```typescript
// navigationConfig.ts
to: "/rooms",
match: (path: string) => path.includes("/rooms"),
```

### 4. Blank Page Issue
The flex height chain uses `h-0 flex-1` pattern which is documented in project memory as potentially causing "zero-height" rendering bugs. The `StudioView` wrapper uses `flex-1 overflow-y-auto` but may not be getting proper height from parent chain.

---

## Solution

### Part 1: Consolidate to `/studio`

**File: `src/App.tsx`**
- Remove `/rooms` routes (lines 221-222)
- Keep only `/studio` routes (lines 223-224)

**File: `src/pages/WorshipStudio.tsx`**
- Update `handleStudioSelect` to use `/studio/${studioId}` (line 69)
- Update `handleMyStudioSelect` to use `/studio` (line 74)

**File: `src/lib/navigationConfig.ts`**
- Change `to: "/rooms"` → `to: "/studio"`
- Change `match` function to check for `/studio`
- Update `labelKey` to `"navigation.studio"` (more semantic)

---

### Part 2: Fix Blank Page

The issue is the height chain for `StudioView`. According to the memory pattern documented in `layout-height-chain-pattern`, the container must maintain proper flex chain.

**File: `src/components/worship-studio/StudioView.tsx`**
- Wrap the return content in a div with proper height chain classes
- Ensure the outer div has `flex-1 flex flex-col h-full overflow-hidden`
- Inner scrollable area keeps `flex-1 overflow-y-auto`

**File: `src/components/worship-studio/StudioMainPanel.tsx`**
- Verify TabsContent has proper flex structure
- TabsContent default has `mt-2` - confirm override is working

---

## Technical Details

### Route Changes

| Before | After |
|--------|-------|
| `/rooms` | `/studio` |
| `/rooms/:roomId` | `/studio/:roomId` |

### File Modifications

| File | Changes |
|------|---------|
| `src/App.tsx` | Remove `/rooms` routes, keep `/studio` |
| `src/pages/WorshipStudio.tsx` | Update history.replaceState URLs |
| `src/lib/navigationConfig.ts` | Update to `/studio`, update match logic |
| `src/components/worship-studio/StudioView.tsx` | Fix height chain for content rendering |

---

## Expected Result

1. Navigation uses `/studio` consistently
2. Old `/rooms` URLs return 404 (clean break - no legacy support needed)
3. Studio page renders properly with contract prompt for new users or post list for existing users


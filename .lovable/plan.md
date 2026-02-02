
# Fix: Multiple Frame Rendering Issue in Worship Studio

## Problem Analysis

From a senior designer perspective, the current UX is broken:

1. **스튜디오 tab**: Content only appears in top portion - works but unclear if this is a container issue
2. **새 글 tab**: Massive empty space above, editor pushed to bottom - there appear to be 3 stacked "frames"

### Root Cause

Radix Tabs renders ALL TabsContent elements in the DOM but uses CSS (`data-[state=inactive]:hidden`) to hide inactive ones. The problem:

1. **Current**: Each TabsContent has `flex-1` which makes ALL tabs compete for flex space
2. **Result**: Even "hidden" tabs take up layout space, creating stacked frames
3. **The "3 frames"**: Tab header + inactive tabs (taking space) + active tab content at bottom

### Why This Happened

The `flex-1` class on TabsContent tells each to grow equally. When combined with Radix's rendering model, inactive tabs still occupy flex space even though they're visually hidden.

---

## Solution: Single Frame Architecture

### Design Principle (Meta Approach)
> "One viewport, one content area. Tab content should replace, not stack."

### File Changes

#### 1. `src/components/worship-studio/StudioMainPanel.tsx`

**Change**: Remove `flex-1` from TabsContent - only the active tab should expand. Use `data-[state=active]:flex-1` pattern instead.

```tsx
// BEFORE: All tabs fight for flex space
<TabsContent value="studio" className="flex-1 flex flex-col min-h-0 overflow-hidden mt-0 p-0">

// AFTER: Only active tab takes space
<TabsContent value="studio" className="flex flex-col min-h-0 overflow-hidden mt-0 p-0 data-[state=active]:flex-1 data-[state=inactive]:hidden">
```

Apply this pattern to ALL TabsContent elements.

**Alternative approach** (simpler): Add `forceMount={false}` isn't available in Radix, but we can use the hiding approach:

```tsx
<TabsContent 
  value="studio" 
  className="mt-0 p-0 data-[state=active]:flex data-[state=active]:flex-col data-[state=active]:flex-1 data-[state=active]:min-h-0 data-[state=active]:overflow-hidden"
>
```

This ensures flex properties ONLY apply when the tab is active.

#### 2. Fix inner content components

Each content component needs proper height chain:

**StudioView.tsx** (already correct)
```tsx
<div className="flex-1 flex flex-col h-full overflow-hidden">
  <div className="flex-1 overflow-y-auto">
```

**StudioPostEditor.tsx** (needs fix)
```tsx
// BEFORE
<div className="flex flex-col h-full">

// AFTER  
<div className="flex-1 flex flex-col min-h-0 overflow-hidden">
```

**StudioFeed.tsx** (already correct with `h-full`)

---

## Implementation Details

### File 1: `src/components/worship-studio/StudioMainPanel.tsx`

Lines 73, 80, 85, 94 - Update all TabsContent:

```tsx
<TabsContent 
  value="studio" 
  className="mt-0 p-0 data-[state=active]:flex data-[state=active]:flex-1 data-[state=active]:flex-col data-[state=active]:min-h-0 data-[state=active]:overflow-hidden"
>
```

### File 2: `src/components/worship-studio/StudioPostEditor.tsx`

Line 74 - Fix root container:

```tsx
<div className="flex-1 flex flex-col min-h-0 overflow-hidden">
```

Line 110 - ScrollArea needs proper sizing:

```tsx
<ScrollArea className="flex-1 min-h-0">
```

---

## Expected Result

```
┌─────────────────────────────────────┐
│  Header: 예배공작소                   │
├─────────────────────────────────────┤
│  Tabs: [스튜디오] [피드] [새 글]       │
├─────────────────────────────────────┤
│                                     │
│  ← Single unified content area      │
│                                     │
│  (Only active tab visible)          │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

Instead of the current:
```
┌─────────────────────────────────────┐
│  Header                             │
├─────────────────────────────────────┤
│  Tabs                               │
├─────────────────────────────────────┤
│  Frame 1 (empty - inactive tab)     │
├─────────────────────────────────────┤
│  Frame 2 (empty - inactive tab)     │
├─────────────────────────────────────┤
│  Frame 3 (actual content)           │
└─────────────────────────────────────┘
```

---

## Files Modified

| File | Change |
|------|--------|
| `src/components/worship-studio/StudioMainPanel.tsx` | Conditional flex via `data-[state=active]` |
| `src/components/worship-studio/StudioPostEditor.tsx` | Fix root container flex chain |

## Testing Checklist

After implementation, verify:
- [ ] 스튜디오 tab shows cover + posts filling viewport
- [ ] 피드 tab shows feed content from top
- [ ] 새 글 tab shows editor from top, not pushed to bottom
- [ ] No empty "frames" or gaps between tabs
- [ ] Mobile view works correctly


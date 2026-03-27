

## Fix: Course Card Title Overlap & Background Issue

### Problem
In `src/pages/Institute.tsx` (lines 462-492), when a course has no `thumbnail_url`:
1. The **fallback gradient div** (line 471-477) renders the course title inside itself
2. The **outer overlay + title block** (lines 479-491) renders the title **again** on top
3. Two gradient overlays stack (`from-black/60` + `from-black/70`), making it overly dark

### Fix — `src/pages/Institute.tsx`

**Remove the duplicate title from the fallback div** (lines 471-477):
- Keep the gradient background and BookOpen icon
- Remove the inner `from-black/60` overlay div and the inner `<h3>` title
- The outer overlay (line 479) and outer title block (lines 480-491) already handle this correctly for both cases (with thumbnail and without)

The fallback block becomes simply:
```jsx
<div className="w-full h-full bg-gradient-to-br from-primary/80 to-primary/30 flex items-center justify-center">
  <BookOpen className="w-10 h-10 text-primary-foreground/40" />
</div>
```

The outer gradient overlay and title block (lines 479-491) remain unchanged — they already handle displaying the title, badge, lock icon, and module count for all cases.

**Single file edit**: `src/pages/Institute.tsx` lines 471-477 only.


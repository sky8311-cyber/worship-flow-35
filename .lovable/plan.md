

# Fix Vertically Stretched Moon

## Problem
The `NightSkyStars` SVG has `preserveAspectRatio="none"`, which stretches the moon circles to match the container dimensions. Since the container is typically taller than the viewBox ratio, the moon appears vertically elongated.

## Solution
Move the moon out of the stretched SVG and render it as a separate absolutely-positioned element (or a second SVG with proper aspect ratio). The stars can remain in the `preserveAspectRatio="none"` SVG since tiny dots aren't visibly affected by stretching.

## Changes — `src/components/worship-studio/StudioSidePanel.tsx`

In the `NightSkyStars` component (around lines 66-90):

1. Remove the moon circles (lines 68-70) from the main SVG
2. Add a separate `div` or small SVG after the main SVG for the moon, positioned at roughly `right-[20%] top-[8%]` with fixed pixel dimensions so it maintains a perfect circle shape

```tsx
return (
  <>
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
      {/* Stars only */}
      {stars.map((s, i) => (
        // ... existing star code
      ))}
    </svg>
    {/* Moon rendered separately to avoid stretching */}
    <svg className="absolute pointer-events-none" style={{ right: '20%', top: '8%', width: 20, height: 20 }} viewBox="0 0 20 20">
      <circle cx={10} cy={10} r={7} fill="#f5e6a0" opacity={0.9} />
      <circle cx={13} cy={9} r={6} fill="#0a0e2a" />
    </svg>
  </>
);
```

**File:** `src/components/worship-studio/StudioSidePanel.tsx`


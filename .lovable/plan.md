

# Door Handles + No Rounded Corners

## Changes in `StudioSidePanel.tsx`

**Expanded door (lines 284-285)**: Change `rounded-sm` to `rounded-none`. Add a small door handle dot to each panel using a `relative` container with an absolutely-positioned handle element.

```tsx
{/* Left door */}
<div className="w-6 h-12 rounded-none border border-[#5a5a5a] bg-sky-100/60 relative">
  <div className="absolute right-1 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-[#5a5a5a]" />
</div>
{/* Right door */}
<div className="w-6 h-12 rounded-none border border-[#5a5a5a] bg-sky-100/60 relative">
  <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-[#5a5a5a]" />
</div>
```

**Collapsed door (lines 295-296)**: Same treatment — `rounded-none` + smaller handles.

Handles are placed on the inner edges (right side of left door, left side of right door) at vertical center.


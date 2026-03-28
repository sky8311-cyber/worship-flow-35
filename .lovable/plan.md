

# Cyworld Aesthetic Upgrade — 5 Changes

## 1. Square Window-Style Tenant Rows (StudioUnit.tsx)

Replace current row layout with 3 side-by-side rectangular "window" frames:

- **Avatar window**: Square frame (`w-8 h-8 rounded-sm border border-[#8a7a6a] shadow-inner bg-white`), avatar/initials inside with `object-cover`
- **Name window**: Rectangular frame (`flex-1 h-8 rounded-sm border border-[#8a7a6a] shadow-inner bg-white/80 px-1.5 flex items-center`), studio name text inside, truncated
- **Visit button window**: Rectangular frame (`w-12 h-8 rounded-sm border border-[#8a7a6a] shadow-inner`), "방문" text centered, hover brightens

All three use consistent window-frame style: thin dark border, 2px rounded corners, subtle `shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]`.

Collapsed mode: keep single square avatar window only.

## 2. Glass Entrance Door (StudioSidePanel.tsx)

Insert between building body bottom and sidewalk — inside the `mx-3` wrapper:

```
<div className="shrink-0 bg-stone-100 border-x border-[#d8cfc4] px-2 py-1.5 flex items-center gap-1">
  {/* Left badge */}
  <div className="text-[7px] font-bold border border-black bg-white px-1 py-0.5 rounded-sm whitespace-nowrap">
    K-Worship Studio
  </div>
  {/* Double glass door */}
  <div className="flex-1 flex gap-px justify-center">
    <div className="w-6 h-10 rounded-sm border border-[#5a5a5a] bg-sky-100/60" />
    <div className="w-6 h-10 rounded-sm border border-[#5a5a5a] bg-sky-100/60" />
  </div>
  {/* Right badge */}
  <div className="text-[7px] font-bold border border-black bg-white px-1 py-0.5 rounded-sm whitespace-nowrap">
    kworship.app
  </div>
</div>
```

## 3. Lawn/Garden Strip (StudioSidePanel.tsx)

Replace current sidewalk (`h-3 bg-[#a89070]`) with:
- **Lawn strip** (`h-4 bg-gradient-to-b from-[#6aaf50] to-[#4a8f35]`) with tiny flower/hedge emojis (`🌷🌿`)
- **Sidewalk** below it (`h-2 bg-[#a89070]`)

Order inside mx-3 wrapper: building body → entrance door → lawn → sidewalk → road.

## 4. Cyworld Folder Tab Style (SpaceTabBar.tsx)

Replace current underline-style tabs with physical folder tabs:

- Container: `border-b-0` (remove bottom border from container), add `relative` and bottom alignment
- Active tab: `bg-white border border-b-0 border-[#d0c8bc] rounded-t-md -mb-px z-10 font-semibold text-sm px-4 py-2`
- Inactive tab: `bg-[#e8e0d5] border border-[#d0c8bc] rounded-t-md text-sm px-3 py-1.5 text-muted-foreground hover:bg-[#f0e8dd]`
- Active tab is taller (py-2 vs py-1.5) and overlaps the content border below via `-mb-px`
- Content area below should have `border-t border-[#d0c8bc]` that the active tab covers

## 5. Rooftop Sign Redesign (StudioSidePanel.tsx)

Replace current building sign (inside buildingContent, line 77) with a standalone sign above the building, in the rooftop spacer area (line 286):

- Remove the text sign from `buildingContent` (lines 76-80)
- In the rooftop spacer, render:
  ```
  <div className="relative z-10 h-10 shrink-0 flex flex-col items-center justify-end">
    {/* Sign */}
    <div className="border border-black bg-white px-2 py-0.5 text-[8px] font-bold tracking-wider text-black rounded-sm shadow-sm">
      K-Worship Studio
    </div>
    {/* Poles */}
    <div className="flex gap-6">
      <div className="w-px h-2 bg-[#555]" />
      <div className="w-px h-2 bg-[#555]" />
    </div>
  </div>
  ```
- Sign floats against sky background, poles connect it visually to the roofline

## 6. Remove Floor Labels & Dividers (StudioSidePanel.tsx)

- Remove all `PH`, `6F`, `5F`, `3F`, `2F`, `1F` floor labels
- Remove `border-t border-border/30` divider rows
- Remove dashed separator between friends and ambassadors (line 176)
- Keep section headers ("이웃", "앰배서더") but remove floor badges
- Tenants listed continuously

## Files Modified

| File | Changes |
|---|---|
| `StudioUnit.tsx` | Window-frame row layout (3 rectangular frames) |
| `StudioSidePanel.tsx` | Rooftop sign, entrance door, lawn strip, remove floor labels/dividers |
| `SpaceTabBar.tsx` | Cyworld folder-tab styling |


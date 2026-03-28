

# Phase G — Apartment View Redesign + Collapse/Expand

## Overview
Redesign StudioSidePanel as a pyramid-shaped apartment building cross-section with collapsible toggle, floor labels, window lights, rooftop garden, and variant-styled visit buttons.

## Files to Modify

### 1. `src/components/worship-studio/StudioUnit.tsx`
- Add `collapsed: boolean` prop
- **Collapsed mode**: Show avatar only (centered, no text/buttons)
- **Window lights**: 2 mini rectangles (w-2 h-1.5 rounded-sm) on right side of each unit
  - penthouse: amber-300/amber-200
  - friend: random amber-200 or slate-200
  - ambassador: violet-100/violet-50
- **Visit button redesign**: Full-width pill button below info area
  - penthouse: amber palette + 🔔
  - friend: sky palette + 🚪
  - ambassador: violet palette + ✦
- Hide visit button and windows when collapsed

### 2. `src/components/worship-studio/StudioSidePanel.tsx`
- Add `const [collapsed, setCollapsed] = useState(false)`
- **Panel width**: `collapsed ? 'w-14' : 'w-56'`, with `transition-all duration-300 ease-in-out`
- **Chevron toggle button**: Absolute positioned on right edge, translates out by half, `ChevronLeft`/`ChevronRight` from lucide-react
- **Building exterior gradient**: `bg-gradient-to-b from-slate-50 via-[#faf7f2] to-stone-50`, border-r border-[#e8e0d5], inset shadow
- **Pyramid margins** (applied to inner content of each section):
  - Penthouse: mx-3
  - Friends: mx-1
  - Ambassadors: mx-0
- **Floor badges** on section headers:
  - PH: amber, 2F: slate-400, 1F: slate-300 — text-[9px] font-mono
- **Rooftop garden** above penthouse: 🌿🌳🌿 emoji strip
- Penthouse section bg: `bg-gradient-to-b from-sky-50/60 to-amber-50/70`
- Pass `collapsed` prop to all `StudioUnit` instances
- Collapsed mode: hide section labels, show only avatars

## Technical Notes
- No changes to routing, hooks, SpaceTabBar, or GuestbookPanel
- All styling via Tailwind classes; emoji decorations are `select-none pointer-events-none`
- Panel container uses `overflow-visible` so chevron button can protrude


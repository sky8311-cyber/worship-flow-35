

## Plan: Breadcrumbs, Logo Size, Sticky Nav Bars, and Floating Add Block

Four changes across multiple files.

---

### 1. Breadcrumb Navigation for Institute Pages

Add breadcrumbs to `InstituteCourse`, `InstituteModule`, and `InstituteChapter` pages. Pass a `breadcrumb` prop through `InstituteLayout` → `AppLayout` → `AppHeader`.

**InstituteLayout** — Accept and forward `breadcrumb` prop to `AppLayout`.

**InstituteCourse** — Breadcrumb: `Institute > [Course Name]`

**InstituteModule** — Breadcrumb: `Institute > [Course Name] > [Module Name]`

**InstituteChapter** — Breadcrumb: `Institute > [Course Name] > [Module Name] > [Chapter Name]`

Each segment is a clickable `Link`. Uses existing `Breadcrumb` components from `src/components/ui/breadcrumb.tsx`. Shown beside the Home icon on desktop, and in the mobile breadcrumb row below the header.

---

### 2. K-Worship Institute Logo 2.5x Larger

**HeaderLogo.tsx** — Change the institute logo from `h-10 md:h-14` to `h-[60px] md:h-[88px]` (roughly 2.5x the current mobile size of ~24px rendered).

---

### 3. Sticky Bottom Nav for Chapter and Module Pages (이전/완료 bar)

The 이전/완료&다음 bar in `InstituteChapter.tsx` and `InstituteModule.tsx` must always sit at the bottom of the viewport, above the bottom tab nav, with content scrolling above it.

**InstituteChapter.tsx** and **InstituteModule.tsx**:
- Remove `InstituteLayout` wrapping (which adds its own padding/scroll) and instead use a custom full-height layout.
- The page structure becomes: `height: 100dvh` flex column with header at top, scrollable content in middle, and the 이전/완료 bar fixed at the bottom.
- Alternatively (simpler): Change the bottom nav `div` from `flex-shrink-0` to `sticky bottom-0` or make the outer container use `h-[calc(100dvh-header)]` with `flex flex-col`, content area `flex-1 overflow-y-auto`, and nav bar pinned at bottom.
- The key change: wrap the page in a flex column that fills the viewport minus header and bottom tab nav. The content scrolls within `flex-1 overflow-y-auto`, and the 이전/완료 bar stays pinned below it.

Both pages already have the right flex structure (`flex-1 flex flex-col min-h-0` with `flex-1 overflow-y-auto` for content). The issue is the parent `InstituteLayout` → `AppLayout` uses a `<main>` with large `paddingBottom` and no height constraint. 

**Solution**: 
- In `InstituteLayout`, pass a `stickyFooter` mode that makes `AppLayout`'s `<main>` use `flex-1 overflow-hidden` instead of `pb-36`.
- Or simpler: Make the chapter/module pages' outer wrapper use `h-[calc(100dvh-<header>-<bottomnav>)]` so the flex layout works within a fixed height, and the bottom nav bar is always visible without scrolling.
- The cleanest approach: Add a `fullHeight` prop to `InstituteLayout`/`AppLayout`. When true, the `<main>` becomes `flex-1 flex flex-col overflow-hidden` with no bottom padding, so children control their own scroll. The 이전/완료 bar naturally sits at the bottom.

**Files**: `AppLayout.tsx`, `InstituteLayout.tsx`, `InstituteModule.tsx`, `InstituteChapter.tsx`

---

### 4. Floating "블록 추가" Bar in ChapterBlockEditor

**ChapterBlockEditor.tsx** — Move the "블록 추가" button from inline (inside the scrollable content) to a sticky/fixed bar at the bottom of the editor, above the bottom tab nav. 

- Remove the current inline "Add block" div (lines 468-482).
- Add a new bar between the scrollable editor area and the command menu: `<div className="border-t border-border px-4 py-2 bg-card flex items-center gap-2 flex-shrink-0">` containing the Plus button and hint text.
- Since `ChapterBlockEditor` is already `fixed inset-0 z-50`, this bar will naturally sit at the bottom of the full-screen editor overlay, always visible.

---

### Summary of File Changes

| File | Change |
|------|--------|
| `src/layouts/InstituteLayout.tsx` | Add `breadcrumb` and `fullHeight` props, forward to AppLayout |
| `src/components/layout/AppLayout.tsx` | Add `fullHeight` prop; when true, main becomes flex-1 with no bottom padding |
| `src/components/layout/HeaderLogo.tsx` | Institute logo size 2.5x larger |
| `src/pages/InstituteCourse.tsx` | Add breadcrumb |
| `src/pages/InstituteModule.tsx` | Add breadcrumb + use fullHeight layout |
| `src/pages/InstituteChapter.tsx` | Add breadcrumb + use fullHeight layout |
| `src/components/institute/faculty/ChapterBlockEditor.tsx` | Move "블록 추가" to sticky bottom bar |


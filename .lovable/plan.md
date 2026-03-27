

## Plan: Drag-and-Drop Curriculum Tree + Logo Update

### 1. Logo Replacement and Resize

**File: `src/assets/`**
- Copy the uploaded `Kworship_Institute_Logo_horizontal.png` to `src/assets/kworship-institute-logo.png` (replacing the existing file).

**File: `src/components/layout/HeaderLogo.tsx`**
- Increase logo size by 1.5x: from `h-[60px] md:h-[88px]` to `h-[90px] md:h-[132px]`.

### 2. Drag-and-Drop Curriculum Tree

**File: `src/components/institute/AdminInstituteContentTree.tsx`**

The current tree uses static rendering with manual sort_order inputs. Restructure to support drag-and-drop reordering using `@dnd-kit` (already in the project).

**Approach — per-level sortable lists:**
- Wrap each group of sibling nodes (pathways list, courses within a pathway, modules within a course, chapters within a module) in its own `<SortableContext>`.
- Add a `<DndContext>` at the top level with a custom `onDragEnd` that determines which table and parent to update based on the dragged item's prefix (`pw-`, `c-`, `m-`, `ch-`).
- Convert `TreeNode` into a sortable item using `useSortable`, adding a drag handle (`GripVertical` icon, already imported).
- On drop, compute new `sort_order` values for all siblings and batch-update the corresponding database table.
- Optimistically reorder in the query cache for instant feedback.

**Key constraints:**
- Items can only be reordered within their sibling group (same parent). Cross-parent moves remain via the edit panel's pathway selector.
- The `GripVertical` icon serves as the drag handle; clicking the row still selects it for editing.

**Reorder mutation pattern (same as `FacultyModulePanel`):**
```
const updates = reordered.map((item, i) => 
  supabase.from(tableName).update({ sort_order: i }).eq("id", item.id)
);
await Promise.all(updates);
```

Applied to 4 tables: `institute_certifications`, `institute_certification_courses` (sort_order for courses within pathway), `institute_modules`, `institute_chapters`.


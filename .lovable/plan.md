

## Plan: Cross-Parent Drag-and-Drop in Curriculum Tree

### What Changes
Enable moving items freely between parent nodes in the curriculum tree — chapters can move to any module, modules to any course, courses to any pathway — via both drag-and-drop and edit panel dropdowns.

### Current Limitation
Drag-and-drop only reorders within the same parent (same-prefix matching in `handleDragEnd`). No parent selectors exist for modules or chapters in the edit panel.

### Implementation

**File: `src/components/institute/AdminInstituteContentTree.tsx`**

#### 1. New Mutations for Cross-Parent Moves

- **`moveModule`**: Updates `institute_modules.course_id` to move a module to a different course. Also resets `sort_order` to append at end of new parent.
- **`moveChapter`**: Updates `institute_chapters.module_id` to move a chapter to a different module. Same sort_order logic.
- Existing `moveCourse` already handles course↔pathway reassignment.

#### 2. Enhanced `handleDragEnd` — Cross-Parent Detection

Change collision/drop logic so that:
- **Chapter (`ch-`) dropped on a Module node (`m-`)**: Call `moveChapter` to reassign `module_id`
- **Module (`m-`) dropped on a Course node (`cc-` or `c-`)**: Call `moveModule` to reassign `course_id`  
- **Course (`cc-`) dropped on a Pathway node (`pw-`)**: Call `moveCourse` to reassign pathway
- Same-parent reorder continues to work as before (when both active and over share the same prefix and parent)

The key change: instead of requiring both `active` and `over` to have the same prefix, we check if `over` is a valid parent type for `active`. We extract the real entity ID from the prefix to perform the update.

#### 3. Edit Panel — Add Parent Selectors

- **Module edit panel** (line ~598): Add a "코스" dropdown listing all courses, calling `moveModule` on change
- **Chapter edit panel** (line ~635): Add a "모듈" dropdown listing all modules (grouped by course for clarity), calling `moveChapter` on change

#### 4. Visual Drop Indicator

Add a highlight style when dragging over a valid parent node (e.g., light blue background on a module node when a chapter is being dragged over it). This uses `useDroppable` or checking `over` state from DndContext.

### Summary of Changes

| Area | Change |
|------|--------|
| Mutations | Add `moveModule`, `moveChapter` |
| `handleDragEnd` | Allow cross-prefix drops: `ch→m`, `m→cc/c`, `cc→pw` |
| Module edit panel | Add course selector dropdown |
| Chapter edit panel | Add module selector dropdown |
| Visual feedback | Highlight valid drop targets during drag |


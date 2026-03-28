# Worship Studio — Architecture Blueprint

> Generated: 2026-03-28 | For Claude handoff context

---

## 1. Overview

**Worship Studio** (예배공작소 / "Living Atelier") is a creative space for worship leaders to share, collaborate, and craft worship content. It combines:
- A **personal studio room** per user (like an Instagram profile)
- A **block-based Canvas Editor** (like Notion)
- A **social feed** with friend/ambassador discovery
- A **Kanban board** for workflow management

**Route**: `/studio`, `/studio/:roomId`, `/studio/canvas/:canvasId`  
**Feature gate**: `app_settings.studio_enabled` via `useAppSettings()`  
**Tier gates**: `studio_comment`, `studio_publish` features; `can_view_room()` DB function

---

## 2. Database Schema

### 2.1 `worship_rooms` — Personal Studio

Each user gets one studio (1:1 with profiles).

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `owner_user_id` | uuid FK → profiles | **unique** (oneToOne) |
| `studio_name` | text | Display name |
| `bgm_song_id` | uuid FK → songs | Background music |
| `cover_image_url` | text | |
| `visibility` | enum `room_visibility` | `public` / `friends` / `private` |
| `status_emoji` | text | Status indicator |
| `status_text` | text | |
| `layout_type` | text | Grid layout mode |
| `grid_columns` | int | |
| `max_widgets` | int | |
| `theme_config` | jsonb | Custom theme |
| `is_active` | bool | |

### 2.2 `room_posts` — Canvas / Post Container

A "Canvas" is a `room_post` record. Each post belongs to a room.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `room_id` | uuid FK → worship_rooms | |
| `author_user_id` | uuid FK → profiles | |
| `post_type` | enum `room_post_type` | `general`, etc. |
| `title` | text | |
| `content` | text | Legacy plain text |
| `blocks` | jsonb | Legacy JSONB block format |
| `block_type` | text | `song` \| `worship_set` \| `scripture` \| `prayer_note` \| `audio` \| `note` |
| `workflow_stage` | text | `draft` \| `in_progress` \| `refined` \| `published` |
| `display_type` | text | `list` \| `card` \| `gallery` |
| `cover_image_url` | text | |
| `is_draft` | bool | Derived from workflow_stage |
| `is_pinned` | bool | |
| `visibility` | enum `room_visibility` | |

### 2.3 `canvas_blocks` — Structured Block Content

Individual blocks within a canvas. Replaces legacy JSONB `blocks` column.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `canvas_id` | uuid FK → room_posts | |
| `block_type` | text | Same enum as room_posts.block_type |
| `position` | int | Sort order |
| `content` | jsonb | Block-specific payload |

### 2.4 Related Tables

- **`room_reactions`** — Emoji reactions (`amen`, `praying`, `like`) on posts
- **`room_widgets`** — Grid widgets for studio homepage (text, image, quote, song, bible-verse, profile-card, etc.)
- **`studio_post_categories`** — Admin-managed post categories with i18n labels
- **`friends`** — Friend graph (status: `pending` / `accepted` / `rejected`)

---

## 3. TypeScript Types

```typescript
// src/hooks/useStudioPosts.ts
type WorkflowStage = "draft" | "in_progress" | "refined" | "published";
type BlockType = "song" | "worship_set" | "scripture" | "prayer_note" | "audio" | "note";
type DisplayType = "list" | "card" | "gallery";

interface StudioPost {
  id: string;
  room_id: string;
  author_user_id: string;
  title: string | null;
  content: string;
  blocks: BlockContent[];       // Legacy JSONB
  block_type: BlockType;
  workflow_stage: WorkflowStage;
  display_type: DisplayType;
  cover_image_url: string | null;
  is_draft: boolean;
  is_pinned: boolean;
  visibility: RoomVisibility | null;
  author?: { id; full_name; avatar_url };
  reactions?: { reaction_type; count; user_reacted }[];
}

// src/hooks/useCanvas.ts
interface CanvasBlock {
  id: string;
  canvas_id: string;
  block_type: BlockType;
  position: number;
  content: Record<string, any>;  // Block-specific payload
}

interface Canvas {
  id: string;                    // = room_posts.id
  title: string | null;
  workflow_stage: WorkflowStage;
  block_type: BlockType;
  room_id: string;
}

// src/hooks/useStudioWidgets.ts
type WidgetType = "text" | "heading" | "quote" | "callout" | "image" | "video"
  | "post" | "todo" | "numbered-list" | "bullet-list" | "divider"
  | "external-link" | "song" | "recent-drafts" | "gallery" | "bible-verse" | "profile-card";
```

---

## 4. Hooks

| Hook | File | Purpose |
|------|------|---------|
| `useCanvas(canvasId?)` | `useCanvas.ts` | CRUD for canvas + blocks (add/update/remove/reorder/publish) |
| `useStudioPosts(roomId?, includeDrafts?)` | `useStudioPosts.ts` | Fetch posts for a room with reactions |
| `useCreateStudioPost()` | `useStudioPosts.ts` | Create new post |
| `useUpdateStudioPost()` | `useStudioPosts.ts` | Update existing post |
| `useDeleteStudioPost()` | `useStudioPosts.ts` | Delete post |
| `useStudioFeed(options?)` | `useStudioFeed.ts` | Social feed (friends + ambassadors + public) |
| `useStudioWidgets(roomId?)` | `useStudioWidgets.ts` | CRUD for grid widgets |
| `useStudioCategories()` | `useStudioCategories.ts` | Post categories (admin-managed) |
| `useWorshipRoom(ownerUserId?)` | `useWorshipRoom.ts` | Fetch room by owner |
| `useWorshipRoomById(roomId?)` | `useWorshipRoom.ts` | Fetch room by ID |
| `useStoryBarStudios(myStudioId?)` | `useStoryBarStudios.ts` | Story bar data (friends + ambassadors, sorted by activity + visit frequency) |
| `useRoomPosts(roomId?)` | `useRoomPosts.ts` | Legacy post fetcher |

---

## 5. Page & Component Architecture

### 5.1 Page: `WorshipStudio` (`/studio`)

```
WorshipStudio.tsx
├── StudioHeader          — Avatar dropdown + Mini BGM Player (marquee title)
├── StoryBar              — Instagram-style horizontal scroll of friend/ambassador studios
│   └── StoryCard         — 4s auto-advance story overlay
├── CollapsibleSidebar    — Desktop only; friend/ambassador list
└── StudioMainPanel       — Tab container
    ├── Tab: Worktable    → StudioView (grid of posts)
    ├── Tab: Board        → StudioBoardView (Kanban: draft → in_progress → refined)
    ├── Tab: Archive      → StudioArchiveView (published posts)
    └── Tab: Discover     → StudioDiscover (mobile only; cross-studio feed)
```

### 5.2 Page: `CanvasEditor` (`/studio/canvas/:canvasId`)

```
CanvasEditor.tsx
├── CanvasHeader           — Title input + Stage selector pills + Publish button
│                            Mobile: 2-row layout; icon-only publish
├── CanvasBlockList        — @dnd-kit/sortable block list
│   └── SortableCanvasBlock — Individual block with drag handle + delete
├── CanvasRightPanel       — Add blocks grid + selected block properties (280px, desktop)
└── Drawer (mobile)        — Bottom sheet wrapping CanvasRightPanel; triggered by FAB
```

### 5.3 Key Components

| Component | Purpose |
|-----------|---------|
| `BlockTypeSelector` | Dialog to choose block type (Song/Set/Scripture/Prayer/Audio/Note) when creating new canvas |
| `StudioBlockEditor` | TipTap rich-text editor with slash commands |
| `SongBlock` | Interactive song embed block |
| `WorshipSetBlock` | Interactive worship set embed block |
| `StudioFeed` | Social feed view |
| `StudioFeedCard` | Feed card with reactions |
| `PostDisplayCard` | Compact post card for grid/board views |
| `PostDetailDialog` | Full post view dialog |
| `StudioGrid` | Notion-style widget grid |
| `StudioWidget` | Individual widget renderer |
| `WidgetPalette` | Widget type picker |
| `WidgetEditDialog` | Widget content editor |
| `StudioBGMBar` | YouTube-based background music player |
| `StudioBGMSelector` | BGM song picker |
| `StudioSettingsDialog` | Room settings (name, visibility, cover, BGM) |
| `StudioCoverEditor` | Cover image editor with crop |
| `StudioContractPrompt` | Tier upgrade prompt |
| `StudioLockedState` | Feature-locked placeholder |

---

## 6. Workflow & Data Flow

### 6.1 Canvas Creation Flow
1. User taps "새 블록" (New Block) → `BlockTypeSelector` dialog opens
2. User selects block type (e.g., "Song") → `useCanvas.createCanvas({ roomId, blockType })`
3. Inserts `room_post` with `is_draft: true`, `workflow_stage: "draft"`, selected `block_type`
4. Navigates to `/studio/canvas/:newId`

### 6.2 Canvas Editing Flow
1. `CanvasEditor` loads canvas via `useCanvas(canvasId)`
2. Blocks are `canvas_blocks` rows, rendered as `SortableCanvasBlock` list
3. Right panel (desktop) / Bottom sheet (mobile) → add new blocks, edit selected block properties
4. Drag-and-drop reorder via `@dnd-kit/sortable` (with `TouchSensor` for mobile)
5. Stage progression: `draft` → `in_progress` → `refined` → `published`

### 6.3 Publish Flow
1. User clicks publish → `useCanvas.publishCanvas()`
2. Updates `workflow_stage: "published"`, `is_draft: false`
3. Invalidates queries, navigates back to `/studio`
4. Post appears in Archive tab and friends' feeds

### 6.4 Social Feed Flow
1. `useStudioFeed` fetches posts from friends + ambassadors + self
2. Filters by `room_visibility` (`public`, `friends`, `private`)
3. Includes reactions aggregation
4. `StudioDiscover` tab (mobile) shows cross-studio feed

### 6.5 Story Bar Flow
1. `useStoryBarStudios` combines friend studios + ambassador rooms
2. Sorted by: 24h activity + localStorage visit frequency counter
3. Tap bubble → `StoryCard` overlay (4s auto-advance cards)
4. "Visit studio" → navigates to that user's studio

---

## 7. Widget System

Studios have a **Notion-style widget grid** on their homepage.

### Widget Types (17 total)
`text` | `heading` | `quote` | `callout` | `image` | `video` | `post` | `todo` | `numbered-list` | `bullet-list` | `divider` | `external-link` | `song` | `recent-drafts` | `gallery` | `bible-verse` | `profile-card`

### Grid System
- Configurable `grid_columns` (default: 2)
- Each widget has `grid_column`, `grid_row`, `column_span`, `row_span`
- `sort_order` for fallback ordering

---

## 8. Editor System (TipTap)

### Components
- `StudioBlockEditor` — Main TipTap editor instance
- `SlashCommandMenu` — "/" triggered command palette
- `SongSelectorDialog` — Song picker for interactive song blocks
- `WorshipSetSelectorDialog` — Worship set picker for interactive set blocks

### Interactive Blocks
- `SongBlock` — Embedded song with key/BPM/YouTube preview
- `WorshipSetBlock` — Embedded worship set with song list

### Legacy Format
Older posts use JSONB `blocks` column on `room_posts`:
```typescript
interface BlockContent {
  id: string;
  type: "heading" | "paragraph" | "bullet-list" | "numbered-list" | "quote" | "divider" | "song" | "worship-set" | "image";
  attrs?: { level?: 1|2|3; songId?: string; setId?: string; imageUrl?: string };
  content?: string;
}
```

New content uses `canvas_blocks` table (separate rows per block).

---

## 9. Access Control

### Visibility Levels (3-tier)
| Level | Who can see |
|-------|------------|
| `public` | Anyone logged in |
| `friends` | Accepted friends only |
| `private` | Owner only |

### Feature Gates
| Gate | Controls |
|------|----------|
| `studio_enabled` (app_settings) | Entire feature on/off |
| `studio_comment` (tier feature) | Commenting ability |
| `studio_publish` (tier feature) | Publishing ability |
| `can_view_room()` (DB function) | Room-level access check |

---

## 10. Mobile Optimizations (430px viewport)

| Area | Desktop | Mobile |
|------|---------|--------|
| Canvas Right Panel | Fixed 280px sidebar | FAB + Bottom Sheet (Drawer) |
| Canvas Header | Single row | 2-row: title+publish / stage pills |
| Tab Bar | Text + icon labels | Icon-only labels |
| "New Block" button | Text button | Circular FAB |
| Board View | 3-column grid | Horizontal scroll (`snap-x`, min-w-[260px]) |
| Block drag handles | Hover-only | Always visible |
| DnD sensors | PointerSensor only | PointerSensor + TouchSensor (250ms delay, 5px tolerance) |
| Empty state text | "오른쪽 패널에서 블록 추가" | "하단 + 버튼으로 블록 추가" |

---

## 11. File Map

```
src/
├── pages/
│   ├── WorshipStudio.tsx              — Main studio page
│   └── CanvasEditor.tsx               — Canvas editor page
├── hooks/
│   ├── useCanvas.ts                   — Canvas CRUD + blocks
│   ├── useStudioPosts.ts              — Post CRUD + reactions
│   ├── useStudioFeed.ts               — Social feed (friends + ambassadors)
│   ├── useStudioWidgets.ts            — Widget CRUD
│   ├── useStudioCategories.ts         — Post categories
│   ├── useWorshipRoom.ts              — Room fetch (by owner / by ID)
│   ├── useStoryBarStudios.ts          — Story bar data + sorting
│   ├── useFriendStudios.ts            — Friend studios query
│   └── useRoomPosts.ts                — Legacy post fetcher
├── components/worship-studio/
│   ├── canvas/
│   │   ├── CanvasBlockList.tsx         — Sortable block list (DnD)
│   │   ├── CanvasHeader.tsx            — Title + stage + publish
│   │   ├── CanvasRightPanel.tsx        — Block palette + properties
│   │   └── SortableCanvasBlock.tsx     — Individual draggable block
│   ├── editor/
│   │   ├── StudioBlockEditor.tsx       — TipTap editor
│   │   ├── SlashCommandMenu.tsx        — "/" command palette
│   │   ├── SongSelectorDialog.tsx      — Song picker
│   │   ├── WorshipSetSelectorDialog.tsx— Set picker
│   │   └── blocks/
│   │       ├── SongBlock.tsx           — Interactive song embed
│   │       └── WorshipSetBlock.tsx     — Interactive set embed
│   ├── grid/
│   │   ├── StudioGrid.tsx             — Widget grid
│   │   ├── StudioWidget.tsx           — Widget container
│   │   ├── WidgetRenderer.tsx         — Widget type renderer
│   │   ├── WidgetPalette.tsx          — Widget type picker
│   │   ├── WidgetEditDialog.tsx       — Widget editor
│   │   └── editors/                   — Per-widget-type editors
│   ├── StudioHeader.tsx               — Header + mini BGM
│   ├── StoryBar.tsx                   — Instagram story bubbles
│   ├── StoryCard.tsx                  — Story overlay (4s auto)
│   ├── StudioMainPanel.tsx            — Tab container
│   ├── StudioView.tsx                 — Worktable tab content
│   ├── StudioBoardView.tsx            — Kanban board
│   ├── StudioArchiveView.tsx          — Published archive
│   ├── StudioDiscover.tsx             — Cross-studio feed (mobile)
│   ├── StudioFeed.tsx                 — Feed list
│   ├── StudioFeedCard.tsx             — Feed card + reactions
│   ├── PostDisplayCard.tsx            — Compact post card
│   ├── PostDetailDialog.tsx           — Full post dialog
│   ├── StudioBGMBar.tsx               — BGM player
│   ├── StudioBGMSelector.tsx          — BGM picker
│   ├── StudioSettingsDialog.tsx       — Room settings
│   ├── StudioCoverEditor.tsx          — Cover image editor
│   ├── StudioPostComposer.tsx         — Post creation form
│   ├── StudioPostEditor.tsx           — Post editing form
│   ├── BlockTypeSelector.tsx          — Block type dialog
│   ├── CollapsibleSidebar.tsx         — Desktop sidebar
│   ├── FriendStudioList.tsx           — Friend list in sidebar
│   ├── ProfileDropdownMenu.tsx        — Avatar dropdown
│   ├── StudioContractPrompt.tsx       — Tier gate prompt
│   ├── StudioLockedState.tsx          — Locked state UI
│   ├── StudioEmptyState.tsx           — Empty state
│   ├── StudioDraftsTab.tsx            — Drafts list
│   ├── StudioModules.tsx              — Module system
│   └── StudioViewHeader.tsx           — View header
```

---

## 12. Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| Studio gold | `#b8902a` | Primary accent, FAB, active tab border |
| Background | `#faf7f2` / dark: `background` | Studio pages |
| Card bg | `#fefcf8` / dark: `card` | Dialogs, panels |
| Board columns | `gray-50/50`, `amber-50/30`, `#f0e8d5/30` | Draft/In-progress/Refined |
| Block type colors | `#7c6a9e` (song), `#b8902a` (set), `#4a7c6a` (scripture), `#8b5e52` (prayer), `#3a6b8a` (audio), `#6b6560` (note) | BlockTypeSelector |

---

## 13. Known Patterns & Constraints

1. **Canvas = room_post**: A "canvas" is just a `room_posts` row. `canvas_blocks` are its children.
2. **Dual block formats**: Legacy posts use JSONB `blocks` column; new canvases use `canvas_blocks` table.
3. **Visibility is room-level**: Post visibility inherits from `worship_rooms.visibility` unless overridden.
4. **BGM is YouTube-based**: `StudioBGMBar` extracts YouTube video ID and plays audio.
5. **Story sorting**: Combines 24h recency with localStorage `studioVisitCounts` for personalization.
6. **No auto-save on canvas**: Canvas blocks save individually on mutation (unlike SetBuilder's debounced auto-save).
7. **Reactions**: 3 types only — `amen`, `praying`, `like`. Aggregated client-side.
8. **Published posts excluded from Board**: Board view only shows `draft`, `in_progress`, `refined`.

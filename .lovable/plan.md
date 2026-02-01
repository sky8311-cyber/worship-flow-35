
# Worship Studio Pivot: From Widget Grid to Notion-style Block Editor

## Current State Analysis

### Existing Architecture
The current Worship Studio is a **widget-based grid system**:

```text
Current Structure:
┌──────────────────────────────────────────────────────────────────┐
│ StudioHeader                                                      │
├───────────────┬──────────────────────────────────────────────────┤
│ Sidebar       │ StudioMainPanel (Tabs)                           │
│ - Friends     │ ┌─────────┬─────────┬─────────┬─────────┐        │
│ - My Studio   │ │ Studio  │  Feed   │ Drafts  │Discover │        │
│               │ ├─────────┴─────────┴─────────┴─────────┤        │
│               │ │ StudioView                            │        │
│               │ │ ├─ StudioCoverEditor                  │        │
│               │ │ └─ StudioGrid (DnD Widgets)          │        │
│               │ │     ├─ Text Widget                   │        │
│               │ │     ├─ Image Widget                  │        │
│               │ │     ├─ Song Widget                   │        │
│               │ │     └─ ... (15 widget types)         │        │
└───────────────┴─────────────────────────────────────────────────┘
```

**Tables involved:**
- `worship_rooms` - Studio container with owner, visibility, theme
- `studio_widgets` - Grid widgets with position, content, type
- `room_posts` - Simple text posts with reactions (limited editor)

### What Must Change
Remove:
- Grid-based widget system (`StudioGrid`, `WidgetPalette`, `WidgetRenderer`)
- Widget position/span logic
- "Widget" terminology

Add:
- True block-based document editor
- Slash command menu (`/song`, `/set`, `/heading`, etc.)
- Right-click context menu for block management
- Post display type selection (list/card/gallery)
- Full document view when clicking feed cards

---

## New Architecture

```text
New Structure:
┌──────────────────────────────────────────────────────────────────┐
│ StudioHeader                                                      │
├───────────────┬──────────────────────────────────────────────────┤
│ Sidebar       │ StudioMainPanel (Tabs)                           │
│ - Friends     │ ┌─────────┬─────────┬─────────┐                  │
│ - My Studio   │ │ Studio  │  Feed   │ New Post│                  │
│               │ ├─────────┴─────────┴─────────┤                  │
│               │ │                             │                  │
│               │ │ STUDIO TAB:                 │                  │
│               │ │ ├─ Profile Header + Bio     │                  │
│               │ │ └─ Post List (list/card/    │                  │
│               │ │    gallery based on type)   │                  │
│               │ │                             │                  │
│               │ │ NEW POST TAB:               │                  │
│               │ │ └─ BlockEditor              │                  │
│               │ │    ├─ Slash Commands (/)    │                  │
│               │ │    ├─ Standard Blocks       │                  │
│               │ │    └─ K-Worship Blocks      │                  │
│               │ │       ├─ /song              │                  │
│               │ │       └─ /set               │                  │
└───────────────┴─────────────────────────────────────────────────┘
```

---

## Database Changes

### Modify `room_posts` table
Add columns for block-based content and display settings:

```sql
ALTER TABLE room_posts ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE room_posts ADD COLUMN IF NOT EXISTS blocks JSONB DEFAULT '[]'::jsonb;
ALTER TABLE room_posts ADD COLUMN IF NOT EXISTS display_type TEXT DEFAULT 'card' 
  CHECK (display_type IN ('list', 'card', 'gallery'));
ALTER TABLE room_posts ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE room_posts ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT true;
```

### Deprecate `studio_widgets` table
Keep for backward compatibility but no longer create new widgets.

### Block Structure (JSONB)
```typescript
interface Block {
  id: string;
  type: 'heading' | 'paragraph' | 'bullet-list' | 'numbered-list' 
       | 'quote' | 'divider' | 'song' | 'worship-set' | 'image';
  attrs?: {
    level?: 1 | 2 | 3;           // For headings
    songId?: string;             // For song blocks
    setId?: string;              // For worship-set blocks
    imageUrl?: string;           // For images
  };
  content?: string | Block[];    // Text content or nested blocks
}
```

---

## Component Changes

### New Components

| Component | Purpose |
|-----------|---------|
| `StudioBlockEditor.tsx` | Main TipTap editor with slash commands |
| `SlashCommandMenu.tsx` | "/" triggered command palette |
| `BlockContextMenu.tsx` | Right-click menu for blocks |
| `SongBlock.tsx` | Interactive song card embed |
| `WorshipSetBlock.tsx` | Worship set preview card embed |
| `PostDisplayCard.tsx` | Renders post in list/card/gallery view |
| `PostDetailDialog.tsx` | Full document view when clicking a post |
| `PostSaveDialog.tsx` | Select display type when saving |

### Modified Components

| Component | Changes |
|-----------|---------|
| `StudioMainPanel.tsx` | Replace "Drafts" with "New Post" tab |
| `StudioView.tsx` | Show posts list instead of widget grid |
| `StudioFeed.tsx` | Use new `PostDisplayCard` for feed items |
| `StudioFeedCard.tsx` | Refactor to use `PostDisplayCard` |
| `StudioContractPrompt.tsx` | Update philosophy copy |

### Removed Components (Phase 2)

| Component | Reason |
|-----------|--------|
| `StudioGrid.tsx` | Widget grid replaced by posts |
| `WidgetPalette.tsx` | Replaced by slash commands |
| `WidgetRenderer.tsx` | Replaced by block renderer |
| `WidgetEditDialog.tsx` | Inline editing in block editor |
| `grid/editors/*.tsx` | All widget editors deprecated |

---

## TipTap Block Editor Implementation

### Extensions to Add
1. **Slash Command Extension** - Use `@harshtalks/slash-tiptap` or custom suggestion
2. **Custom Song Node** - Renders `SongCard` inline
3. **Custom WorshipSet Node** - Renders set preview inline
4. **Placeholder Extension** - Shows "Type '/' for commands..."

### Slash Command Menu Items
```text
Standard Blocks:
├─ /h1, /h2, /h3  → Headings
├─ /text          → Body text
├─ /bullet        → Bullet list
├─ /numbered      → Numbered list
├─ /quote         → Blockquote
├─ /divider       → Horizontal rule
└─ /image         → Image upload

K-Worship Blocks:
├─ /song          → Opens Song Library selector
└─ /set           → Opens Worship Set selector
```

### Song Block Behavior
```text
1. User types "/song" → Slash menu appears
2. Selects "Song Library"
3. Song selector dialog opens
4. User picks a song
5. Song card is embedded with:
   - Title, artist, key
   - Play button (uses existing mini-player)
   - "Add to Set" action
```

### Worship Set Block Behavior
```text
1. User types "/set" → Slash menu appears
2. Selects "Worship Set"
3. User's worship sets dialog opens
4. User picks a set
5. Set preview card embedded with:
   - Service name, date, leader
   - Song list preview
   - "Copy Set" action
```

---

## UI/UX Design

### Post Editor Screen
```text
┌──────────────────────────────────────────────────────────────────┐
│ [← Back]              New Post                    [Save Draft] [Publish] │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  [Cover Image Drop Zone - Optional]                              │
│                                                                  │
│  Title: [______________________________________]                 │
│                                                                  │
│  ─────────────────────────────────────────────────              │
│                                                                  │
│  Type '/' for commands...                                        │
│                                                                  │
│  [Block Editor Content Area]                                     │
│                                                                  │
│    # My Worship Journey This Week                                │
│                                                                  │
│    This week I was reminded of God's faithfulness...             │
│                                                                  │
│    ┌─────────────────────────────────────────────┐              │
│    │ 🎵 Way Maker - Sinach                       │              │
│    │ [▶ Play] [+ Add to Set]            Key: G  │              │
│    └─────────────────────────────────────────────┘              │
│                                                                  │
│    This song became the anthem of our team...                    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

### Post Display Types

**List View:**
```text
┌─────────────────────────────────────────────┐
│ ○ Post Title                       2h ago  │
│   Brief preview of first paragraph...       │
└─────────────────────────────────────────────┘
```

**Card View:**
```text
┌─────────────────────────────────────────────┐
│ [Cover Image]                               │
│                                             │
│ Post Title                                  │
│ Brief preview of content...                 │
│                                             │
│ 🎵 2 songs embedded                         │
│ 🙏 12  ❤️ 5  💬 3                            │
└─────────────────────────────────────────────┘
```

**Gallery View (for image-heavy posts):**
```text
┌───────────────────────┐
│ [Image Grid 2x2]      │
│ Post Title            │
└───────────────────────┘
```

### Philosophy Copy (Embedded in Empty State)
```text
"예배는 무대가 아닌, 삶입니다.
삶이 예배가 될 때, 사역이 빚어집니다.
이 스튜디오는 그 여정이 기록되고 나눠지는 곳입니다."

"Worship is not a stage, it is life.
As life becomes worship, ministry takes shape.
This Studio is where that journey is written and shared."
```

---

## Implementation Phases

### Phase 1: Database & Core Editor
1. Add new columns to `room_posts` table
2. Create `StudioBlockEditor.tsx` with TipTap
3. Implement slash command menu (standard blocks)
4. Create `PostSaveDialog.tsx` for display type selection
5. Update `StudioMainPanel.tsx` to add "New Post" tab

### Phase 2: K-Worship Custom Blocks
1. Create TipTap custom node for Song
2. Create TipTap custom node for Worship Set
3. Implement song/set selector integration
4. Style embedded cards to match existing UI

### Phase 3: Post Display & Feed
1. Create `PostDisplayCard.tsx` with list/card/gallery modes
2. Update `StudioView.tsx` to render posts (not widgets)
3. Create `PostDetailDialog.tsx` for full document view
4. Update `StudioFeed.tsx` to use new components

### Phase 4: Migration & Cleanup
1. Migrate existing `room_posts` content to new block format
2. Hide/deprecate widget-related UI
3. Update philosophy copy in contract prompt
4. Update translations

---

## Files to Create

| File | Description |
|------|-------------|
| `src/components/worship-studio/editor/StudioBlockEditor.tsx` | Main block editor |
| `src/components/worship-studio/editor/SlashCommandMenu.tsx` | "/" command palette |
| `src/components/worship-studio/editor/BlockContextMenu.tsx` | Right-click menu |
| `src/components/worship-studio/editor/nodes/SongNode.tsx` | Song block node |
| `src/components/worship-studio/editor/nodes/WorshipSetNode.tsx` | Set block node |
| `src/components/worship-studio/PostDisplayCard.tsx` | Post card renderer |
| `src/components/worship-studio/PostDetailDialog.tsx` | Full post view |
| `src/components/worship-studio/PostSaveDialog.tsx` | Save options |
| `src/hooks/useStudioPosts.ts` | CRUD for block-based posts |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/components/worship-studio/StudioMainPanel.tsx` | Replace Drafts tab with editor tab |
| `src/components/worship-studio/StudioView.tsx` | Remove `StudioGrid`, show post list |
| `src/components/worship-studio/StudioFeed.tsx` | Use `PostDisplayCard` |
| `src/components/worship-studio/StudioContractPrompt.tsx` | Update philosophy text |
| `src/hooks/useRoomPosts.ts` | Support new fields (title, blocks, display_type) |
| `src/lib/translations.ts` | Add editor-related translations |

---

## Technical Considerations

### TipTap Custom Nodes
Custom nodes (Song, WorshipSet) will use `NodeViewWrapper`:
```typescript
const SongNode = Node.create({
  name: 'song',
  group: 'block',
  atom: true,
  addAttributes() {
    return { songId: { default: null } };
  },
  addNodeView() {
    return ReactNodeViewRenderer(SongNodeView);
  },
});
```

### Performance
- Use `React.memo` for block components
- Lazy load song/set data when block enters viewport
- Debounce auto-save for editor content

### Mobile Considerations
- Slash menu positioned above keyboard
- Touch-friendly block selection
- Swipe gestures for block reordering (future)

### Data Migration
Existing `room_posts.content` (plain text) will be converted to:
```json
{
  "blocks": [
    { "id": "1", "type": "paragraph", "content": "<existing content>" }
  ]
}
```



# Studio v2 Phase D — 12종 기능형 블록 구현

## Overview
Replace placeholder block interiors with 12 functional block renderers, each with inline editing and a dedicated settings panel. Add a shared `BlockSettingsPanel` that dispatches to per-type settings, and a `useBlockContent` hook for 500ms debounced content updates.

## Architecture

```text
SpaceBlock.tsx
  └─ renders <BlockRenderer type={...} content={...} ... />
       └─ switch → TitleBlock | StickyNoteBlock | PhotoBlock | ...

SpaceBlockPicker.tsx (right panel)
  └─ "Phase D placeholder" replaced by <BlockSettingsPanel block={...} />
       └─ common header (X/Y/W/H) + type-specific settings + delete button
```

## Files

### 1. Create `src/hooks/useBlockContent.ts`
- Custom hook wrapping `useUpdateBlock` with 500ms debounce
- API: `const { content, setContent } = useBlockContent(blockId, spaceId, initialContent)`
- On `setContent`: merge into local state immediately, debounce the DB write
- Returns current merged content for the renderer

### 2. Create `src/components/worship-studio/spaces/blocks/BlockRenderer.tsx`
- Switch on `block_type` → render the correct block component
- Common props: `content`, `isSelected`, `isOwner`, `onContentChange`
- Fallback: current icon+label placeholder for unknown types

### 3. Create 12 block renderers in `spaces/blocks/`

| File | Content Schema | Render | Key Behavior |
|------|---------------|--------|-------------|
| `TitleBlock.tsx` | `{text, fontSize, align}` | `<input>` styled as h1 | contentEditable, font size classes |
| `SubtitleBlock.tsx` | `{text, fontSize}` | `<input>` styled as h2 | Similar to title, smaller |
| `StickyNoteBlock.tsx` | `{text, bgColor}` | Textarea on colored bg | 4 color options, slight rotation shadow |
| `NumberedListBlock.tsx` | `{items: string[]}` | `<ol>` with editable `<li>` | Enter=new, Backspace(empty)=delete |
| `ChecklistBlock.tsx` | `{items: [{text,checked}]}` | Checkbox + text | Toggle checked, strikethrough |
| `PhotoBlock.tsx` | `{image_url, object_fit}` | `<img>` 100% fill | URL-based, cover/contain toggle |
| `YoutubeBlock.tsx` | `{url, show_title}` | iframe embed | Extract video ID from URL/youtu.be |
| `MusicBlock.tsx` | `{youtube_url, title, artist}` | Mini player card | YouTube thumbnail, play/pause via IFrame API |
| `SpaceWorshipSetBlock.tsx` | `{set_id, show_song_list}` | Reuse existing `WorshipSetBlock` | Query service_sets |
| `LinkButtonBlock.tsx` | `{label, url, bgColor}` | Styled button card | Opens new tab on click |
| `FileDownloadBlock.tsx` | `{file_url, filename, icon}` | Icon + filename | Click to download |
| `BusinessCardBlock.tsx` | `{name, role, email, phone, photo_url}` | Card layout | "Load from profile" button in settings |

### 4. Create `src/components/worship-studio/spaces/blocks/BlockSettingsPanel.tsx`
- Switch on `block_type` → render type-specific settings controls
- Common top: X/Y/W/H readout (existing code from SpaceBlockPicker)
- Common bottom: red delete button (existing code)
- Per-type settings between them (inputs, color swatches, toggles)

### 5. Update `SpaceBlock.tsx`
- Replace the placeholder `<div>` (icon+label) with `<BlockRenderer>`
- Pass `content`, `isSelected`, `isOwner`, and `onContentChange` which calls `onUpdate({ content })`
- Prevent drag initiation when clicking inside editable areas (check `e.target` for input/textarea/contentEditable)

### 6. Update `SpaceBlockPicker.tsx`
- Replace the "Phase D placeholder" `<div>` with `<BlockSettingsPanel>`
- Pass `selectedBlock`, `onContentChange`, `onDelete`

### 7. Update `SpaceCanvas.tsx`
- Pass a `handleContentChange` callback down to blocks that calls `useUpdateBlock` with content updates

## Key Technical Decisions
- **Debounce**: 500ms via `useBlockContent` hook to avoid excessive DB writes during typing
- **Drag vs Edit conflict**: `SpaceBlock` checks if `e.target` is an interactive element before initiating drag
- **MusicBlock YouTube IFrame API**: Load YT IFrame API script dynamically, control via `player.playVideo()`/`pauseVideo()`
- **BusinessCard "Load from profile"**: Query `profiles` table by `auth.uid()` and populate content fields
- **WorshipSetBlock**: Reuse existing `WorshipSetSelectorDialog` for set selection in settings panel


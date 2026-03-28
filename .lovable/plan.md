

## Phase 3A: Material Blocks & Workflow Stages

### 1. Database Migration
Add two columns to `room_posts`:
- `workflow_stage text NOT NULL DEFAULT 'draft'` with CHECK constraint for `draft/in_progress/refined/published`
- `block_type text NOT NULL DEFAULT 'note'` with CHECK constraint for `song/worship_set/scripture/prayer_note/audio/note`
- Backfill: `UPDATE room_posts SET workflow_stage = CASE WHEN is_draft THEN 'draft' ELSE 'published' END`

Note: Using validation triggers instead of CHECK constraints per Supabase guidelines.

### 2. Typography — Playfair Display
- Add Google Fonts `<link>` to `index.html` for Playfair Display (400, 600, italic)
- Add `fontFamily: { serif: ['Playfair Display', 'Georgia', 'serif'] }` to `tailwind.config.ts`

### 3. Material Block Card — Redesign `PostDisplayCard.tsx`
The card view (lines 84-147) gets a complete visual overhaul:
- Background: `bg-[#fefcf8]`, left border 4px solid colored by `block_type`
- Color map: song=#7c6a9e, worship_set=#b8902a, scripture=#4a7c6a, prayer_note=#8b5e52, audio=#3a6b8a, note=#6b6560
- Top row: block type icon + label (left), workflow stage badge (right)
- Title: `font-serif text-lg text-[#2c2416]`
- Content: `line-clamp-2`
- Footer: date in `text-[11px]`
- Stage badges: draft=gray, in_progress=amber, refined=warm gold bg, published=gold text
- List and gallery views get similar subtle refinements

### 4. Paper Grain Texture
- Add `'noise'` key to `backgroundImage` in `tailwind.config.ts` using an SVG feTurbulence data URI
- Add `<div className="absolute inset-0 pointer-events-none bg-noise opacity-[0.025]" />` to `WorshipStudio.tsx` main wrapper

### 5. Gold Accent (#b8902a) Application
- `StoryBar.tsx`: own studio bubble ring → `ring-[#b8902a]`
- `StudioMainPanel.tsx`: active tab underline → `border-b-2 border-[#b8902a]`
- `StudioEmptyState.tsx`: CTA button → `border-[#b8902a] text-[#b8902a] hover:bg-[#b8902a] hover:text-white`
- `StudioHeader.tsx`: mini BGM ♪ icon → `text-[#b8902a]`

### 6. Post Editor — Block Type & Stage Selectors (`StudioPostEditor.tsx`)
- Add `blockType` and `workflowStage` state variables
- Top of editor: 6-button group for block_type selection (♩곡 / ✦워십셋 / 📖말씀 / ✦기도노트 / ◉오디오 / ▪노트)
- Bottom display settings: workflow_stage segmented control (초안/진행중/완성)
- Active selection style: `border-[#b8902a] bg-[#b8902a]/10`
- Pass `block_type` and `workflow_stage` to `createPost.mutate()`

### 7. Type Updates
- `StudioPost` interface in `useStudioPosts.ts`: add `workflow_stage` and `block_type` fields
- `useCreateStudioPost`: accept and insert `block_type` and `workflow_stage`
- `useUpdateStudioPost`: accept these in updates partial

### 8. Dark Mode — Prayer Room Theme
Update `.dark` in `src/index.css`:
- `--background: 25 20% 8%`
- `--card: 25 18% 11%`
- `--foreground: 38 25% 85%`
- `--muted-foreground: 35 15% 55%`
- `--border: 30 15% 20%`

No dark mode toggle label changes (no toggle component found in scope).

### Files Modified
- `index.html` — Google Fonts link
- `tailwind.config.ts` — serif font family, noise background
- `src/index.css` — dark mode CSS vars
- `src/hooks/useStudioPosts.ts` — types + mutation updates
- `src/components/worship-studio/PostDisplayCard.tsx` — Material Block card redesign
- `src/components/worship-studio/StudioPostEditor.tsx` — block type + stage selectors
- `src/components/worship-studio/StoryBar.tsx` — gold ring on own bubble
- `src/components/worship-studio/StudioMainPanel.tsx` — gold tab underline
- `src/components/worship-studio/StudioEmptyState.tsx` — gold CTA
- `src/components/worship-studio/StudioHeader.tsx` — gold music icon
- `src/pages/WorshipStudio.tsx` — paper grain overlay

### Migration (executed first)
```sql
-- Add columns with validation triggers (not CHECK constraints)
ALTER TABLE public.room_posts
  ADD COLUMN workflow_stage text NOT NULL DEFAULT 'draft';
ALTER TABLE public.room_posts
  ADD COLUMN block_type text NOT NULL DEFAULT 'note';

-- Validation trigger for workflow_stage
CREATE OR REPLACE FUNCTION validate_workflow_stage() RETURNS trigger AS $$
BEGIN
  IF NEW.workflow_stage NOT IN ('draft','in_progress','refined','published') THEN
    RAISE EXCEPTION 'Invalid workflow_stage: %', NEW.workflow_stage;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_validate_workflow_stage
  BEFORE INSERT OR UPDATE ON public.room_posts
  FOR EACH ROW EXECUTE FUNCTION validate_workflow_stage();

-- Validation trigger for block_type
CREATE OR REPLACE FUNCTION validate_block_type() RETURNS trigger AS $$
BEGIN
  IF NEW.block_type NOT IN ('song','worship_set','scripture','prayer_note','audio','note') THEN
    RAISE EXCEPTION 'Invalid block_type: %', NEW.block_type;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_validate_block_type
  BEFORE INSERT OR UPDATE ON public.room_posts
  FOR EACH ROW EXECUTE FUNCTION validate_block_type();

-- Backfill existing data
UPDATE public.room_posts
SET workflow_stage = CASE WHEN is_draft = true THEN 'draft' ELSE 'published' END;
```


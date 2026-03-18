

## AI Worship Set Builder — Revised Plan (Anthropic Claude)

### Overview
Build an AI worship set generation feature using the Anthropic API directly. The feature includes a **skills.md** knowledge base file that contains worship curation expertise, passed as system context to Claude. The edge function calls `https://api.anthropic.com/v1/messages` with model `claude-sonnet-4-20250514`.

---

### Step 0 — ANTHROPIC_API_KEY Secret

No `ANTHROPIC_API_KEY` exists in the project. You will be prompted to provide your Anthropic API key before implementation begins.

---

### Step 1 — Create `skills.md` Knowledge Base

**File: `supabase/functions/generate-worship-set/skills.md`**

A markdown file containing worship curation knowledge for Korean churches. This is loaded by the edge function and injected into the system prompt. Contents will include:

- **Worship flow structure**: Opening → Praise → Worship → Encounter → Response → Closing patterns used in Korean churches
- **Energy arc theory**: How to shape energy from high-energy opening praise through reflective worship to responsive closing
- **Key transition rules**: Prefer relative key changes (e.g., C → Am, G → Em), avoid jumps greater than a tritone, favor stepwise modulations
- **Korean church context**: Awareness of Korean CCM vs. translated Western worship, liturgical seasons (절기), bilingual congregation considerations
- **Song selection heuristics**: Tempo grouping, matching scripture themes to song topics, balancing familiar congregational songs with newer selections
- **Duration planning**: How to allocate minutes per song (average 4–5 min), account for transitions, prayer moments, and instrumental breaks

---

### Step 2 — Edge Function: `generate-worship-set`

**File: `supabase/functions/generate-worship-set/index.ts`**

- **Auth**: Validates JWT via `adminSupabase.auth.getUser(token)` (per project security pattern)
- **Song fetching**: Queries `songs` table for available songs (id, title, artist, default_key, tags, topics, language) — up to 500 rows, filtered by the user's community if `community_id` is provided
- **API call**: Calls `https://api.anthropic.com/v1/messages`
  - Model: `claude-sonnet-4-20250514`
  - Max tokens: 1500
  - System prompt: Loads `skills.md` content + the exact system prompt from requirements: *"You are a worship set curator for Korean Christian churches..."*
  - User message: Structured payload with user preferences (theme, songCount, preferredKey, durationMinutes, tone) + available songs list as JSON
  - Uses tool calling to enforce structured JSON output: `song_id`, `song_title`, `key`, `order_position`, `transition_note`, `rationale`
- **Post-success**: Calls `log-ai-usage` edge function internally with `action_type: 'set_generation'`
- **Error handling**: Surfaces 429/402/500 errors clearly; never blocks the user

**Config**: Add `[functions.generate-worship-set]` with `verify_jwt = false` to `supabase/config.toml`

---

### Step 3 — Frontend: `AISetBuilderPanel.tsx`

**File: `src/components/AISetBuilderPanel.tsx`**

A Sheet (side panel) component with:

**Inputs:**
- Theme or scripture reference — text input
- Number of songs — number input (3–12)
- Preferred key — select (A, A#/Bb, B, C, C#/Db, D, D#/Eb, E, F, F#/Gb, G, G#/Ab, each with major/minor)
- Service duration in minutes — number input
- Tone — select (High Energy / Reflective / Mixed)

**States:**
- Loading with spinner during API call
- Error state with retry
- Result view: rendered list showing each song with `order_position`, `key`, `transition_note`, and `rationale`

**Actions:**
- **"Use this set"** — maps returned `song_id`s back to actual song objects, calls `handleAddSong()` for each in order, injecting them into the current SetBuilder `items` state
- **"Regenerate"** — re-calls the edge function with the same inputs

---

### Step 4 — SetBuilder Integration

**File: `src/pages/SetBuilder.tsx`** (toolbar area, lines ~2049–2070)

- Import `useTierFeature` and check `hasFeature('ai_set_builder')`
- **If eligible** (Full Member / Community Account): Add "AI 세트 만들기" button with Sparkles icon in the toolbar row next to "곡 추가". Opens `AISetBuilderPanel` as a Sheet.
- **If not eligible but authenticated**: In the empty state area (lines ~2076–2097), add a `LockedFeatureBanner` with message: "AI 세트 만들기 is available for Full Members (정식멤버) and above."
- Pass `handleAddSong`, `formData.community_id`, and `items` setter as props to the panel

---

### Files Summary

| File | Change |
|---|---|
| `supabase/functions/generate-worship-set/skills.md` | New — worship curation knowledge base |
| `supabase/functions/generate-worship-set/index.ts` | New — edge function calling Anthropic API with skills.md |
| `supabase/config.toml` | Register `generate-worship-set` function |
| `src/components/AISetBuilderPanel.tsx` | New — side panel with inputs + result display |
| `src/pages/SetBuilder.tsx` | Add AI button to toolbar + tier gating + panel integration |

### Prerequisites
- `ANTHROPIC_API_KEY` must be added as a secret before implementation


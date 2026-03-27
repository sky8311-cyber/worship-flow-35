

## Plan: AI Set Builder Song Preview Links + Logo Replacement

### 1. Add YouTube and Score Preview Links to AI Set Builder Result

**File: `src/components/ai-set-builder/AISetBuilderResult.tsx`**

- For each song card, add small icon buttons for YouTube (▶) and Score (📄) next to the song title area.
- Use `song.youtube_url` and `song.score_file_url` from `songMap[item.song_id]`.
- YouTube link opens via `openYouTubeUrl()` (from `@/lib/youtubeHelper`).
- Score link opens in a new tab (`window.open`).
- Only show icons when the URL exists.
- Icons placed in the right side of the song card row for easy tapping.

### 2. Fix Bottom Button Bar Width Overflow

**File: `src/components/AISetBuilderPanel.tsx`**

- The `<div className="flex gap-2 pt-4 border-t">` footer bar overflows the Sheet width.
- Fix by adding `min-w-0` to the flex container and `overflow-hidden` or constraining button text with `truncate`.
- Also ensure the ScrollArea uses proper padding so content doesn't conflict with the fixed footer.

### 3. Replace K-Worship Institute Logo

**File: `src/assets/kworship-institute-logo.png`**

- Replace the current file with the uploaded `Kworship_Institute_Logo.png`.
- No code changes needed in `HeaderLogo.tsx` — it already imports from this path.

### Files to Change

| File | Change |
|------|--------|
| `src/assets/kworship-institute-logo.png` | Replace with uploaded logo |
| `src/components/ai-set-builder/AISetBuilderResult.tsx` | Add YouTube/Score icon buttons per song |
| `src/components/AISetBuilderPanel.tsx` | Fix button bar width overflow |


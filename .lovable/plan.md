

## Song Library Import: Partial Update Problem

### Current Behavior (lines 329-339)
When a row has an `id`, the update sets **every field** from the Excel row — including blank ones. So:

- ✅ Excel has lyrics, DB doesn't → **lyrics get added** (works correctly)
- ❌ Excel has empty lyrics, DB has lyrics → **lyrics get erased** (set to `null`)
- ❌ Any blank cell in Excel overwrites existing DB data with `null`

This is dangerous. Users export, edit a few columns, re-import, and unknowingly wipe fields they didn't touch.

### Fix (1 file: `src/components/CSVImportDialog.tsx`)

**Change the update logic to only include non-empty fields** — skip any field where the Excel cell is blank/empty so existing DB values are preserved.

Replace the static `updateData` object (lines 329-339) with a conditional builder:

```typescript
const updateData: Record<string, any> = {};

// Only include fields that have actual values in the Excel
const fieldMap: Record<string, any> = {
  title: row.title?.trim(),
  subtitle: row.subtitle?.trim(),
  artist: row.artist?.trim(),
  language: row.language?.trim(),
  default_key: row.default_key?.trim(),
  topics: row.topics?.trim(),
  youtube_url: row.youtube_url?.trim(),
  interpretation: row.interpretation?.trim(),
  notes: row.notes?.trim(),
  lyrics: row.lyrics?.trim(),
};

for (const [key, value] of Object.entries(fieldMap)) {
  if (value && value !== "") {
    updateData[key] = value;
  }
}
// title is always required
if (!updateData.title) {
  updateData.title = row.title.trim();
}
```

This way:
- Non-empty Excel cells → update the DB field
- Empty Excel cells → leave the existing DB value untouched
- Score file URL logic (lines 342-344) already has this pattern — only sets if `scoreUrl !== null`

### Impact
- Safe re-imports: users can export, edit specific columns, and re-import without data loss
- No DB migration needed — purely a client-side logic change


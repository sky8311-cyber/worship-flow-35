

## Bug: Auto-Save Safety Guard Blocks FormData Persistence

### Root Cause

In `useAutoSaveDraft.ts` (lines 226-242), when `items` array is empty (e.g., items haven't loaded yet from DB), the safety guard returns `null` **entirely** — skipping both items AND formData saves.

**Timeline of the bug:**
1. User unpublishes a set → navigates to SetBuilder
2. `existingSet` loads quickly (cached) → formData populated
3. User starts editing metadata (title, leader, etc.)
4. Auto-save triggers after 2s debounce
5. BUT `items` array is still `[]` (songs/components query still fetching)
6. Safety guard: "DB has items but local is empty" → **SKIP ENTIRE SAVE** (including formData)
7. User thinks auto-save handled it, navigates away
8. Returns → DB has old formData values → **data appears "reset"**

The safety guard correctly prevents items from being wiped, but incorrectly also blocks the `service_sets` metadata update.

### Fix

**File: `src/hooks/useAutoSaveDraft.ts`**

Change the empty-items guard (lines 226-242) to still save formData (service_sets metadata) but skip the items upsert:

```typescript
// Safety check: If editing existing set with empty items, check DB first
let skipItemsUpsert = false;
if (id && currentItems.length === 0) {
  const [{ data: dbSongs }, { data: dbComponents }] = await Promise.all([
    supabase.from("set_songs").select("id").eq("service_set_id", id).limit(1),
    supabase.from("set_components").select("id").eq("service_set_id", id).limit(1),
  ]);
  
  const dbHasItems = (dbSongs && dbSongs.length > 0) || (dbComponents && dbComponents.length > 0);
  
  if (dbHasItems) {
    console.log('AutoSave: DB has items but local is empty - saving formData only, skipping items');
    skipItemsUpsert = true;
  } else {
    console.log('AutoSave: Skipping - editing existing set with empty items and DB is also empty');
    return null;
  }
}
```

Then wrap the items upsert (lines 281-293):
```typescript
if (setId && !skipItemsUpsert) {
  const dbIdUpdates = await upsertSongsAndComponents(...);
  // ...
}
```

This way, formData (service_sets row) is always persisted even when items haven't loaded yet, while items remain protected from accidental deletion.

### Files Modified
- `src/hooks/useAutoSaveDraft.ts` — split empty-items guard to allow formData-only saves




# Fix: Space Block Updates Not Persisting (406 Error)

## Root Cause

Network requests show all PATCH calls to `space_blocks` returning **HTTP 406** with error:
```
"The result contains 0 rows" / "Cannot coerce the result to a single JSON object"
```

The `useUpdateBlock` mutation in `useSpaceBlocks.ts` uses `.select().single()` after the update. When RLS filters the result (or the update returns 0 matching rows for any reason), PostgREST cannot coerce 0 rows into a single JSON object, throwing a 406 error. This causes the mutation to fail, `onSuccess` never fires, and the query cache is never invalidated — so changes appear lost.

## Fix

### `src/hooks/useSpaceBlocks.ts` — `useUpdateBlock`

Remove `.select().single()` from the update query. The return data (`data`) is only used to get `spaceId` for cache invalidation, but `spaceId` is already available as an input parameter.

**Before:**
```typescript
const { data, error } = await supabase
  .from("space_blocks")
  .update(payload)
  .eq("id", id)
  .select()
  .single();
if (error) throw error;
return { ...(data as unknown as SpaceBlock), spaceId };
```

**After:**
```typescript
const { error } = await supabase
  .from("space_blocks")
  .update(payload)
  .eq("id", id);
if (error) throw error;
return spaceId;
```

Update `onSuccess` accordingly:
```typescript
onSuccess: (spaceId) => {
  queryClient.invalidateQueries({ queryKey: ["space-blocks", spaceId] });
},
```

This is a single-file, ~6-line change.


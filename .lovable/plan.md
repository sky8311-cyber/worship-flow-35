

## Fix: Institute AI Content Generation "Failed to Fetch" Error

### Problem
The `BulkUploadPanel.tsx` and `ChapterBlockEditor.tsx` components call the edge function without refreshing the auth session first, and without a fetch timeout/abort controller. This causes "Failed to fetch" errors.

### Changes

**1. Add session refresh before fetch in `BulkUploadPanel.tsx`**
- Replace `supabase.auth.getSession()` with `supabase.auth.refreshSession()` to get a fresh access token before calling the edge function
- Add an `AbortController` with a 120-second timeout to prevent silent hangs
- Improve error messaging to distinguish between timeout, network, and server errors

**2. Apply the same fix to `ChapterBlockEditor.tsx`**
- Same session refresh pattern
- Same timeout/abort pattern

### Technical Details

```typescript
// Before (broken)
const { data: sessionData } = await supabase.auth.getSession();
const token = sessionData?.session?.access_token;

// After (fixed)
const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
if (refreshError || !refreshData?.session) throw new Error("Not authenticated");
const token = refreshData.session.access_token;

// Add timeout
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 120000);
const response = await fetch(url, { ...options, signal: controller.signal });
clearTimeout(timeout);
```

Both files need identical fixes. No database or edge function changes required.


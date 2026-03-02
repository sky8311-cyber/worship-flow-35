

## Fix: Template Workflow Freezing (403/406/401 Errors)

### Problem
User "정기성" reports the app freezes when working with templates in the Set Builder. Console shows 403/406/401 errors, and the issue persists across web and mobile.

### Root Cause Analysis
After reviewing the code, the freezing is caused by a cascade of failed API requests that create a tight error loop:

1. **Auto-save retry loop**: When `useAutoSaveDraft` encounters a 403 (RLS denial) or 401 (expired session), it fails silently but the state change triggers another render, which detects "unsaved changes" again, scheduling another save attempt every 2 seconds.

2. **Edit lock heartbeat failures**: The `useSetEditLock` hook sends heartbeat requests every 30 seconds via the `set-edit-lock-action` edge function. If these return 401, the error isn't gracefully handled, causing additional failed network requests.

3. **No error backoff**: Neither the auto-save nor the edit lock heartbeat have exponential backoff on network errors. A single expired token can trigger hundreds of failed requests per minute, overwhelming the browser.

### Fix Plan (3 files)

**1. `src/hooks/useAutoSaveDraft.ts` -- Add error backoff and graceful 403/401 handling**
- In the `autoSaveMutation.onError` handler, detect 403/401/406 status codes
- When these errors occur, set a backoff flag that prevents retries for 30 seconds (similar to the existing loop detection mechanism)
- Log a clear warning so the cause is traceable
- After the cooldown, allow one retry; if it fails again, extend cooldown to 2 minutes

**2. `src/hooks/useSetEditLock.ts` -- Add error handling for edge function failures**
- In the heartbeat and lock acquisition calls to `set-edit-lock-action`, catch 401/403 errors
- On auth errors, skip the heartbeat cycle and attempt a session refresh before the next attempt
- Prevent the heartbeat interval from firing during error backoff

**3. `src/pages/SetBuilder.tsx` -- Show user-facing error state instead of silent freezing**
- Add error state tracking for auto-save failures
- When consecutive auto-save failures are detected (3+ in a row), show a toast notification telling the user to refresh or re-login
- This prevents the "frozen" experience where nothing appears to happen but requests keep failing

### Technical Details

In `useAutoSaveDraft.ts`, the mutation error handler will be updated:
```typescript
onError: (error: any) => {
  const status = error?.status || error?.code;
  const isAuthError = status === 401 || status === 403 || status === 406;
  
  if (isAuthError) {
    // Enter error backoff - prevent rapid retries
    errorBackoffRef.current = true;
    errorBackoffAtRef.current = Date.now();
    console.warn('[AutoSave] Auth/permission error, entering 30s backoff:', error.message);
  }
}
```

In the mutation function, add a backoff check at the top (similar to existing loop detection):
```typescript
if (errorBackoffRef.current) {
  const elapsed = Date.now() - errorBackoffAtRef.current;
  if (elapsed < ERROR_BACKOFF_MS) {
    return null; // Skip save during backoff
  }
  errorBackoffRef.current = false; // Reset after cooldown
}
```

### Expected Result
- Failed API requests no longer cascade into an infinite loop
- Users see a clear message if their session has issues
- The app remains responsive even when backend errors occur
- After the backoff period, normal operation resumes automatically

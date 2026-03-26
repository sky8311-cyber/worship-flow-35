

## Increase Fetch Timeout to 5 Minutes

**Change**: Update the `AbortController` timeout from `120000ms` (2 min) to `300000ms` (5 min) in two files.

### Files to edit

1. **`src/components/institute/faculty/BulkUploadPanel.tsx`** — change `setTimeout(() => controller.abort(), 120000)` → `300000`
2. **`src/components/institute/faculty/ChapterBlockEditor.tsx`** — same change


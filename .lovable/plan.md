

## PDF Upload & Auto-Conversion Audit

### Current Architecture

There are **3 places** where PDF files can be uploaded as scores:

1. **SmartSongFlow.tsx** — Has proper PDF→image conversion using `convertPdfToImages()` (client-side pdfjs-dist). Works correctly: converts each page to PNG, uploads individually.

2. **SongDialog.tsx** — **BUG FOUND**: Uploads the raw PDF file directly to the `scores` bucket WITHOUT converting to images. The file is stored as `.pdf` and the URL points to a PDF file, not an image. This means score viewers will try to render a PDF URL as an `<img>` tag, which will show nothing.

3. **CSVImportDialog.tsx** — **BUG FOUND**: Same issue. Accepts PDF files but uploads them raw without conversion. The `uploadScoreImage()` function just uploads the file as-is.

### Edge Function (convert-pdf-to-images)

The edge function exists but is **never called** by any frontend code. All conversion is done client-side. The edge function itself has questionable reliability (pdfjs-dist + OffscreenCanvas in Deno is fragile). It can be removed or ignored.

### Storage RLS

The `scores` bucket requires `worship_leader` or `admin` role to upload — this is correct and intentional.

### CDN Worker

The pdfjs-dist worker CDN URL (`https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.4.168/pdf.worker.min.mjs`) is valid and loads successfully.

---

### Fix Plan

**File 1: `src/components/SongDialog.tsx`** (line ~777)
- In `uploadScoreFile()`, add PDF detection: if `file.type === "application/pdf"`, call `convertPdfToImages(file)` and upload each page as a separate PNG (same pattern as SmartSongFlow.tsx)
- Import `convertPdfToImages` from `@/utils/pdfToImages`
- For image files, keep the existing direct upload logic

**File 2: `src/components/CSVImportDialog.tsx`** (line ~186)
- In `uploadScoreImage()`, add the same PDF detection and conversion logic
- Import `convertPdfToImages` from `@/utils/pdfToImages`
- Return an array of URLs instead of a single URL for PDF files, or handle multi-page appropriately

**No changes needed:**
- `SmartSongFlow.tsx` — already works correctly
- `pdfToImages.ts` — works correctly
- Edge function — unused, leave as-is

### Summary

The root cause is that **SongDialog.tsx** (the main song editing dialog) uploads PDFs as raw files instead of converting them to images first. This is the most commonly used upload path, which explains the user report.


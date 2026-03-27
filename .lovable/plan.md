

## Auto-Expanding Textareas for Faculty Course Editing

The problem: all `<Textarea>` and raw `<textarea>` elements in the course builder are fixed-height (often 1 row or 80px min-height), making editing long content impractical.

### Approach

Make the shared `Textarea` component auto-resize universally, and ensure the raw `<textarea>` elements in `ChapterBlockEditor.tsx` also auto-resize on mount (not just on input).

### Changes

**1. `src/components/ui/textarea.tsx`** — Add auto-resize behavior
- Add a `useEffect` + `onInput` handler that sets `height = "auto"` then `height = scrollHeight + "px"` on every value change and on mount.
- Change `min-h-[80px]` to `min-h-[40px]` so short fields aren't wastefully tall, but still grow with content.
- Use a callback ref merged with the forwarded ref to trigger initial resize.

**2. `src/components/institute/faculty/ChapterBlockEditor.tsx`** — Fix raw `<textarea>` elements
- The ParagraphEditor, QuoteEditor, VerseEditor, and CalloutEditor already have `onInput` auto-resize but only trigger on user input, not on initial mount (so AI-generated content stays 1 row tall).
- Add a `ref` callback that triggers the same resize logic on mount so content loaded from the database renders at the correct height.

**3. `src/components/institute/faculty/QuizBuilder.tsx`** — Uses `<Textarea>` component
- Will automatically benefit from change #1.

**4. `src/components/institute/AdminInstituteContentTree.tsx` and `AdminInstituteCertifications.tsx`** — Uses `<Textarea>` component
- Will automatically benefit from change #1.




## Fix: "/" Key Should Trigger Command Menu in Block Editor

### Problem
The hint says "또는 '/' 입력" but there's no `onKeyDown` handler on the block editors (ParagraphEditor, HeadingEditor, etc.) to detect "/" and open the command menu.

### Solution

**File: `src/components/institute/faculty/ChapterBlockEditor.tsx`**

1. **Pass `onSlash` callback to block editors**: Each editor component (ParagraphEditor, HeadingEditor, QuoteEditor, CalloutEditor, VerseEditor — any with text input) needs an `onKeyDown` handler that detects when "/" is typed at the start of an empty field (or as the first character).

2. **Detection logic**: On `onKeyDown`, if the key is "/" and the current text is empty, prevent default, set `commandInsertIdx` to that block's index, and call `setShowCommand(true)`.

3. **Wire it up**: In the `blocks.map()` render loop (~line 460), pass an `onSlash` prop with the block's index. Each text-based editor component will add `onKeyDown` to its `<input>`/`<textarea>`.

### Changes

| Component | Change |
|-----------|--------|
| `ParagraphEditor` | Add `onKeyDown` — if key is "/" and text is empty, call `onSlash()` |
| `HeadingEditor` | Same `onKeyDown` handler |
| `QuoteEditor`, `CalloutEditor`, `VerseEditor` | Same for any text inputs |
| `SortableBlock` render (~line 460) | Pass `onSlash={() => { setCommandInsertIdx(idx); setShowCommand(true); }}` to each Editor |
| Block editor type signatures | Add optional `onSlash?: () => void` prop |


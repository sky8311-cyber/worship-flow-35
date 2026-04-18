
Goal: fix the score-selection dialog so selecting an item does not make the modal/cards expand like in the screenshot.

1. Audit and harden the full width-constraining chain in `SetSongScoreDialog.tsx`
- Keep the existing dialog/tab overflow guards.
- Add `min-w-0` to the key parent wrappers that sit inside the dialog grid, because the dialog itself is a CSS grid and grid children can still expand from `min-content` sizing.
- Apply the same containment pattern to the selected-items preview block so adding a selection cannot change modal width.

2. Replace the fragile search-results grid sizing with an explicit 3-column minmax layout
- Update the web search results wrapper to use a guaranteed `repeat(3, minmax(0, 1fr))` column definition rather than relying on a layout that can fall back to content-sized columns.
- Keep `overflow-hidden w-full min-w-0` on the grid container.
- Ensure each card uses `w-full min-w-0 overflow-hidden` so a result can never exceed its grid track.

3. Constrain every image-card child consistently
- Keep `img` at `w-full max-w-full object-cover`.
- Add truncation to any visible text inside result cards or related preview cards.
- Verify there are no remaining card wrappers in this dialog using default `min-width:auto` behavior.

4. Verify the exact user flow shown in the screenshot
- Open score dialog on `/set-builder/...`
- Search, select, deselect, and reselect multiple web results
- Confirm the results stay in a stable 3-column grid on desktop
- Confirm the modal width does not grow and no horizontal scroll appears
- Confirm the selected-items panel remains clipped/truncated correctly after items are added

Technical details
- Likely root cause: `DialogContent` uses `display: grid`, and grid children default to `min-width: auto`; combined with a results grid/cards that are not fully constrained, content can force expansion.
- The current code already has some overflow fixes, so the remaining issue is most likely the sizing chain, not just one missing `truncate`.
- Implementation pattern to apply:
  - dialog child wrappers: `min-w-0`
  - tabs/tabs content: `w-full min-w-0 overflow-hidden`
  - results grid: explicit `repeat(3, minmax(0, 1fr))`
  - result cards: `w-full min-w-0 overflow-hidden`
  - text nodes: `truncate`
  - images: `w-full max-w-full`

Scope
- Limit changes to `SetSongScoreDialog.tsx` unless a shared wrapper needs the same non-breaking containment pattern.
- No data/model changes; layout-only fix.

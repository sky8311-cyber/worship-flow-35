

## Plan: Guard AI Panel with Same Prerequisites as Adding Songs

### Approach

Apply the **same validation** used before adding songs (community, date, time, name, worship leader) **before opening the AI panel**. This way, when the user clicks "이 세트 사용", all prerequisites are already met, and `handleAddSong` will succeed. Also auto-acquire edit lock before adding.

### Changes

**`src/pages/SetBuilder.tsx`**

1. **Guard the AI panel button click** (line ~2068): Before opening the panel, run `getMissingRequiredFields()`. If fields are missing, show the same toast error and don't open the panel. This ensures the user fills in community/date/time/name/leader first.

2. **Auto-acquire edit lock in `onAddSongs`** (line ~2339): When the AI panel calls `onAddSongs`, check if `isEditMode` is false and call `acquireLock()` first, then add songs. This removes the "not in edit mode" blocker silently.

3. **Result**: By the time the user clicks "이 세트 사용", all guards in `handleAddSong` (required fields + edit mode) are already satisfied. Songs get added successfully.

### Summary

| What | How |
|---|---|
| Guard AI panel opening | Same `getMissingRequiredFields()` check + toast before `setShowAIPanel(true)` |
| Auto edit mode on "Use set" | Call `acquireLock()` in `onAddSongs` if not already editing |
| No changes to `AISetBuilderPanel.tsx` | All logic stays in `SetBuilder.tsx` |


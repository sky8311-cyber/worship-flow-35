

## Problem

The duration input (`예배 시간`) and song count input (`곡 수`) use `parseInt(e.target.value) || 30` and `parseInt(e.target.value) || 3` respectively. When the user clears the field (empty string), `parseInt("")` returns `NaN`, so `|| 30` immediately kicks in and resets the value to 30. The user can never clear the field to type a new number.

## Fix

Allow empty/intermediate states by storing the raw string or allowing `""` temporarily:

**`src/components/AISetBuilderPanel.tsx`** (lines 200-201 and 173):
- **Duration (line 201)**: Change to allow empty string — only parse on blur or treat empty as valid intermediate state. Simplest: use `e.target.value === "" ? "" : parseInt(...)` pattern, but since state is `number`, the cleanest fix is to allow `0` or use `e.target.valueAsNumber`:
  ```
  onChange={(e) => setDurationMinutes(e.target.value === "" ? 0 : parseInt(e.target.value))}
  ```
  But `0` still shows "0". Better approach: let `value` accept empty string by changing to `value={durationMinutes || ""}` and `onChange` to `setDurationMinutes(parseInt(e.target.value) || 0)`, then use `durationMinutes || 30` when sending to the API.

- **Song Count (line 173)**: Same issue — apply the same fix.

Both inputs: allow the field to be emptied in the UI, and default to sensible values only at submission time in `handleGenerate`.


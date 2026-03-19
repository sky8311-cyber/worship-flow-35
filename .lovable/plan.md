

## Pre-fill AI Panel with Worship Info

### What
When opening the AI Set Builder panel, pre-fill its fields from the already-entered worship info: `theme` → Theme, `scripture_reference` → Theme (combined), `worship_duration` → Duration.

### Changes

**`src/components/AISetBuilderPanel.tsx`**:
1. Add new optional props: `initialTheme?: string`, `initialDuration?: number`
2. Use a `useEffect` to set `theme` and `durationMinutes` from props when the panel opens (`open` changes to `true`)

**`src/pages/SetBuilder.tsx`**:
1. Pass new props to `AISetBuilderPanel`:
   - `initialTheme` — combine `formData.theme` and `formData.scripture_reference` (e.g., "은혜, 요한복음 3:16")
   - `initialDuration` — parse `formData.worship_duration` if set

### Technical detail

```tsx
// AISetBuilderPanel.tsx — new props + useEffect
interface AISetBuilderPanelProps {
  // ...existing
  initialTheme?: string;
  initialDuration?: number;
}

useEffect(() => {
  if (open) {
    if (initialTheme) setTheme(initialTheme);
    if (initialDuration) setDurationMinutes(initialDuration);
  }
}, [open]);

// SetBuilder.tsx — pass props
<AISetBuilderPanel
  initialTheme={[formData.theme, formData.scripture_reference].filter(Boolean).join(", ")}
  initialDuration={formData.worship_duration ? parseInt(formData.worship_duration) : undefined}
  // ...existing props
/>
```

Two files changed, no new dependencies.


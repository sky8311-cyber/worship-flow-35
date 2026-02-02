
# Fix: Song Title Click to Edit & Form Layout Improvements

## Problem Summary

1. **Table View**: Clicking the song title does nothing - it should open the edit dialog
2. **Edit Dialog Layout**: Artist and Language fields are side-by-side in a 2-column grid, which causes:
   - Artist tooltip text gets cramped
   - Language field is squeezed next to artist
   - Poor visual hierarchy

---

## Solution

### Change 1: Make Song Title Clickable in Table View

**File**: `src/components/SongTable.tsx`

Add `onClick` handler to the song title `<span>` to trigger `onEdit(song)`:

```tsx
// BEFORE (lines 282-284)
<div>
  <div className="flex items-baseline gap-1.5">
    <span>{song.title}</span>

// AFTER
<div>
  <div className="flex items-baseline gap-1.5">
    <span 
      onClick={() => onEdit?.(song)}
      className="cursor-pointer hover:underline hover:text-primary transition-colors"
    >
      {song.title}
    </span>
```

This makes the title:
- Visually indicate it's clickable (cursor + hover underline)
- Trigger the existing `onEdit` callback when clicked

---

### Change 2: Artist & Language Layout - Single Column Each

**File**: `src/components/SongDialog.tsx`

Change from 2-column grid to stacked single-column layout:

```tsx
// BEFORE (lines 1030-1055)
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div className="space-y-1.5">
    <Label htmlFor="artist">...</Label>
    <p className="text-xs text-muted-foreground">...</p>
    <ArtistSelector ... />
  </div>
  <div>
    <Label htmlFor="language">...</Label>
    <Select>...</Select>
  </div>
</div>

// AFTER - Separate single-column sections
{/* Artist - Full width with tooltip below label */}
<div className="space-y-1.5">
  <Label htmlFor="artist">{t("songDialog.artist")}</Label>
  <p className="text-xs text-muted-foreground">
    {t("songDialog.artistTooltip")}
  </p>
  <ArtistSelector
    value={formData.artist}
    onValueChange={(artist) => setFormData({ ...formData, artist })}
  />
</div>

{/* Language - Full width on next row */}
<div>
  <Label htmlFor="language">{t("songDialog.language")}</Label>
  <Select value={formData.language} onValueChange={(value) => setFormData({ ...formData, language: value })}>
    <SelectTrigger>
      <SelectValue />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="KO">{t("songLibrary.languages.ko")}</SelectItem>
      <SelectItem value="EN">{t("songLibrary.languages.en")}</SelectItem>
      <SelectItem value="KO/EN">{t("songLibrary.languages.koen")}</SelectItem>
    </SelectContent>
  </Select>
</div>
```

---

## Visual Comparison

### Before (Current Layout)
```
┌─────────────────────────────────────────────────┐
│ 아티스트                      │ 언어            │
│ 아래 YouTube 링크의...        │ [한국어    ▼]  │
│ [어노인팅 찬송가         ▼]   │                │
└─────────────────────────────────────────────────┘
```

### After (Proposed Layout)
```
┌─────────────────────────────────────────────────┐
│ 아티스트                                        │
│ 아래 YouTube 링크의 레퍼런스 음악을 연주한      │
│ 아티스트(또는 그룹)를 입력하세요. 작곡가/작사가 │
│ 가 아닌, 실제 연주/녹음 아티스트입니다.         │
│ [어노인팅 찬송가                            ▼]  │
├─────────────────────────────────────────────────┤
│ 언어                                            │
│ [한국어                                     ▼]  │
└─────────────────────────────────────────────────┘
```

---

## Files Modified

| File | Change |
|------|--------|
| `src/components/SongTable.tsx` | Add onClick to title span + hover styles |
| `src/components/SongDialog.tsx` | Remove 2-column grid, stack artist and language vertically |

---

## UX Improvements

1. **Discoverability**: Title in table view becomes obviously clickable (underline on hover)
2. **Readability**: Artist tooltip text has full width to display properly
3. **Consistency**: Both fields follow same pattern - label → helper text → input
4. **Mobile-friendly**: Single column works better on all screen sizes

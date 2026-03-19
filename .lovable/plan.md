

## Add Save & Delete Buttons Below 예배 정보 Card

### What
Add "Save" and "Delete" buttons right after the 예배 정보 `<Card>` closes (after line 2020), visible on both mobile and desktop.

### Changes

**`src/pages/SetBuilder.tsx`** — Insert a button group after line 2020 (`</Card>`):

- A flex container with two buttons:
  1. **Save button** — triggers `saveSetMutation.mutate()`, shows spinner when pending, disabled when `isBlocked`
  2. **Delete button** — triggers `setShowDeleteConfirm(true)`, only shown when editing an existing set (`id` exists), disabled when `isBlocked` or `!canDelete`
- Uses the same logic/styles as the existing header save/delete buttons (lines 1438–1465)
- Responsive: `w-full` buttons stacked or side-by-side via `flex gap-2`

### Technical detail

```tsx
{/* After </Card> on line 2020 */}
<div className="flex gap-2">
  <Button
    onClick={() => saveSetMutation.mutate(undefined)}
    disabled={saveSetMutation.isPending || isBlocked}
    className="flex-1 gap-1.5"
  >
    <Save className="w-4 h-4" />
    {saveSetMutation.isPending ? t("common.saving") : t("common.save")}
  </Button>
  {id && (
    <Button
      variant="destructive"
      onClick={() => setShowDeleteConfirm(true)}
      disabled={isSetOwnerLoading || !canDelete || deleteSetMutation.isPending || isBlocked}
      className="gap-1.5"
    >
      <Trash2 className="w-4 h-4" />
      {language === "ko" ? "삭제" : "Delete"}
    </Button>
  )}
</div>
```

Single insertion, no other files affected.


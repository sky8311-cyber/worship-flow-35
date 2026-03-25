

## Problem

On mobile, the ArtistSelector uses a bottom drawer. When the keyboard opens, it pushes the drawer up but the search input and results get hidden behind the keyboard.

## Solution

Instead of using a bottom Drawer on mobile, switch to a **full-screen dialog/overlay that positions the search input at the top of the screen**. This way the keyboard appears below the input naturally, and results fill the space between.

## Changes

**`src/components/ArtistSelector.tsx`** (lines 119-132):
- Replace the `Drawer` approach on mobile with a fixed full-screen overlay (`fixed inset-0 z-[70] bg-background flex flex-col`)
- Search input at the top, results list below filling remaining space
- Add a close/back button at the top
- The `CommandContent` already has the right structure (input + list), so wrap it in a full-screen container instead of a drawer

The mobile block becomes:
```tsx
if (isMobile) {
  if (!open) {
    return <div onClick={() => setOpen(true)}>{TriggerButton}</div>;
  }
  return (
    <>
      <div>{T
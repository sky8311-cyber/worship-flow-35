

# Apartment Panel UI Refinements — 4 Changes

## Changes

### 1. Panel width: `w-64` → `w-48`
**File**: `StudioSidePanel.tsx` line 251
- Change `"w-64"` to `"w-48"`

### 2. Remove username (second line) from each unit
**File**: `StudioUnit.tsx` lines 123-125
- Remove the `ownerName` paragraph: `{!compact && (<p className="text-[10px] ...">...)}`
- The `ownerName` prop stays (used for fallback initial), just don't render the second text line

### 3. Remove WindowLights dots
**File**: `StudioUnit.tsx` line 128
- Remove `<WindowLights variant={variant} forceOn={forceWindowsOn} />`
- Can also remove the `WindowLights` component definition (lines 20-38) and the `forceWindowsOn` prop handling

### 4. Avatar profile image support
**File**: `StudioUnit.tsx`
- Avatar is already using `<AvatarImage src={avatarUrl} />` with fallback — this works for real studios
- For placeholders, they pass `placeholderInitials` but no `avatarUrl` — this is correct (initials fallback)
- Ensure avatar size is `h-7 w-7` in expanded mode (currently `h-8 w-8` for non-compact) — change line 107: `"h-8 w-8"` → `"h-7 w-7"`

## Files modified
| File | Changes |
|---|---|
| `StudioSidePanel.tsx` | Width `w-64` → `w-48` |
| `StudioUnit.tsx` | Remove ownerName text, remove WindowLights, avatar `h-7 w-7` |


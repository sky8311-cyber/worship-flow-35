

# Apartment Panel Polish — 3 Changes

## 1. Window Frame Corners — `rounded-sm`
**File**: `StudioUnit.tsx`

The `windowFrame` constant (line 19) already uses `rounded-sm`. No change needed — confirmed correct.

## 2. Entrance Door — Taller + Stairs
**File**: `StudioSidePanel.tsx` (lines 265-286)

- Increase door glass panels from `h-10` to `h-12`
- Insert stairs block between entrance door and lawn strip:

```tsx
{/* Stairs */}
<div className="shrink-0 flex flex-col items-center border-x border-[#d8cfc4] bg-stone-100">
  <div className="w-16 h-1.5 bg-[#c8b89a] border-t border-[#a89070]" />
  <div className="w-20 h-1.5 bg-[#c8b89a] border-t border-[#a89070]" />
  <div className="w-24 h-1.5 bg-[#c8b89a] border-t border-[#a89070]" />
</div>
```

Order: building body → entrance door → stairs → lawn → sidewalk → road.

## 3. Current User Avatar Fix
**File**: `StudioSidePanel.tsx` (line 70)

Already passing `user?.user_metadata?.avatar_url` — this is correct. However, need to also check `myStudio.avatarUrl` as fallback and query from profiles if needed.

Let me check what `useAuth` provides and what `myStudio` contains.

After review: Line 70 already passes `avatarUrl={user?.user_metadata?.avatar_url}`. The issue is likely that `user_metadata.avatar_url` is not set for email/password signups. Fix by also checking the profiles table avatar:

```tsx
avatarUrl={user?.user_metadata?.avatar_url || myStudio.avatarUrl || undefined}
```

This uses the auth metadata first, then falls back to the studio's profile avatar from the `useStoryBarStudios` hook which queries profiles.

## Files Modified
| File | Change |
|---|---|
| `StudioSidePanel.tsx` | Taller door (h-12), stairs block, avatar fallback chain |
| `StudioUnit.tsx` | No changes needed (already `rounded-sm`) |


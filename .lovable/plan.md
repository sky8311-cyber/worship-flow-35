

# Apartment Panel Polish — 3 Changes

## 1. Avatar Fix (StudioSidePanel.tsx + useStoryBarStudios.ts)

**Root cause**: In `useStoryBarStudios.ts` line 165, own studio is built with `avatarUrl: null`. The fallback on line 70 of StudioSidePanel (`user?.user_metadata?.avatar_url || myStudio.avatarUrl`) only works if the user signed up via OAuth (Google etc.) which populates `user_metadata.avatar_url`. For email/password signups, this is empty.

**Fix**: Query the user's profile avatar from the profiles table in `useStoryBarStudios.ts` and pass it when building the own studio. Alternatively, add a simple query for the current user's profile avatar in `StudioSidePanel.tsx` using supabase and pass it directly.

Simplest approach — in `StudioSidePanel.tsx`, add a query for the user's profile avatar:
```tsx
const { data: myProfile } = useQuery({
  queryKey: ['my-profile-avatar', user?.id],
  queryFn: async () => {
    const { data } = await supabase.from('profiles').select('avatar_url').eq('id', user!.id).single();
    return data;
  },
  enabled: !!user?.id,
});
```
Then on line 70:
```tsx
avatarUrl={user?.user_metadata?.avatar_url || myProfile?.avatar_url || myStudio.avatarUrl || undefined}
```

## 2. Window Frame Corners — `rounded-none` (StudioUnit.tsx)

**File**: `StudioUnit.tsx` line 19

Change `windowFrame` from `"rounded-sm border border-[#8a7a6a] shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]"` to `"rounded-none border border-[#8a7a6a] shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]"`.

Also update collapsed mode avatar frame (line 43) and entrance door panels in StudioSidePanel (lines 273-274, 282-283) from `rounded-sm` to `rounded-none`.

## 3. Entrance Door + Stairs Restructure (StudioSidePanel.tsx)

- Door glass panels: `h-12` (already correct), change `rounded-sm` to `rounded-none`
- Stairs already exist (lines 288-293) with widths `w-16`, `w-20`, `w-24`
- Per user's request, update stair widths to `w-20`, `w-24`, `w-28` for wider steps

Current order is already: building body → entrance door → stairs → lawn → sidewalk → road. No reordering needed.

## Files Modified
| File | Change |
|---|---|
| `StudioSidePanel.tsx` | Profile avatar query, door `rounded-none` |
| `StudioUnit.tsx` | `rounded-sm` → `rounded-none` in windowFrame |


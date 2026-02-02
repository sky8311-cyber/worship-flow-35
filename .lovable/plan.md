

# Fix: Private Song Visibility & Notifications

## Problem Statement

1. **Song Library**: Private songs are currently only visible to their creator. But **admins should also see them** (with the "Private" badge already implemented in `SongCard.tsx`)
2. **Notifications**: When a private song is added, all admins AND worship leaders get notified. Only **admins** should be notified for private songs.

---

## Current Behavior

### Song Library (Frontend)
```tsx
// src/pages/SongLibrary.tsx line 240
if (song.is_private && song.created_by !== user?.id) {
  return false; // Hides from everyone except creator
}
```

### Notification Trigger (Database)
```sql
-- notify_leaders_new_song()
FROM user_roles ur
WHERE ur.role IN ('admin', 'worship_leader')
  AND ur.user_id != NEW.created_by;
```

---

## Solution

### Change 1: Song Library - Allow Admins to See Private Songs

**File**: `src/pages/SongLibrary.tsx`

Update the filter logic to include admins:

```tsx
// BEFORE
if (song.is_private && song.created_by !== user?.id) {
  return false;
}

// AFTER
if (song.is_private && song.created_by !== user?.id && !isAdmin) {
  return false;
}
```

This allows:
- Song creator → sees their private songs
- Admins → sees all private songs (with "Private" badge)
- Everyone else → cannot see private songs

The "Private" badge is already implemented in `SongCard.tsx` (line 172-177) and `SongTable.tsx` (line 290-292).

---

### Change 2: Notification Trigger - Restrict Private Song Notifications

**File**: New database migration

Update `notify_leaders_new_song()` function:

```sql
CREATE OR REPLACE FUNCTION public.notify_leaders_new_song()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  actor_profile RECORD;
BEGIN
  IF NEW.created_by IS NOT NULL THEN
    SELECT full_name, avatar_url INTO actor_profile
    FROM profiles WHERE id = NEW.created_by;
  END IF;
  
  INSERT INTO notifications (user_id, type, title, message, related_id, related_type, metadata)
  SELECT DISTINCT ON (ur.user_id)
    ur.user_id,
    'new_song',
    'New Song Added',
    'added a new song to the library',
    NEW.id,
    'song',
    jsonb_build_object(
      'song_title', NEW.title,
      'song_artist', NEW.artist,
      'actor_name', COALESCE(actor_profile.full_name, 'A user'),
      'actor_avatar', actor_profile.avatar_url,
      'is_private', COALESCE(NEW.is_private, false)
    )
  FROM user_roles ur
  WHERE (
    -- Private songs: only notify admins
    (NEW.is_private = true AND ur.role = 'admin')
    OR
    -- Public songs: notify admins and worship leaders
    (COALESCE(NEW.is_private, false) = false AND ur.role IN ('admin', 'worship_leader'))
  )
  AND ur.user_id != NEW.created_by;
  
  RETURN NEW;
END;
$function$;
```

---

## Summary of Visibility Rules

| User Role | Private Songs Visibility | Notification for Private Song |
|-----------|-------------------------|-------------------------------|
| Song Creator | ✅ Visible (in Song Library) | ❌ No (they created it) |
| Admin | ✅ Visible (with "Private" badge) | ✅ Yes |
| Worship Leader | ❌ Hidden | ❌ No |
| Team Member | ❌ Hidden | ❌ No |

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/SongLibrary.tsx` | Add `&& !isAdmin` to private song filter |
| New migration | Update `notify_leaders_new_song()` function |

---

## Privacy Toggle

The existing UI (in `SongDialog.tsx` lines 1071-1086) already allows users to toggle privacy on/off. This change doesn't affect that functionality - users can still change their song's privacy setting at any time.


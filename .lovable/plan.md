

## Worship Studio Top Area Redesign

### Overview
Three interconnected changes: (1) Instagram-style Story Bar below the header, (2) Mini BGM player embedded in the header, (3) Remove bottom BGM bar rendering.

---

### Changes

#### 1. New hook: `src/hooks/useStoryBarStudios.ts`
Aggregates data for the story bar from existing hooks/queries:
- Fetch own room (already via `useWorshipRoom`)
- Fetch friend studios via `useFriendStudios()` (already returns `owner`, `bgm_song`, `latestPostAt`, `hasNewPosts`)
- Fetch ambassador rooms via `useAmbassadorRooms()` (returns `owner`)
- For each studio, fetch latest published post title (single query: `room_posts` WHERE `room_id IN (...)`, `is_draft = false`, ordered by `created_at DESC`)
- Enrich with `status_emoji`, `status_text` from `worship_rooms` (already in the select)
- Sort: own studio first, then active-in-24h friends, then by localStorage visit counter (`studio-visit-counts` key), then ambassadors
- Return unified `StoryStudio[]` array

#### 2. New component: `src/components/worship-studio/StoryBar.tsx`
Horizontally scrollable row of avatar bubbles:
- Uses `useStoryBarStudios()` hook
- Each bubble: `Avatar` component with conditional ring classes (active = `ring-2 ring-primary`, unseen = `ring-2 ring-primary/70`, default = `ring-2 ring-border`)
- Own studio bubble labeled "나" below
- Music note badge (🎵) if `bgm_song` exists — small absolute-positioned span
- Status emoji badge bottom-right of avatar if `status_emoji` set
- On tap: opens story card overlay, increments localStorage visit counter
- Scroll container: `overflow-x-auto scrollbar-hide flex gap-3 px-4 py-3`

#### 3. New component: `src/components/worship-studio/StoryCard.tsx`
Full-screen overlay triggered by tapping a story bubble:
- Fixed overlay with backdrop blur
- Background: studio `cover_image_url` with dark overlay, or gradient fallback
- Top: avatar + full_name + time ago (use `formatDistanceToNow`)
- Middle: latest post title (large bold) + first 100 chars of content (extracted from JSONB blocks)
- If BGM: show `♪ songTitle`
- If status: show `status_emoji + status_text`
- Bottom: "스튜디오 방문하기 →" button navigating to `/studio/{roomId}`
- Close: click backdrop or X button
- Auto-advance timer: 4 second `setTimeout`, advances to next studio in the list, calls `onNext(index+1)`
- Progress bar at top (thin animated bar like Instagram)
- Props: `studios: StoryStudio[]`, `initialIndex: number`, `onClose`, `onVisit(roomId)`

#### 4. Edit: `src/components/worship-studio/StudioHeader.tsx`
Add mini BGM player between title and right icons:
- New props: `bgmSongTitle?: string`, `bgmSongArtist?: string`, `bgmVideoId?: string`, `bgmRoomId?: string`, `bgmOwnerName?: string`
- When BGM props present, render a compact player element:
  - Container: `flex items-center gap-1.5 bg-muted/50 rounded-full px-3 py-1 max-w-[200px]`
  - Music icon (small)
  - Song title with CSS marquee animation (keyframes `marquee` scrolling text left if > 15 chars, else static truncate)
  - Play/Pause icon button (uses `useMusicPlayer` context same as StudioBGMBar)
- When no BGM: nothing rendered, no space taken
- Marquee CSS: `@keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-100%); } }` applied via inline style or a utility class

#### 5. Edit: `src/pages/WorshipStudio.tsx`
- Import `StoryBar` component
- Place `<StoryBar onStudioSelect={handleStudioSelect} myStudioId={myStudio?.id} />` between `<StudioHeader>` and the main content `<div>`
- Pass BGM props to `StudioHeader`: `bgmSongTitle`, `bgmVideoId`, `bgmRoomId`, `bgmOwnerName` from `currentStudio`
- Remove the `<StudioBGMBar>` rendering block (lines 131-139) — keep the import for backward compat but don't render it

#### 6. Edit: `src/components/worship-studio/StudioBGMBar.tsx`
- Keep file intact for backward compatibility
- No changes needed since we simply stop rendering it in WorshipStudio.tsx

---

### Technical Details

**Story Bar data flow:**
```text
useStoryBarStudios() 
  ├─ useFriendStudios()    → friend rooms + owner + bgm + latestPostAt
  ├─ useAmbassadorRooms()  → ambassador rooms + owner
  ├─ supabase query        → latest post per room (title, content blocks)
  ├─ worship_rooms fields  → status_emoji, status_text, cover_image_url
  └─ localStorage          → visit frequency counter for sorting
```

**Marquee animation** (CSS-only, no packages):
```css
@keyframes marquee {
  0% { transform: translateX(0%); }
  100% { transform: translateX(-100%); }
}
```
Applied conditionally when song title length > 15 characters.

**Story Card auto-advance**: Simple `useEffect` with `setTimeout(4000)` that increments the active index, reset on user interaction (tap to pause, swipe to advance).

**Files created:** 3 (`useStoryBarStudios.ts`, `StoryBar.tsx`, `StoryCard.tsx`)
**Files edited:** 2 (`StudioHeader.tsx`, `WorshipStudio.tsx`)
**Files unchanged:** `StudioBGMBar.tsx` (kept, just not rendered)


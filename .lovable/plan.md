
# Full-Screen WorshipStudio Page Implementation

## Overview
Replace the current `WorshipRooms.tsx` with a new `WorshipStudio.tsx` that provides a full-screen immersive experience, independent of `AppLayout`, with a dedicated header, sidebar (desktop), and BGM bar.

## Current State Analysis
- `WorshipRooms.tsx` currently uses `AppLayout` wrapper (not full-screen)
- New worship-studio components are ready: `StudioHeader`, `StudioSidebar`, `StudioMainPanel`, `StudioView`, `StudioFeed`, `StudioBGMBar`, etc.
- Need to create a new page that orchestrates all these components in a full-screen layout

## Architecture

```text
Desktop Layout:
┌─────────────────────────────────────────────────────────────────────┐
│ StudioHeader [← Back]              [Notifications] [Settings]       │
├──────────────┬──────────────────────────────────────────────────────┤
│              │                                                      │
│  StudioSidebar │     StudioMainPanel                               │
│  (280px)     │     [Feed] [My Studio] [Discover - mobile only]     │
│  - My Network│                                                      │
│  - Ambassadors│     Content Area (tabs)                             │
│  - Discover  │                                                      │
│              │                                                      │
├──────────────┴──────────────────────────────────────────────────────┤
│ StudioBGMBar (conditional - when studio has BGM)                   │
└─────────────────────────────────────────────────────────────────────┘

Mobile Layout:
┌─────────────────────────────────────────────────────────────────────┐
│ StudioHeader [← Back]              [Notifications] [Settings]       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│     StudioMainPanel (no sidebar)                                    │
│     [Feed] [My Studio] [Discover]                                   │
│                                                                     │
│     Content Area (tabs)                                             │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│ StudioBGMBar (conditional)                                          │
└─────────────────────────────────────────────────────────────────────┘
```

## Implementation Details

### 1. Create `src/pages/WorshipStudio.tsx` (New File)

```typescript
// Full-screen immersive page (no AppLayout)
const WorshipStudio = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  
  // Get user's own studio
  const { room: myStudio } = useWorshipRoom(user?.id);
  
  // Track selected studio for viewing others
  const [selectedStudioId, setSelectedStudioId] = useState<string | null>(null);
  
  // Current studio being viewed (for BGM)
  const currentStudio = selectedStudioId 
    ? (use query to fetch) 
    : myStudio;
  
  return (
    <div className="fixed inset-0 bg-background z-50 flex flex-col">
      <SEOHead title="Worship Studio" description="..." />
      
      {/* Header with back button */}
      <StudioHeader 
        onBack={() => navigate('/dashboard')}
        onSettings={...}
        onNotifications={...}
      />
      
      {/* Main content area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Desktop: Show sidebar */}
        {!isMobile && (
          <StudioSidebar 
            onStudioSelect={setSelectedStudioId}
            selectedStudioId={selectedStudioId}
          />
        )}
        
        {/* Main panel with tabs */}
        <StudioMainPanel
          myStudioId={myStudio?.id}
          selectedStudioId={selectedStudioId}
          onStudioSelect={setSelectedStudioId}
        />
      </div>
      
      {/* BGM Bar - shows when viewing a studio with BGM */}
      {currentStudio?.bgm_song && (
        <StudioBGMBar
          songTitle={currentStudio.bgm_song.title}
          songArtist={currentStudio.bgm_song.artist}
          videoId={extractVideoId(currentStudio.bgm_song.youtube_url)}
          roomId={currentStudio.id}
          ownerName={currentStudio.owner?.full_name}
        />
      )}
    </div>
  );
};
```

### 2. Update `App.tsx` Routes

Change the route to use the new `WorshipStudio` component:

```typescript
const WorshipStudio = lazy(() => import("./pages/WorshipStudio"));

// Route remains the same URL but uses new component
<Route path="/rooms" element={<ProtectedRoute><WorshipStudio /></ProtectedRoute>} />
<Route path="/rooms/:roomId" element={<ProtectedRoute><WorshipStudio /></ProtectedRoute>} />
```

### 3. Delete Old `WorshipRooms.tsx`

Remove the old file after verifying the new one works.

### 4. Update `StudioMainPanel.tsx` Enhancements

- Pass `selectedStudioId` to `StudioView` correctly
- Handle tab switching when a friend's studio is selected (switch to "studio" tab)
- Add smooth transitions between tabs

### 5. BGM Bar Positioning Fix

The current `StudioBGMBar` uses `fixed bottom-0` which works, but we need to ensure:
- Content area has proper padding-bottom when BGM bar is visible
- BGM bar is inside the full-screen container, not global

## File Changes Summary

| File | Action | Description |
|------|--------|-------------|
| `src/pages/WorshipStudio.tsx` | CREATE | New full-screen immersive page |
| `src/pages/WorshipRooms.tsx` | DELETE | Remove old AppLayout-based page |
| `src/App.tsx` | MODIFY | Update lazy import to WorshipStudio |
| `src/components/worship-studio/StudioMainPanel.tsx` | MODIFY | Add tab switch on studio selection |
| `src/components/worship-studio/StudioBGMBar.tsx` | MODIFY | Adjust positioning for full-screen layout |

## Key Features

1. **Full-Screen Immersive** - Uses `fixed inset-0 z-50` to overlay entire viewport
2. **Back Button Navigation** - Returns to `/dashboard`
3. **Responsive Layout** - Desktop shows sidebar, mobile shows 3 tabs
4. **BGM Integration** - Shows BGM bar when viewing any studio with BGM set
5. **Studio Selection Flow** - Clicking friend/ambassador in sidebar or feed updates main view
6. **SEO Support** - Proper meta tags for the page

## Technical Considerations

- Uses existing hooks: `useWorshipRoom`, `useWorshipRoomById`, `useFriendStudios`
- No new database changes required
- Maintains existing RLS and visibility logic
- Works with existing BGM/music player context

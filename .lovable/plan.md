

## YouTube 앱 직접 열기 — 전체 사이트 적용

### 현재 상태
- `SongCard.tsx`만 `vnd.youtube://` 딥링크 로직이 있음
- `SongTable.tsx`, `SetSongItem.tsx`, `YouTubeSearchBar.tsx`는 모두 `window.open(url, '_blank')` 사용 → 새 탭이 먼저 열리고, 그 후 앱으로 이동

### 해결 방안

#### 1. 공통 유틸리티 생성
**새 파일: `src/lib/youtubeHelper.ts`**

```ts
export function openYouTubeUrl(url: string) {
  if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
    const videoId = url.match(/(?:youtube\.com\/.*v=|youtu\.be\/)([^#&?]+)/)?.[1];
    if (videoId) {
      window.location.href = `vnd.youtube://${videoId}`;
      setTimeout(() => { window.open(url, "_blank"); }, 500);
      return;
    }
  }
  window.open(url, "_blank");
}
```

#### 2. 적용 대상 파일 (4곳)

| 파일 | 변경 |
|------|------|
| `src/components/SongCard.tsx` | 인라인 로직 → `openYouTubeUrl(url)` 호출로 교체 |
| `src/components/SongTable.tsx` | `handleYoutubeClick` → `openYouTubeUrl` 사용 |
| `src/components/SetSongItem.tsx` | `window.open(song.youtube_url, "_blank")` → `openYouTubeUrl` |
| `src/components/YouTubeSearchBar.tsx` | `handlePreview` → `openYouTubeUrl` |

프로필 YouTube URL (ProfileSidebarCard, AdminUserProfileDialog)은 유저 채널 링크이므로 제외.


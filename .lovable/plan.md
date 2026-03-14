

## YouTube 앱 바로 열기 — 새 탭 없이 (최종 계획)

### 문제
현재 `openYouTubeUrl`이 딥링크 시도 후 500ms 뒤 **항상** `window.open`으로 새 탭을 열어, 앱이 열려도 불필요한 빈 탭이 생김.

### 수정

**파일: `src/lib/youtubeHelper.ts`** (1곳만 수정하면 전체 적용)

`visibilitychange` 이벤트로 앱 실행 여부를 감지:
- 딥링크 호출 → 앱이 열리면 브라우저가 백그라운드 → `document.hidden = true` → fallback 취소
- 앱이 없으면 페이지가 그대로 → 1.5초 후 `window.open`으로 웹 열기

```ts
export function openYouTubeUrl(url: string) {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  if (isMobile) {
    const videoId = url.match(/(?:youtube\.com\/.*v=|youtu\.be\/)([^#&?\s]+)/)?.[1];
    if (videoId) {
      let appOpened = false;
      const onVisChange = () => { if (document.hidden) appOpened = true; };
      document.addEventListener("visibilitychange", onVisChange);
      window.location.href = `vnd.youtube://${videoId}`;
      setTimeout(() => {
        document.removeEventListener("visibilitychange", onVisChange);
        if (!appOpened) window.open(url, "_blank");
      }, 1500);
      return;
    }
  }
  window.open(url, "_blank");
}
```

### 적용 범위
이 유틸리티를 이미 사용하는 모든 곳에 자동 적용:
- `SongCard.tsx` — 송 라이브러리
- `SongTable.tsx` — 송 라이브러리 테이블뷰
- `SetSongItem.tsx` — 워십세트 빌더
- `YouTubeSearchBar.tsx` — 노래 추가 다이얼로그
- `BandView.tsx` — 밴드뷰

**변경 파일: 1개** (`src/lib/youtubeHelper.ts`)


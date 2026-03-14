

## 디버그: 모바일 브라우저 YouTube 딥링크 문제

### 문제 분석

모바일 브라우저에서 테스트 중이므로 `Capacitor.isNativePlatform()`은 `false`를 반환하고, 모바일 브라우저 경로를 탑니다:
- **Android**: `intent://` 스킴 → 앱이 열려야 함
- **iOS**: `vnd.youtube://` → `visibilitychange` 감지 → 앱 안 열리면 새 탭

가능한 원인:
1. Lovable 프리뷰가 iframe 안에서 실행되어 `window.location.href`로 커스텀 URL 스킴 접근이 차단됨
2. `visibilitychange` 이벤트가 제대로 감지되지 않아 항상 fallback (새 탭)이 실행됨
3. iPhone인지 Android인지에 따라 다른 경로

### 변경 사항

**`src/lib/youtubeHelper.ts`** — console.log 추가로 어떤 경로를 타는지 확인

```ts
export async function openYouTubeUrl(url: string) {
  const videoId = ...;
  
  console.log('[YT] openYouTubeUrl called', { url, videoId });
  console.log('[YT] isNative:', Capacitor.isNativePlatform());
  console.log('[YT] userAgent:', navigator.userAgent);
  
  // ... Capacitor native 경로
  console.log('[YT] Taking Capacitor native path');
  
  // ... Mobile browser 경로
  console.log('[YT] Taking mobile browser path', { isAndroid });
  
  // ... iOS visibilitychange
  console.log('[YT] iOS: attempting vnd.youtube://' + videoId);
  // setTimeout 안에서:
  console.log('[YT] iOS timeout fired, appOpened:', appOpened);
  
  // ... Desktop fallback
  console.log('[YT] Desktop fallback: window.open');
}
```

다음 메시지에서 콘솔 로그를 확인하여 정확한 원인을 파악하겠습니다.


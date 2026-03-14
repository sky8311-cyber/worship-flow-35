

## 문제 원인

Capacitor 네이티브 앱(WKWebView / Android WebView) 안에서는 `window.location.href = "vnd.youtube://..."` 같은 커스텀 URL 스킴이 **차단**됩니다. 일반 브라우저에서는 작동하지만 WebView에서는 OS가 해당 스킴을 처리하지 못해 fallback으로 새 탭이 열립니다.

## 해결 방안

**`@capacitor/app-launcher`** 플러그인을 사용하여 네이티브 앱 환경에서 YouTube 앱을 직접 열기.

### 변경 사항

**1. 패키지 추가**
- `@capacitor/app-launcher` 설치

**2. `src/lib/youtubeHelper.ts` 수정**

```text
호출 흐름:

openYouTubeUrl(url)
  ├─ Capacitor 네이티브?
  │   ├─ AppLauncher.canOpenUrl("vnd.youtube://") 확인
  │   │   ├─ 가능 → AppLauncher.openUrl("vnd.youtube://{videoId}")
  │   │   └─ 불가 → window.open(url, "_blank")
  │   └─ (Android는 intent:// 대신 AppLauncher 사용)
  └─ 웹 브라우저?
      ├─ 모바일 브라우저 → 기존 intent:// / vnd.youtube:// 로직 유지
      └─ 데스크톱 → window.open(url, "_blank")
```

핵심 로직:
```ts
import { Capacitor } from '@capacitor/core';
import { AppLauncher } from '@capacitor/app-launcher';

if (Capacitor.isNativePlatform()) {
  // 네이티브 앱: AppLauncher로 YouTube 앱 직접 열기
  const { value } = await AppLauncher.canOpenUrl({ url: 'vnd.youtube://' });
  if (value) {
    await AppLauncher.openUrl({ url: `vnd.youtube://${videoId}` });
  } else {
    window.open(url, "_blank");
  }
} else {
  // 웹: 기존 intent:// / visibilitychange 로직 유지
}
```

**3. 로컬 빌드 시 `npx cap sync` 필요** (네이티브 플러그인 등록)

### 결과

| 환경 | 동작 |
|------|------|
| Capacitor 앱 + YouTube 있음 | AppLauncher로 앱 바로 열림 |
| Capacitor 앱 + YouTube 없음 | 새 탭으로 YouTube 웹 |
| 모바일 브라우저 | 기존 intent/vnd 딥링크 유지 |
| 데스크톱 | 새 탭 |


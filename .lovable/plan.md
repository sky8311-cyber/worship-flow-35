

## 문제: iOS에서 Universal Link가 앱을 열지 못함

현재 iOS 경로에서 `document.createElement("a")` + `.click()`을 사용하고 있지만, **프로그래밍 방식으로 생성된 앵커 클릭은 Universal Link를 트리거하지 않습니다.** iOS는 실제 사용자 탭 이벤트가 있는 앵커만 Universal Link로 처리합니다. 그래서 항상 새 탭(웹 YouTube)으로 열립니다.

이전에 작동했던 `vnd.youtube://` 스킴 방식으로 되돌리되, `visibilitychange` 대신 더 간단한 타이머 fallback을 사용합니다.

### 변경 사항

**`src/lib/youtubeHelper.ts`** — iOS 경로 수정

```text
iOS 분기 (line 45-55):

현재: createElement("a") + click() → 항상 새 탭
변경: window.location.href = vnd.youtube://VIDEO_ID
      + 2초 후 fallback으로 window.open(url, "_blank")
```

로직:
1. `window.location.href = "vnd.youtube://VIDEO_ID"` — YouTube 앱 열기 시도
2. 앱이 열리면 페이지가 백그라운드로 → setTimeout 실행 안 됨
3. 앱이 없으면 2초 후 `window.open(url, "_blank")`로 웹 fallback

이 방식이 원래 작동했던 패턴과 동일합니다.


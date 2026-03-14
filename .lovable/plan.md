

## 문제 분석

모바일 브라우저는 백그라운드 상태에서 `setTimeout`을 **일시 중지**합니다. 흐름:

1. 딥링크 → YouTube 앱 열림 → `appOpened = true` ✓
2. 사용자가 YouTube에서 시간을 보냄 (타이머 일시 중지됨)
3. 크롬으로 복귀 → 타이머 재개 → 하지만 `visibilitychange`로 `hidden=false` 이벤트가 먼저 발생할 수 있어 race condition 발생

### 해결: 앱이 열리면 타이머 자체를 취소

**파일: `src/lib/youtubeHelper.ts`**

`clearTimeout`으로 앱이 성공적으로 열렸을 때 fallback 타이머를 즉시 제거:

```ts
export function openYouTubeUrl(url: string) {
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile) {
    const videoId = url.match(/(?:youtube\.com\/.*v=|youtu\.be\/)([^#&?\s]+)/)?.[1];
    if (videoId) {
      const fallbackTimer = setTimeout(() => {
        document.removeEventListener("visibilitychange", onVisChange);
        window.open(url, "_blank");
      }, 1500);

      const onVisChange = () => {
        if (document.hidden) {
          // 앱이 열렸으므로 fallback 취소
          clearTimeout(fallbackTimer);
          document.removeEventListener("visibilitychange", onVisChange);
        }
      };
      document.addEventListener("visibilitychange", onVisChange);

      window.location.href = `vnd.youtube://${videoId}`;
      return;
    }
  }

  window.open(url, "_blank");
}
```

핵심 변경: `document.hidden`이 감지되는 즉시 `clearTimeout`으로 fallback을 **완전히 제거**. 크롬으로 돌아와도 새 탭이 열리지 않음.

**변경 파일: 1개**


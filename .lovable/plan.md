

## 유튜브 딥링크 개선 — 새 탭 최소화

**파일: `src/lib/youtubeHelper.ts`** (1개 파일만 수정)

### 변경 내용

- **Android**: `intent://` 스킴 사용 → OS가 앱 열기/브라우저 fallback 자동 처리 (새 탭 없음)
- **iOS**: `vnd.youtube://` 시도 → `visibilitychange`로 앱 열림 감지 → 앱 안 열렸으면 `window.open(url, "_blank")`로 새 탭
- **데스크톱**: 기존대로 `window.open(url, "_blank")`

### 결과

| 상황 | 동작 |
|------|------|
| 모바일 + 앱 있음 | 앱 바로 열림, 새 탭 없음 |
| 모바일 + 앱 없음 | 새 탭으로 YouTube 웹 |
| 데스크톱 | 새 탭으로 YouTube 웹 |


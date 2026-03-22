

## 두 가지 수정

### 1. 튜토리얼 성능 개선
**`src/components/tutorial/TutorialOverlay.tsx`**:
- `scrollIntoView` behavior: `"smooth"` → `"instant"`
- setTimeout 400ms → 50ms
- 스크롤 리스너에 `{ passive: true }` 추가

### 2. CardHeader 내 뷰 토글과 필터 사이 오버랩 수정
**원인**: CardHeader 패딩을 `p-6` → `p-4`로 줄이면서 CardTitle 행과 absolute 위치의 뷰 토글(
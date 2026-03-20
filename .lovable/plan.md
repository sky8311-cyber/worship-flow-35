

## 가사 길이 확장: 200 → 400자

### 수정
**파일**: `supabase/functions/generate-worship-set/index.ts` (line 48)

```typescript
// 현재
function truncateLyrics(lyrics: string | null, maxLen = 200): string | null {

// 변경
function truncateLyrics(lyrics: string | null, maxLen = 400): string | null {
```

1줄 변경. Edge Function 자동 재배포.


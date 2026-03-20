

## 아티스트 자동 입력 + 검색 결과 10개 확장

### 문제 원인
1. **아티스트 자동 입력 안 됨**: `handleSelect`에서 `if (!artist.trim())` 조건 때문에, 이미 `initialArtist`가 있으면 channelTitle로 덮어쓰지 않음. YouTube 선택 시 항상 channelTitle을 제안해야 함.
2. **검색 결과 5개**: Edge Function의 `maxResults: "5"` → `"10"`으로 변경 필요.

### 수정

| 파일 | 변경 |
|---|---|
| `src/components/songs/SmartSongEntry.tsx` (line 68-70) | 선택 시 항상 `setArtist(result.channelTitle)` 적용 (조건 제거) |
| `supabase/functions/search-youtube/index.ts` (line 62) | `maxResults: "5"` → `"10"` |

**SmartSongEntry 변경**:
```typescript
const handleSelect = (result: YouTubeResult) => {
  setSelectedResult(result);
  setArtist(result.channelTitle); // 항상 채널명으로 자동 입력 (수정 가능)
};
```

**Edge Function 변경**:
```typescript
maxResults: "10",
```


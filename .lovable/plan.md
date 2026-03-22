

## 수정 계획: 테이블뷰 악보 복구 + 플로팅 버튼 개선

### 1. 테이블뷰 악보 버튼 복구
**파일:** `src/pages/SongLibrary.tsx` (line 891-892)

SongTable에 전달하는 songs 데이터에 `score_file_url` 매핑이 빠져있음. SongCard에는 `song_scores?.[0]?.file_url`을 매핑하지만 SongTable에는 raw 데이터를 그대로 전달.

수정: SongTable에도 동일하게 `score_file_url` 매핑된 데이터 전달:
```tsx
songs={sortedAndFilteredSongs.map(song => ({
  ...song,
  score_file_url: (song as any).song_scores?.[0]?.file_url || null
}))}
```

### 2. 플로팅 버튼 3개 통일 디자인 (동그란 아이콘 + 아래 작은 텍스트)
**파일:** `src/pages/SongLibrary.tsx` (line 942-967), `src/components/FloatingSearchButton.tsx`, `src/components/FloatingCartIndicator.tsx`

현재: "곡 추가"가 알약형으로 크고, 검색/카트는 원형. 세 버튼 스타일 불일치.

변경: 3개 버튼 모두 **원형 아이콘 + 아래 작은 라벨** 형태로 통일:

```
  [🔍]        [＋]        [🛒]
 곡 검색    새곡 추가    곡 담기
```

- FloatingSearchButton: 아이콘 아래에 "곡 검색" 작은 텍스트 추가
- FloatingCartIndicator: 아이콘 아래에 "곡 담기" 작은 텍스트 추가
- 곡 추가 버튼: 알약형 → 원형 + 아래 "새곡 추가" 텍스트

각 버튼을 `flex flex-col items-center gap-1` wrapper로 감싸고, 텍스트는 `text-[10px]` 정도의 작은 사이즈.

### 3. 헤더 버튼 오버랩 수정
**파일:** `src/pages/SongLibrary.tsx` (line 669)

현재 `pr-24`로 패딩을 줬지만 버튼이 여전히 겹침. 헤더 영역의 레이아웃을 점검하여 버튼과 필터 영역이 겹치지 않도록 수정.

### 수정 파일
1. `src/pages/SongLibrary.tsx` — SongTable score 매핑, 플로팅 버튼 디자인, 오버랩 수정
2. `src/components/FloatingCartIndicator.tsx` — 라벨 추가
3. `src/components/FloatingSearchButton.tsx` — 라벨 추가


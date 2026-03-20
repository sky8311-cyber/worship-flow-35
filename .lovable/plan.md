

## 가사 검색 경량화: 단계 축소 + delay 제거 + 클라이언트 타임아웃

### 문제

현재 `scrape-lyrics`는 최악의 경우 **9단계 × 최대 5개 후보 상세 페이지 + 각 200-300ms delay** = 60초+ 소요:

```text
1. Gasazip (title+artist+subtitle)     → 검색 + 5개 상세
2. Gasazip (title+artist, no subtitle) → 검색 + 5개 상세  (200ms delay)
3. Gasazip (title only)                → 검색 + 5개 상세  (200ms delay)
4. Bugs Track (title+artist)           → 검색 + 5개 상세  (200ms delay)
5. Bugs Track (title only)             → 검색 + 5개 상세  (200ms delay)
6. Bugs Lyrics Search                  → 검색 + 1개 상세  (200ms delay)
7. Melon                               → 검색 + 1개 상세  (300ms delay)
8. Google Fallback                     → 검색 + 8개 상세  (300ms delay)
9. Build Candidate Links               → 검색 2개
```

실제로 CCM은 Gasazip 첫 검색에서 상위 2-3개 안에 거의 다 있음. 나머지는 과잉.

### 수정 계획

#### 1. `scrape-lyrics/index.ts` — 대폭 경량화

**제거:**
- 모든 `await new Promise(r => setTimeout(r, ...))` delay 제거
- Gasazip subtitle 제거 재시도 (2단계) 제거
- Gasazip title-only 재시도 (3단계) 제거
- Bugs title-only 재시도 (5단계) 제거
- Google fallback의 개별 URL 스크래핑 제거 (후보 URL만 수집)
- `buildCandidateLinks` 함수 제거 (Google fallback이 이미 후보 반환)

**축소:**
- 후보 수: 5개 → **3개** (Gasazip, Bugs 모두)

**최종 흐름 (4단계):**
```text
1. Gasazip (title+artist) → 검색 + 상위 3개 후보 중 best match
2. Bugs Track (title+artist) → 검색 + 상위 3개 후보 중 best match
3. Bugs Lyrics Search → 검색 + 1개
4. Google Search → 후보 URL만 수집 (스크래핑 안함, candidates로 반환)
```

artist가 비어있으면 자동으로 title-only 검색이 됨 (buildSearchQuery가 처리). 별도 재시도 불필요.

#### 2. `SmartSongFlow.tsx` — 30초 타임아웃

`searchLyrics`에 `AbortController` + 30초 타임아웃 추가. 타임아웃 시 스피너 해제 + 토스트.

### 수정 파일 (2개)

| 파일 | 변경 |
|---|---|
| `supabase/functions/scrape-lyrics/index.ts` | delay 제거, 재시도 단계 제거, 후보 3개로 축소, Google은 URL만 수집 |
| `src/components/songs/SmartSongFlow.tsx` | 30초 AbortController 타임아웃 |


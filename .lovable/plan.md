

## 가사 검색 실패 근본 원인 + 수정 계획

### 근본 원인 (Gasazip 실제 HTML로 확인)

"내가 예수를 못박았습니다"를 Gasazip에서 **title-only로 검색하면 3번째 결과에 정확한 곡이 있음** (gasazip.com/3034221, "투 미니스트리"). 하지만 현재 코드는 두 가지 버그로 이 곡을 찾지 못함:

**버그 1: artist가 검색을 오염시킴**
- `match-lyrics`가 artist="전은주"를 전달 → Gasazip 검색어가 "내가 예수를 못박았습니다 전은주"가 됨
- 결과: 전은주의 다른 노래만 나옴 (엄마의 밥, 소원, 이젠 안녕)
- title+artist 실패 후 **title-only 재시도가 없음** (이전에 제거됨)

**버그 2: 검색 결과에서 제목을 못 읽음**
- candidateRegex가 `href="...">([^<]*)`로 linkText를 추출하는데, 실제 HTML 구조는:
```html
<a href="https://www.gasazip.com/3034221" class="list-group-item">
  <div><h4>내가 예수를 못 박았습니다<code>투 미니스트리</code></h4></div>
  <h5>가사 미리보기...</h5>
</a>
```
- `([^<]*)` 는 `<a>` 태그 바로 다음의 공백만 캡처 → linkText 항상 빈 문자열 → preScore 항상 0 → 사전 필터링 불가

**버그 3: 클라이언트 타임아웃 미작동**
- `AbortController`를 생성했지만 `supabase.functions.invoke()`에 `signal`을 전달하지 않음 → 타임아웃이 실제로 작동하지 않음

### 수정 계획

#### 1. `scrape-lyrics/index.ts` — Gasazip 검색 결과 파싱 수정

candidateRegex를 **2단계 파싱**으로 교체:
- 먼저 각 `<a href=".../{songId}"...>...</a>` 블록을 추출
- 블록 내부에서 `<h4>` 태그의 텍스트를 제목으로 추출
- 이렇게 하면 linkText가 정확한 곡 제목이 되어 사전 유사도 점수 계산 가능

```
기존: href 속성 뒤의 빈 텍스트 캡처 → linkText=""
수정: <h4> 태그 내용 파싱 → linkText="내가 예수를 못 박았습니다"
```

#### 2. `scrape-lyrics/index.ts` — Main Handler에 title-only 재시도 추가

4단계 모두 실패 후, **title-only로 Gasazip 1회 재시도** 추가:

```
기존 흐름:
1. Gasazip(title+artist) → 2. Bugs(title+artist) → 3. BugsLyrics → 4. Google

수정 흐름:
1. Gasazip(title+artist) → 2. Bugs(title+artist) → 3. BugsLyrics
→ 4. artist가 있었으면 Gasazip(title-only) 재시도
→ 5. Google 후보 URL 수집
```

#### 3. `SmartSongFlow.tsx` — 타임아웃을 Promise.race로 수정

`AbortController` 대신 `Promise.race`로 30초 타임아웃 구현:

```typescript
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('TIMEOUT')), 30000)
);
const result = await Promise.race([
  supabase.functions.invoke("match-lyrics", { body: {...} }),
  timeoutPromise
]);
```

### 수정 파일 (2개)

| 파일 | 변경 |
|---|---|
| `supabase/functions/scrape-lyrics/index.ts` | Gasazip 파싱 수정 + title-only 재시도 |
| `src/components/songs/SmartSongFlow.tsx` | Promise.race 타임아웃 |


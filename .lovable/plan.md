

## 가사 검색 근본 수정: 다중 후보 검증 + 웹 fallback + 후보 링크 UI

### 근본 원인

로그와 실제 Gasazip 페이지를 대조한 결과:
- "내가 예수를 못박았습니다"로 검색하면 Gasazip에서 **3번째 결과**에 정확한 곡이 있음
- 현재 코드는 **첫 번째 결과만** 확인 후 mismatch면 바로 포기
- Bugs/Melon도 동일하게 첫 번째 결과만 확인

### 변경 계획

---

#### 1. `scrape-lyrics/index.ts` — 다중 후보 검증 (핵심 수정)

**Gasazip**: 검색 결과에서 첫 번째만이 아니라 **모든 후보**(최대 5개)를 추출하여 제목 유사도가 가장 높은 것을 선택

```
기존: regex로 첫 번째 songId만 추출 → 상세 페이지 → 검증 실패 → 포기
수정: regex로 모든 songId 추출 → 유사도 점수 계산 → 최고 점수 후보의 상세 페이지 → 가사 추출
```

구체적으로:
- `searchHtml.matchAll()` 로 모든 `href="/(\d+)"` + 제목/아티스트 추출
- 각 후보에 대해 `calculateSimilarity(title, candidateTitle)` 계산
- 가장 높은 유사도의 후보를 선택하여 상세 페이지 접근
- 검색 결과 페이지 자체에 제목이 `<h4>` 태그에 있으므로 상세 페이지 없이 사전 필터링 가능

**Bugs Track**: 동일 패턴 적용 — 여러 `data-trackid` 중 제목 매칭 최고점 선택

---

#### 2. `scrape-lyrics/index.ts` — Google 웹 검색 fallback 추가 (5단계)

4단계(Melon) 실패 후 **5단계: Google 검색 기반 가사 페이지 탐색** 추가

```
5단계: Google 검색 fallback
  - 검색어: "{title} {artist} 가사" site:gasazip.com OR site:music.bugs.co.kr
  - Google 검색 결과에서 URL 추출
  - 해당 URL에서 가사 스크래핑 시도
```

이 방식은 Gasazip/Bugs의 내부 검색보다 Google의 한국어 검색이 더 정확한 경우를 커버함.

---

#### 3. `match-lyrics/index.ts` — 후보 링크 반환 추가

`scrape-lyrics` 결과가 없을 때, Google 검색으로 후보 URL 목록을 반환:

```typescript
// 응답 포맷 확장
{
  found: boolean,
  lyrics: string | null,
  source: string | null,
  candidates?: Array<{ url: string, title: string, source: string }> // 새로 추가
}
```

---

#### 4. `SmartSongFlow.tsx` — 후보 링크 UI (Step4)

가사 검색 실패 시 후보 링크 목록을 카드 형태로 표시:

```
┌─────────────────────────────────┐
│ 🔗 관련 가사 페이지를 찾았습니다    │
│                                 │
│ ┌─ "내가 예수를 못 박았습니다"  ──┐ │
│ │ gasazip.com          [열기]  │ │
│ └──────────────────────────────┘ │
│ ┌─ "내가 예수를 못박았습니다"   ──┐ │
│ │ music.bugs.co.kr     [열기]  │ │
│ └──────────────────────────────┘ │
│                                 │
│ 위 링크에서 가사를 복사해         │
│ 아래에 붙여넣어주세요             │
└─────────────────────────────────┘
```

- 후보 URL을 클릭하면 새 탭에서 열림
- 사용자가 가사를 복사/붙여넣기 가능

---

### 수정 파일 (3개)

| 파일 | 변경 |
|---|---|
| `supabase/functions/scrape-lyrics/index.ts` | 다중 후보 검증 + Google fallback |
| `supabase/functions/match-lyrics/index.ts` | 후보 링크 반환 추가 |
| `src/components/songs/SmartSongFlow.tsx` | 후보 링크 UI 표시 |


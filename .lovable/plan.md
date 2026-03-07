

## AI 가사 찾기 정확도 개선

### 문제 분석
현재 `scrape-lyrics`는 `title`과 `artist`만 받아서 검색 후 **첫 번째 결과를 무조건 사용**합니다. CCM 곡은 동명이곡이 많고, 부제(subtitle)나 아티스트 표기가 다양하여 잘못된 곡을 가져올 확률이 높습니다.

### 개선 전략: 3단계

#### 1. 더 많은 컨텍스트 전달
**`process-enrichment-queue/index.ts`** — songs 테이블에서 추가 필드 조회 및 전달:
- `subtitle` (부제 — 예: "주 만이 나의 산성" 같은 부제)
- `youtube_url` (유튜브 링크가 있으면 정확한 곡 식별에 도움)
- `notes` (추가 메모)

**`enrich-song/index.ts`** — 새 필드들을 `scrape-lyrics` 호출 시 함께 전달

#### 2. 스크래핑 검색 쿼리 개선 + 결과 검증
**`scrape-lyrics/index.ts`** 핵심 변경:

- **검색 쿼리 강화**: `subtitle`이 있으면 검색어에 포함 (예: "주만이 나의산성 마커스워십" → 더 정확한 매칭)
- **YouTube 제목 추출**: `youtube_url`이 있으면 YouTube oEmbed API로 영상 제목을 가져와서 추가 검증 데이터로 활용
- **결과 검증 로직 추가**: 검색 결과의 곡 제목/아티스트와 원본을 비교하여 유사도가 낮으면 (50% 미만) 해당 결과를 스킵하고 다음 fallback으로 진행
  - Gasazip: `gasatitle`/`gasasinger` 태그에서 추출한 값과 비교
  - Bugs: 검색 결과 페이지의 제목/아티스트와 비교
  - Melon: 동일하게 검증

#### 3. AI 분석 프롬프트에 컨텍스트 추가
**`enrich-song/index.ts`** — AI 프롬프트에 subtitle, youtube 제목 등을 포함하여 더 정확한 분석 유도

### 변경 파일 요약

| 파일 | 변경 내용 |
|------|----------|
| `supabase/functions/process-enrichment-queue/index.ts` | songs 쿼리에 `subtitle`, `youtube_url`, `notes` 추가, enrich-song 호출 시 전달 |
| `supabase/functions/enrich-song/index.ts` | subtitle/youtube_url 수신, scrape-lyrics에 전달, AI 프롬프트에 컨텍스트 추가 |
| `supabase/functions/scrape-lyrics/index.ts` | subtitle 포함 검색, YouTube oEmbed로 제목 추출, 검색 결과 유사도 검증 로직 추가 |

### 검증 로직 상세

```text
검색 결과 제목: "주만이 나의 산성 (Psalm 18)"
원본 제목:     "주만이 나의 산성"
→ 정규화 후 유사도 계산 → 80% → PASS

검색 결과 제목: "산성에서 부르는 노래"  
원본 제목:     "주만이 나의 산성"
→ 정규화 후 유사도 계산 → 35% → SKIP (다음 소스로)
```

YouTube oEmbed는 API 키 없이 사용 가능:
```
https://www.youtube.com/oembed?url={youtube_url}&format=json
```
→ 응답의 `title` 필드로 정확한 곡명 확인 가능


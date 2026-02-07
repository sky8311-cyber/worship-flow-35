

# CCM 가사 전문 사이트 통합 - 가사집(Gasazip) Primary 소스 추가

## 분석 결과

### 발견된 최적 소스: 가사집 (gasazip.com)

**장점:**
- CCM/찬양곡 전문 데이터베이스 (마커스, 어노인팅, CCC 등 다수 보유)
- 안정적인 HTML 구조 (스크래핑 용이)
- 빠른 응답 속도
- 초성 검색 지원

**HTML 구조 분석:**

```html
<!-- 검색 결과 페이지 -->
<a href="https://www.gasazip.com/{id}" class="list-group-item">
  <h4 class="mb-1">곡제목 <code>아티스트</code></h4>
  <h5 class="mb-1">가사 미리보기...</h5>
</a>

<!-- 상세 페이지 -->
<h2 id="gasatitle">곡 제목</h2>
<span id="gasasinger">아티스트</span>
<div id="gasa">
  가사 내용 (br 태그로 줄바꿈)
</div>
```

---

## 현재 vs 제안 검색 순서

| 순서 | 현재 | 제안 |
|-----|------|------|
| 1 | Bugs 곡 검색 | **가사집 (gasazip.com)** ← CCM 전문! |
| 2 | Melon 검색 | Bugs 곡 검색 |
| 3 | - | Bugs 가사 검색 |
| 4 | - | Melon 검색 |

---

## 상세 구현 계획

### 1. ScrapeResult 타입 확장

```typescript
interface ScrapeResult {
  lyrics: string | null;
  source: 'gasazip' | 'bugs' | 'melon' | 'none';  // gasazip 추가
  trackInfo?: {
    title: string;
    artist: string;
  };
  error?: string;
}
```

### 2. 새 함수: `scrapeGasazipLyrics()`

```typescript
async function scrapeGasazipLyrics(title: string, artist: string): Promise<ScrapeResult> {
  try {
    const searchQuery = `${artist} ${title}`.trim();
    const searchUrl = `https://www.gasazip.com/search.html?q=${encodeURIComponent(searchQuery)}`;
    
    console.log('Gasazip search URL:', searchUrl);
    
    const searchResponse = await fetch(searchUrl, { headers: browserHeaders });
    if (!searchResponse.ok) {
      return { lyrics: null, source: 'none', error: `Gasazip search failed: ${searchResponse.status}` };
    }
    
    const searchHtml = await searchResponse.text();
    
    // 검색 결과에서 첫 번째 곡 ID 추출
    // 패턴: href="https://www.gasazip.com/{id}"
    const songIdMatch = searchHtml.match(/href="https:\/\/www\.gasazip\.com\/(\d+)"/i) ||
                        searchHtml.match(/href="https:\/\/mini\.gasazip\.com\/view\.html\?no=(\d+)"/i);
    
    if (!songIdMatch) {
      console.log('No song found in Gasazip search results');
      return { lyrics: null, source: 'none', error: 'No song found' };
    }
    
    const songId = songIdMatch[1];
    console.log('Found Gasazip song ID:', songId);
    
    // 상세 페이지에서 가사 추출
    const detailUrl = `https://www.gasazip.com/${songId}`;
    const detailResponse = await fetch(detailUrl, { headers: browserHeaders });
    
    if (!detailResponse.ok) {
      return { lyrics: null, source: 'none', error: `Detail page failed: ${detailResponse.status}` };
    }
    
    const detailHtml = await detailResponse.text();
    
    // 가사 추출: <div id="gasa">...</div>
    const lyricsMatch = detailHtml.match(/<div[^>]*id="gasa"[^>]*>([\s\S]*?)<\/div>/i);
    
    if (!lyricsMatch || !lyricsMatch[1]) {
      console.log('No lyrics found on Gasazip detail page');
      return { lyrics: null, source: 'none', error: 'Lyrics not available' };
    }
    
    // 곡 정보 추출
    const titleMatch = detailHtml.match(/<h2[^>]*id="gasatitle"[^>]*>([^<]+)<\/h2>/i);
    const artistMatch = detailHtml.match(/<span[^>]*id="gasasinger"[^>]*>([^<]+)<\/span>/i);
    
    const lyrics = stripHtml(lyricsMatch[1]).trim();
    
    if (!lyrics || lyrics.length < 20) {
      return { lyrics: null, source: 'none', error: 'Lyrics too short' };
    }
    
    console.log('Successfully scraped lyrics from Gasazip, length:', lyrics.length);
    
    return {
      lyrics,
      source: 'gasazip',
      trackInfo: {
        title: titleMatch ? stripHtml(titleMatch[1]) : title,
        artist: artistMatch ? stripHtml(artistMatch[1]) : artist
      }
    };
    
  } catch (error) {
    console.error('Gasazip scraping error:', error);
    return { lyrics: null, source: 'none', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
```

### 3. Bugs 가사 검색 폴백 함수 추가

```typescript
async function scrapeBugsLyricsSearch(title: string, artist: string): Promise<ScrapeResult> {
  try {
    const searchQuery = `${title} ${artist}`.trim();
    const searchUrl = `https://music.bugs.co.kr/search/lyrics?q=${encodeURIComponent(searchQuery)}`;
    
    console.log('Bugs lyrics search URL:', searchUrl);
    
    const searchResponse = await fetch(searchUrl, { headers: browserHeaders });
    if (!searchResponse.ok) {
      return { lyrics: null, source: 'none', error: `Lyrics search failed: ${searchResponse.status}` };
    }
    
    const searchHtml = await searchResponse.text();
    
    // 가사 검색 결과에서 트랙 ID 추출
    const trackIdMatch = searchHtml.match(/data-trackid="(\d+)"/i) || 
                         searchHtml.match(/href="\/track\/(\d+)"/i);
    
    if (!trackIdMatch) {
      return { lyrics: null, source: 'none', error: 'No track found in lyrics search' };
    }
    
    const trackId = trackIdMatch[1];
    
    // 기존 트랙 페이지 가사 추출 로직 재사용
    const trackUrl = `https://music.bugs.co.kr/track/${trackId}`;
    const trackResponse = await fetch(trackUrl, { headers: browserHeaders });
    
    if (!trackResponse.ok) {
      return { lyrics: null, source: 'none', error: `Track page failed: ${trackResponse.status}` };
    }
    
    const trackHtml = await trackResponse.text();
    
    let lyricsMatch = trackHtml.match(/<xmp[^>]*>([\s\S]*?)<\/xmp>/i);
    if (!lyricsMatch) {
      lyricsMatch = trackHtml.match(/<div[^>]*class="[^"]*lyricsContainer[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    }
    if (!lyricsMatch) {
      lyricsMatch = trackHtml.match(/<p[^>]*class="[^"]*lyric[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
    }
    
    if (!lyricsMatch || !lyricsMatch[1]) {
      return { lyrics: null, source: 'none', error: 'Lyrics not available' };
    }
    
    const lyrics = stripHtml(lyricsMatch[1]).trim();
    
    if (!lyrics || lyrics.length < 20) {
      return { lyrics: null, source: 'none', error: 'Lyrics too short' };
    }
    
    return {
      lyrics,
      source: 'bugs',
      trackInfo: { title, artist }
    };
    
  } catch (error) {
    console.error('Bugs lyrics search error:', error);
    return { lyrics: null, source: 'none', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
```

### 4. 메인 핸들러 수정 - 4단계 폴백 체인

```typescript
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, artist } = await req.json();
    
    if (!title) {
      return new Response(
        JSON.stringify({ error: 'Title is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Scraping lyrics for:', { title, artist });
    
    // 1단계: 가사집 (CCM 전문) - PRIMARY
    let result = await scrapeGasazipLyrics(title, artist || '');
    
    // 2단계: Bugs 곡 검색
    if (!result.lyrics) {
      console.log('Gasazip failed, trying Bugs track search...');
      await new Promise(r => setTimeout(r, 200));
      result = await scrapeBugsLyrics(title, artist || '');
    }
    
    // 3단계: Bugs 가사 검색 (별도 DB)
    if (!result.lyrics) {
      console.log('Bugs track search failed, trying Bugs lyrics search...');
      await new Promise(r => setTimeout(r, 200));
      result = await scrapeBugsLyricsSearch(title, artist || '');
    }
    
    // 4단계: Melon 검색
    if (!result.lyrics) {
      console.log('Bugs lyrics search failed, trying Melon...');
      await new Promise(r => setTimeout(r, 300));
      result = await scrapeMelonLyrics(title, artist || '');
    }
    
    return new Response(
      JSON.stringify(result),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in scrape-lyrics function:', error);
    return new Response(
      JSON.stringify({ 
        lyrics: null,
        source: 'none',
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
```

---

## 검색 플로우 다이어그램

```text
┌─────────────────────────────────────────────────────────────┐
│            가사 스크래핑 4단계 폴백 체인                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  입력: "주님은 나의 최고봉" + "마커스"                       │
│                     ↓                                       │
│  ┌─────────────────────────────────────┐                   │
│  │ 1. 가사집 (gasazip.com)  [PRIMARY]  │  ← CCM 전문!      │
│  │    → /search.html?q=마커스+주님은   │                   │
│  │    → 상세 페이지 #gasa div 추출     │                   │
│  └────────────────┬────────────────────┘                   │
│                   │ 성공 → 반환                            │
│                   │ 실패 ↓                                 │
│  ┌─────────────────────────────────────┐                   │
│  │ 2. Bugs /search/track               │                   │
│  │    → 스트리밍 곡 검색               │                   │
│  └────────────────┬────────────────────┘                   │
│                   │ 실패 ↓                                 │
│  ┌─────────────────────────────────────┐                   │
│  │ 3. Bugs /search/lyrics              │  ← 별도 가사 DB   │
│  │    → 가사 데이터베이스 검색          │                   │
│  └────────────────┬────────────────────┘                   │
│                   │ 실패 ↓                                 │
│  ┌─────────────────────────────────────┐                   │
│  │ 4. Melon /search/song               │                   │
│  │    → 최종 폴백                      │                   │
│  └────────────────┬────────────────────┘                   │
│                   ↓                                         │
│  출력: { lyrics: "...", source: "gasazip|bugs|melon" }     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 기대 효과

| 지표 | Before | After |
|------|--------|-------|
| CCM 곡 가사 성공률 | ~30% | **~85%** |
| "마커스 워십" 곡 | 대부분 실패 | ✅ 가사집에서 즉시 성공 |
| "어노인팅" 곡 | 대부분 실패 | ✅ 가사집에서 즉시 성공 |
| "CCC Music" 곡 | 실패 | ✅ 가사집에서 성공 |
| 일반 가요 | 벅스/멜론 | 가사집 → 벅스 → 멜론 |
| 검색 단계 | 2단계 | 4단계 (폴백 강화) |
| 최대 응답 시간 | ~600ms | ~1000ms (최악의 경우) |

---

## 수정 대상 파일

| 파일 | 변경 내용 |
|------|----------|
| `supabase/functions/scrape-lyrics/index.ts` | 전체 리팩터링 - 4단계 폴백 체인 구현 |

---

## 검증 테스트 케이스

| 곡 | 아티스트 | 예상 소스 |
|---|---------|----------|
| 주님은 산 같아서 | 마커스 | gasazip |
| 거리마다 기쁨으로 | CCC Music | gasazip |
| 너 결코 | 어노인팅 | gasazip |
| 좋으신 하나님 | 힐송 | gasazip 또는 bugs |
| 일반 K-POP | - | bugs 또는 melon |


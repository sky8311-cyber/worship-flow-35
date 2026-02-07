import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Common headers to mimic browser requests
const browserHeaders = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
  'Accept-Encoding': 'gzip, deflate, br',
  'Connection': 'keep-alive',
};

interface ScrapeResult {
  lyrics: string | null;
  source: 'gasazip' | 'bugs' | 'melon' | 'none';
  trackInfo?: {
    title: string;
    artist: string;
  };
  error?: string;
}

// Extract text content from HTML, removing tags
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

// ============================================================
// 1. PRIMARY: Gasazip (CCM 전문 가사 사이트)
// ============================================================
async function scrapeGasazipLyrics(title: string, artist: string): Promise<ScrapeResult> {
  try {
    const searchQuery = `${artist} ${title}`.trim();
    const searchUrl = `https://www.gasazip.com/search.html?q=${encodeURIComponent(searchQuery)}`;
    
    console.log('Gasazip search URL:', searchUrl);
    
    const searchResponse = await fetch(searchUrl, { headers: browserHeaders });
    if (!searchResponse.ok) {
      console.log('Gasazip search failed:', searchResponse.status);
      return { lyrics: null, source: 'none', error: `Gasazip search failed: ${searchResponse.status}` };
    }
    
    const searchHtml = await searchResponse.text();
    
    // 검색 결과에서 첫 번째 곡 ID 추출
    // 패턴: href="https://www.gasazip.com/{id}" 또는 href="/{id}"
    const songIdMatch = searchHtml.match(/href="https:\/\/www\.gasazip\.com\/(\d+)"/i) ||
                        searchHtml.match(/href="\/(\d+)"/i) ||
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
      console.log('Gasazip detail page failed:', detailResponse.status);
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
      return { lyrics: null, source: 'none', error: 'Lyrics too short or empty' };
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

// ============================================================
// 2. FALLBACK: Bugs Music - Track Search
// ============================================================
async function scrapeBugsLyrics(title: string, artist: string): Promise<ScrapeResult> {
  try {
    const searchQuery = `${title} ${artist}`.trim();
    const searchUrl = `https://music.bugs.co.kr/search/track?q=${encodeURIComponent(searchQuery)}`;
    
    console.log('Bugs track search URL:', searchUrl);
    
    const searchResponse = await fetch(searchUrl, { headers: browserHeaders });
    if (!searchResponse.ok) {
      console.log('Bugs search failed:', searchResponse.status);
      return { lyrics: null, source: 'none', error: `Search failed: ${searchResponse.status}` };
    }
    
    const searchHtml = await searchResponse.text();
    
    // Find track ID from search results
    const trackIdMatch = searchHtml.match(/data-trackid="(\d+)"/i) || 
                         searchHtml.match(/href="\/track\/(\d+)"/i);
    
    if (!trackIdMatch) {
      console.log('No track found in Bugs search results');
      return { lyrics: null, source: 'none', error: 'No track found' };
    }
    
    const trackId = trackIdMatch[1];
    console.log('Found Bugs track ID:', trackId);
    
    // Fetch track detail page
    const trackUrl = `https://music.bugs.co.kr/track/${trackId}`;
    const trackResponse = await fetch(trackUrl, { headers: browserHeaders });
    
    if (!trackResponse.ok) {
      console.log('Bugs track page failed:', trackResponse.status);
      return { lyrics: null, source: 'none', error: `Track page failed: ${trackResponse.status}` };
    }
    
    const trackHtml = await trackResponse.text();
    
    // Extract lyrics
    let lyricsMatch = trackHtml.match(/<xmp[^>]*>([\s\S]*?)<\/xmp>/i);
    if (!lyricsMatch) {
      lyricsMatch = trackHtml.match(/<div[^>]*class="[^"]*lyricsContainer[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    }
    if (!lyricsMatch) {
      lyricsMatch = trackHtml.match(/<p[^>]*class="[^"]*lyric[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
    }
    
    if (!lyricsMatch || !lyricsMatch[1]) {
      console.log('No lyrics found on Bugs track page');
      return { lyrics: null, source: 'none', error: 'Lyrics not available' };
    }
    
    const lyrics = stripHtml(lyricsMatch[1]).trim();
    
    if (!lyrics || lyrics.length < 20) {
      return { lyrics: null, source: 'none', error: 'Lyrics too short or empty' };
    }
    
    console.log('Successfully scraped lyrics from Bugs track, length:', lyrics.length);
    
    return {
      lyrics,
      source: 'bugs',
      trackInfo: { title, artist }
    };
    
  } catch (error) {
    console.error('Bugs track scraping error:', error);
    return { lyrics: null, source: 'none', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ============================================================
// 3. FALLBACK: Bugs Music - Lyrics Search (별도 가사 DB)
// ============================================================
async function scrapeBugsLyricsSearch(title: string, artist: string): Promise<ScrapeResult> {
  try {
    const searchQuery = `${title} ${artist}`.trim();
    const searchUrl = `https://music.bugs.co.kr/search/lyrics?q=${encodeURIComponent(searchQuery)}`;
    
    console.log('Bugs lyrics search URL:', searchUrl);
    
    const searchResponse = await fetch(searchUrl, { headers: browserHeaders });
    if (!searchResponse.ok) {
      console.log('Bugs lyrics search failed:', searchResponse.status);
      return { lyrics: null, source: 'none', error: `Lyrics search failed: ${searchResponse.status}` };
    }
    
    const searchHtml = await searchResponse.text();
    
    // 가사 검색 결과에서 트랙 ID 추출
    const trackIdMatch = searchHtml.match(/data-trackid="(\d+)"/i) || 
                         searchHtml.match(/href="\/track\/(\d+)"/i);
    
    if (!trackIdMatch) {
      console.log('No track found in Bugs lyrics search results');
      return { lyrics: null, source: 'none', error: 'No track found in lyrics search' };
    }
    
    const trackId = trackIdMatch[1];
    console.log('Found Bugs track from lyrics search:', trackId);
    
    // 트랙 페이지에서 가사 추출
    const trackUrl = `https://music.bugs.co.kr/track/${trackId}`;
    const trackResponse = await fetch(trackUrl, { headers: browserHeaders });
    
    if (!trackResponse.ok) {
      console.log('Bugs track page failed:', trackResponse.status);
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
      console.log('No lyrics found on Bugs track page (from lyrics search)');
      return { lyrics: null, source: 'none', error: 'Lyrics not available' };
    }
    
    const lyrics = stripHtml(lyricsMatch[1]).trim();
    
    if (!lyrics || lyrics.length < 20) {
      return { lyrics: null, source: 'none', error: 'Lyrics too short or empty' };
    }
    
    console.log('Successfully scraped lyrics from Bugs lyrics search, length:', lyrics.length);
    
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

// ============================================================
// 4. FALLBACK: Melon
// ============================================================
async function scrapeMelonLyrics(title: string, artist: string): Promise<ScrapeResult> {
  try {
    const searchQuery = `${title} ${artist}`.trim();
    const searchUrl = `https://www.melon.com/search/song/index.htm?q=${encodeURIComponent(searchQuery)}`;
    
    console.log('Melon search URL:', searchUrl);
    
    const searchResponse = await fetch(searchUrl, { headers: browserHeaders });
    if (!searchResponse.ok) {
      console.log('Melon search failed:', searchResponse.status);
      return { lyrics: null, source: 'none', error: `Search failed: ${searchResponse.status}` };
    }
    
    const searchHtml = await searchResponse.text();
    
    // Find song ID from search results
    const songIdMatch = searchHtml.match(/goSongDetail\('(\d+)'\)/i) ||
                        searchHtml.match(/data-song-no="(\d+)"/i);
    
    if (!songIdMatch) {
      console.log('No song found in Melon search results');
      return { lyrics: null, source: 'none', error: 'No song found' };
    }
    
    const songId = songIdMatch[1];
    console.log('Found Melon song ID:', songId);
    
    // Fetch song detail page
    const detailUrl = `https://www.melon.com/song/detail.htm?songId=${songId}`;
    const detailResponse = await fetch(detailUrl, { headers: browserHeaders });
    
    if (!detailResponse.ok) {
      console.log('Melon detail page failed:', detailResponse.status);
      return { lyrics: null, source: 'none', error: `Detail page failed: ${detailResponse.status}` };
    }
    
    const detailHtml = await detailResponse.text();
    
    // Extract lyrics from Melon
    let lyricsMatch = detailHtml.match(/<div[^>]*id="d_video_summary"[^>]*>([\s\S]*?)<\/div>/i);
    if (!lyricsMatch) {
      lyricsMatch = detailHtml.match(/<div[^>]*class="[^"]*lyric[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    }
    
    if (!lyricsMatch || !lyricsMatch[1]) {
      console.log('No lyrics found on Melon detail page');
      return { lyrics: null, source: 'none', error: 'Lyrics not available' };
    }
    
    const lyrics = stripHtml(lyricsMatch[1]).trim();
    
    if (!lyrics || lyrics.length < 20) {
      return { lyrics: null, source: 'none', error: 'Lyrics too short or empty' };
    }
    
    console.log('Successfully scraped lyrics from Melon, length:', lyrics.length);
    
    return {
      lyrics,
      source: 'melon',
      trackInfo: { title, artist }
    };
    
  } catch (error) {
    console.error('Melon scraping error:', error);
    return { lyrics: null, source: 'none', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ============================================================
// Main Handler - 4-Stage Fallback Chain
// ============================================================
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
    
    // 2단계: Bugs 곡(Track) 검색
    if (!result.lyrics) {
      console.log('Gasazip failed, trying Bugs track search...');
      await new Promise(r => setTimeout(r, 200));
      result = await scrapeBugsLyrics(title, artist || '');
    }
    
    // 3단계: Bugs 가사(Lyrics) 검색 - 별도 DB
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

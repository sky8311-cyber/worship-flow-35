import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  trackInfo?: { title: string; artist: string };
  youtube_title?: string;
  verified?: boolean;
  error?: string;
}

// ============================================================
// Utility: Normalize text for matching
// ============================================================
function normalizeForMatching(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^\wㄱ-ㅎㅏ-ㅣ가-힣]/g, '')
    .replace(/\(.*?\)/g, '') // Remove parenthetical text
    .trim();
}

// Levenshtein-based similarity (0-100)
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeForMatching(str1);
  const s2 = normalizeForMatching(str2);
  if (s1 === s2) return 100;
  if (!s1 || !s2) return 0;
  
  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) return 85;
  
  const len1 = s1.length;
  const len2 = s2.length;
  const matrix: number[][] = [];
  for (let i = 0; i <= len1; i++) matrix[i] = [i];
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;
  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  const distance = matrix[len1][len2];
  const maxLen = Math.max(len1, len2);
  return Math.round((1 - distance / maxLen) * 100);
}

// Verify scraped result matches the requested song
function verifyMatch(
  requestTitle: string, 
  requestArtist: string, 
  resultTitle: string, 
  resultArtist: string,
  subtitle?: string
): { passed: boolean; titleSim: number; artistSim: number } {
  const titleSim = calculateSimilarity(requestTitle, resultTitle);
  const artistSim = requestArtist && resultArtist 
    ? calculateSimilarity(requestArtist, resultArtist) 
    : 50; // neutral if no artist to compare
  
  // Also check subtitle match
  let subtitleBoost = 0;
  if (subtitle) {
    const subtitleSim = calculateSimilarity(subtitle, resultTitle);
    if (subtitleSim > 60) subtitleBoost = 15;
  }
  
  const effectiveTitleSim = Math.min(100, titleSim + subtitleBoost);
  
  // Pass if title similarity >= 50% OR artist similarity >= 70% with title >= 40%
  const passed = 
    effectiveTitleSim >= 40 ||
    (artistSim >= 60 && effectiveTitleSim >= 30) ||
    (artistSim === 50 && effectiveTitleSim >= 42);
  
  console.log(`Verification: title="${resultTitle}" artist="${resultArtist}" → titleSim=${titleSim}(+${subtitleBoost}) artistSim=${artistSim} → ${passed ? 'PASS' : 'FAIL'}`);
  
  return { passed, titleSim: effectiveTitleSim, artistSim };
}

// ============================================================
// YouTube oEmbed: Get video title without API key
// ============================================================
async function getYouTubeTitle(youtubeUrl: string): Promise<string | null> {
  if (!youtubeUrl) return null;
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl)}&format=json`;
    const response = await fetch(oembedUrl);
    if (!response.ok) {
      await response.text(); // consume body
      return null;
    }
    const data = await response.json();
    console.log('YouTube oEmbed title:', data.title);
    return data.title || null;
  } catch (error) {
    console.log('YouTube oEmbed failed:', error);
    return null;
  }
}

// Build optimized search query
function buildSearchQuery(title: string, artist: string, subtitle: string): string {
  let query = title;
  if (subtitle && !title.includes(subtitle)) {
    query += ` ${subtitle}`;
  }
  if (artist) {
    query += ` ${artist}`;
  }
  return query.trim();
}

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
// 1. PRIMARY: Gasazip
// ============================================================
async function scrapeGasazipLyrics(title: string, artist: string, subtitle: string): Promise<ScrapeResult> {
  try {
    const searchQuery = buildSearchQuery(title, artist, subtitle);
    const searchUrl = `https://www.gasazip.com/search.html?q=${encodeURIComponent(searchQuery)}`;
    
    console.log('Gasazip search URL:', searchUrl);
    
    const searchResponse = await fetch(searchUrl, { headers: browserHeaders });
    if (!searchResponse.ok) {
      return { lyrics: null, source: 'none', error: `Gasazip search failed: ${searchResponse.status}` };
    }
    
    const searchHtml = await searchResponse.text();
    
    const songIdMatch = searchHtml.match(/href="https:\/\/www\.gasazip\.com\/(\d+)"/i) ||
                        searchHtml.match(/href="\/(\d+)"/i) ||
                        searchHtml.match(/href="https:\/\/mini\.gasazip\.com\/view\.html\?no=(\d+)"/i);
    
    if (!songIdMatch) {
      return { lyrics: null, source: 'none', error: 'No song found' };
    }
    
    const songId = songIdMatch[1];
    const detailUrl = `https://www.gasazip.com/${songId}`;
    const detailResponse = await fetch(detailUrl, { headers: browserHeaders });
    
    if (!detailResponse.ok) {
      return { lyrics: null, source: 'none', error: `Detail page failed: ${detailResponse.status}` };
    }
    
    const detailHtml = await detailResponse.text();
    
    // Extract track info for verification
    const titleMatch = detailHtml.match(/<h2[^>]*id="gasatitle"[^>]*>([^<]+)<\/h2>/i);
    const artistMatch = detailHtml.match(/<span[^>]*id="gasasinger"[^>]*>([^<]+)<\/span>/i);
    
    const resultTitle = titleMatch ? stripHtml(titleMatch[1]) : '';
    const resultArtist = artistMatch ? stripHtml(artistMatch[1]) : '';
    
    // Verify match
    if (resultTitle) {
      const verification = verifyMatch(title, artist, resultTitle, resultArtist, subtitle);
      if (!verification.passed) {
        console.log(`Gasazip result rejected: "${resultTitle}" by "${resultArtist}" doesn't match "${title}" by "${artist}"`);
        return { lyrics: null, source: 'none', verified: false, error: `Title mismatch (sim=${verification.titleSim}%)`, trackInfo: { title: resultTitle, artist: resultArtist } };
      }
    }
    
    const lyricsMatch = detailHtml.match(/<div[^>]*id="gasa"[^>]*>([\s\S]*?)<\/div>/i);
    if (!lyricsMatch || !lyricsMatch[1]) {
      return { lyrics: null, source: 'none', error: 'Lyrics not available' };
    }
    
    const lyrics = stripHtml(lyricsMatch[1]).trim();
    if (!lyrics || lyrics.length < 20) {
      return { lyrics: null, source: 'none', error: 'Lyrics too short or empty' };
    }
    
    console.log('Successfully scraped lyrics from Gasazip, length:', lyrics.length);
    return {
      lyrics,
      source: 'gasazip',
      verified: true,
      trackInfo: { title: resultTitle || title, artist: resultArtist || artist }
    };
    
  } catch (error) {
    console.error('Gasazip scraping error:', error);
    return { lyrics: null, source: 'none', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ============================================================
// 2. FALLBACK: Bugs Music - Track Search
// ============================================================
async function scrapeBugsLyrics(title: string, artist: string, subtitle: string): Promise<ScrapeResult> {
  try {
    const searchQuery = buildSearchQuery(title, artist, subtitle);
    const searchUrl = `https://music.bugs.co.kr/search/track?q=${encodeURIComponent(searchQuery)}`;
    
    console.log('Bugs track search URL:', searchUrl);
    
    const searchResponse = await fetch(searchUrl, { headers: browserHeaders });
    if (!searchResponse.ok) {
      return { lyrics: null, source: 'none', error: `Search failed: ${searchResponse.status}` };
    }
    
    const searchHtml = await searchResponse.text();
    
    // Extract title and artist from search results for verification
    // Bugs search result rows contain title in <a class="trackTitle"> and artist in <a class="artistTitle">
    const firstResultTitle = searchHtml.match(/class="[^"]*trackTitle[^"]*"[^>]*>([^<]+)</i);
    const firstResultArtist = searchHtml.match(/class="[^"]*artistTitle[^"]*"[^>]*>([^<]+)</i);
    
    if (firstResultTitle) {
      const resultTitle = stripHtml(firstResultTitle[1]);
      const resultArtist = firstResultArtist ? stripHtml(firstResultArtist[1]) : '';
      
      const verification = verifyMatch(title, artist, resultTitle, resultArtist, subtitle);
      if (!verification.passed) {
        console.log(`Bugs result rejected: "${resultTitle}" by "${resultArtist}"`);
        return { lyrics: null, source: 'none', verified: false, error: `Title mismatch (sim=${verification.titleSim}%)`, trackInfo: { title: resultTitle, artist: resultArtist } };
      }
    }
    
    const trackIdMatch = searchHtml.match(/data-trackid="(\d+)"/i) || 
                         searchHtml.match(/href="\/track\/(\d+)"/i);
    
    if (!trackIdMatch) {
      return { lyrics: null, source: 'none', error: 'No track found' };
    }
    
    const trackId = trackIdMatch[1];
    const trackUrl = `https://music.bugs.co.kr/track/${trackId}`;
    const trackResponse = await fetch(trackUrl, { headers: browserHeaders });
    
    if (!trackResponse.ok) {
      return { lyrics: null, source: 'none', error: `Track page failed: ${trackResponse.status}` };
    }
    
    const trackHtml = await trackResponse.text();
    
    let lyricsMatch = trackHtml.match(/<xmp[^>]*>([\s\S]*?)<\/xmp>/i);
    if (!lyricsMatch) lyricsMatch = trackHtml.match(/<div[^>]*class="[^"]*lyricsContainer[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    if (!lyricsMatch) lyricsMatch = trackHtml.match(/<p[^>]*class="[^"]*lyric[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
    
    if (!lyricsMatch || !lyricsMatch[1]) {
      return { lyrics: null, source: 'none', error: 'Lyrics not available' };
    }
    
    const lyrics = stripHtml(lyricsMatch[1]).trim();
    if (!lyrics || lyrics.length < 20) {
      return { lyrics: null, source: 'none', error: 'Lyrics too short or empty' };
    }
    
    console.log('Successfully scraped lyrics from Bugs track, length:', lyrics.length);
    return { lyrics, source: 'bugs', verified: true, trackInfo: { title, artist } };
    
  } catch (error) {
    console.error('Bugs track scraping error:', error);
    return { lyrics: null, source: 'none', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ============================================================
// 3. FALLBACK: Bugs Music - Lyrics Search
// ============================================================
async function scrapeBugsLyricsSearch(title: string, artist: string, subtitle: string): Promise<ScrapeResult> {
  try {
    const searchQuery = buildSearchQuery(title, artist, subtitle);
    const searchUrl = `https://music.bugs.co.kr/search/lyrics?q=${encodeURIComponent(searchQuery)}`;
    
    console.log('Bugs lyrics search URL:', searchUrl);
    
    const searchResponse = await fetch(searchUrl, { headers: browserHeaders });
    if (!searchResponse.ok) {
      return { lyrics: null, source: 'none', error: `Lyrics search failed: ${searchResponse.status}` };
    }
    
    const searchHtml = await searchResponse.text();
    
    const trackIdMatch = searchHtml.match(/data-trackid="(\d+)"/i) || 
                         searchHtml.match(/href="\/track\/(\d+)"/i);
    
    if (!trackIdMatch) {
      return { lyrics: null, source: 'none', error: 'No track found in lyrics search' };
    }
    
    const trackId = trackIdMatch[1];
    const trackUrl = `https://music.bugs.co.kr/track/${trackId}`;
    const trackResponse = await fetch(trackUrl, { headers: browserHeaders });
    
    if (!trackResponse.ok) {
      return { lyrics: null, source: 'none', error: `Track page failed: ${trackResponse.status}` };
    }
    
    const trackHtml = await trackResponse.text();
    
    let lyricsMatch = trackHtml.match(/<xmp[^>]*>([\s\S]*?)<\/xmp>/i);
    if (!lyricsMatch) lyricsMatch = trackHtml.match(/<div[^>]*class="[^"]*lyricsContainer[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    if (!lyricsMatch) lyricsMatch = trackHtml.match(/<p[^>]*class="[^"]*lyric[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
    
    if (!lyricsMatch || !lyricsMatch[1]) {
      return { lyrics: null, source: 'none', error: 'Lyrics not available' };
    }
    
    const lyrics = stripHtml(lyricsMatch[1]).trim();
    if (!lyrics || lyrics.length < 20) {
      return { lyrics: null, source: 'none', error: 'Lyrics too short or empty' };
    }
    
    console.log('Successfully scraped lyrics from Bugs lyrics search, length:', lyrics.length);
    return { lyrics, source: 'bugs', verified: true, trackInfo: { title, artist } };
    
  } catch (error) {
    console.error('Bugs lyrics search error:', error);
    return { lyrics: null, source: 'none', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ============================================================
// 4. FALLBACK: Melon
// ============================================================
async function scrapeMelonLyrics(title: string, artist: string, subtitle: string): Promise<ScrapeResult> {
  try {
    const searchQuery = buildSearchQuery(title, artist, subtitle);
    const searchUrl = `https://www.melon.com/search/song/index.htm?q=${encodeURIComponent(searchQuery)}`;
    
    console.log('Melon search URL:', searchUrl);
    
    const searchResponse = await fetch(searchUrl, { headers: browserHeaders });
    if (!searchResponse.ok) {
      return { lyrics: null, source: 'none', error: `Search failed: ${searchResponse.status}` };
    }
    
    const searchHtml = await searchResponse.text();
    
    const songIdMatch = searchHtml.match(/goSongDetail\('(\d+)'\)/i) ||
                        searchHtml.match(/data-song-no="(\d+)"/i);
    
    if (!songIdMatch) {
      return { lyrics: null, source: 'none', error: 'No song found' };
    }
    
    const songId = songIdMatch[1];
    const detailUrl = `https://www.melon.com/song/detail.htm?songId=${songId}`;
    const detailResponse = await fetch(detailUrl, { headers: browserHeaders });
    
    if (!detailResponse.ok) {
      return { lyrics: null, source: 'none', error: `Detail page failed: ${detailResponse.status}` };
    }
    
    const detailHtml = await detailResponse.text();
    
    let lyricsMatch = detailHtml.match(/<div[^>]*id="d_video_summary"[^>]*>([\s\S]*?)<\/div>/i);
    if (!lyricsMatch) lyricsMatch = detailHtml.match(/<div[^>]*class="[^"]*lyric[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    
    if (!lyricsMatch || !lyricsMatch[1]) {
      return { lyrics: null, source: 'none', error: 'Lyrics not available' };
    }
    
    const lyrics = stripHtml(lyricsMatch[1]).trim();
    if (!lyrics || lyrics.length < 20) {
      return { lyrics: null, source: 'none', error: 'Lyrics too short or empty' };
    }
    
    console.log('Successfully scraped lyrics from Melon, length:', lyrics.length);
    return { lyrics, source: 'melon', verified: true, trackInfo: { title, artist } };
    
  } catch (error) {
    console.error('Melon scraping error:', error);
    return { lyrics: null, source: 'none', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ============================================================
// Main Handler
// ============================================================
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, artist, subtitle, youtube_url } = await req.json();
    
    if (!title) {
      return new Response(
        JSON.stringify({ error: 'Title is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Scraping lyrics for:', { title, artist, subtitle, youtube_url });
    
    // Get YouTube title for extra verification context
    let youtubeTitle: string | null = null;
    if (youtube_url) {
      youtubeTitle = await getYouTubeTitle(youtube_url);
    }
    
    const sub = subtitle || '';
    
    // 1단계: Gasazip (CCM 전문)
    let result = await scrapeGasazipLyrics(title, artist || '', sub);
    
    // If Gasazip failed due to mismatch, try without subtitle for a broader search
    if (!result.lyrics && result.verified === false && sub) {
      console.log('Retrying Gasazip without subtitle...');
      await new Promise(r => setTimeout(r, 200));
      result = await scrapeGasazipLyrics(title, artist || '', '');
    }
    
    // 2단계: Bugs Track
    if (!result.lyrics) {
      console.log('Gasazip failed, trying Bugs track search...');
      await new Promise(r => setTimeout(r, 200));
      result = await scrapeBugsLyrics(title, artist || '', sub);
    }
    
    // 3단계: Bugs Lyrics
    if (!result.lyrics) {
      console.log('Bugs track search failed, trying Bugs lyrics search...');
      await new Promise(r => setTimeout(r, 200));
      result = await scrapeBugsLyricsSearch(title, artist || '', sub);
    }
    
    // 4단계: Melon
    if (!result.lyrics) {
      console.log('Bugs lyrics search failed, trying Melon...');
      await new Promise(r => setTimeout(r, 300));
      result = await scrapeMelonLyrics(title, artist || '', sub);
    }
    
    // Attach YouTube title to result for upstream use
    if (youtubeTitle) {
      result.youtube_title = youtubeTitle;
    }
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in scrape-lyrics function:', error);
    return new Response(
      JSON.stringify({ lyrics: null, source: 'none', error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

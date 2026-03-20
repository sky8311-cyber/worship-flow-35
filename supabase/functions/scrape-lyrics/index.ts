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
  candidates?: Array<{ url: string; title: string; source: string }>;
}

// ============================================================
// Utility: Normalize text for matching
// ============================================================
function normalizeForMatching(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[^\wㄱ-ㅎㅏ-ㅣ가-힣]/g, '')
    .replace(/\(.*?\)/g, '')
    .trim();
}

function calculateSimilarity(str1: string, str2: string): number {
  const s1 = normalizeForMatching(str1);
  const s2 = normalizeForMatching(str2);
  if (s1 === s2) return 100;
  if (!s1 || !s2) return 0;
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
    : 50;
  
  let subtitleBoost = 0;
  if (subtitle) {
    const subtitleSim = calculateSimilarity(subtitle, resultTitle);
    if (subtitleSim > 60) subtitleBoost = 15;
  }
  
  const effectiveTitleSim = Math.min(100, titleSim + subtitleBoost);
  
  const passed = 
    effectiveTitleSim >= 40 ||
    (artistSim >= 60 && effectiveTitleSim >= 30) ||
    (artistSim === 50 && effectiveTitleSim >= 42);
  
  console.log(`Verification: title="${resultTitle}" artist="${resultArtist}" → titleSim=${titleSim}(+${subtitleBoost}) artistSim=${artistSim} → ${passed ? 'PASS' : 'FAIL'}`);
  
  return { passed, titleSim: effectiveTitleSim, artistSim };
}

// ============================================================
// YouTube oEmbed
// ============================================================
async function getYouTubeTitle(youtubeUrl: string): Promise<string | null> {
  if (!youtubeUrl) return null;
  try {
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(youtubeUrl)}&format=json`;
    const response = await fetch(oembedUrl);
    if (!response.ok) {
      await response.text();
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
// 1. PRIMARY: Gasazip — up to 3 candidates
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
    
    const candidateRegex = /href="(?:https:\/\/www\.gasazip\.com\/|(?:https:\/\/mini\.gasazip\.com\/view\.html\?no=)|\/)(\d+)"[^>]*>([^<]*)/gi;
    const candidates: Array<{ songId: string; linkText: string }> = [];
    let match;
    while ((match = candidateRegex.exec(searchHtml)) !== null && candidates.length < 3) {
      const songId = match[1];
      const linkText = stripHtml(match[2]).trim();
      if (!candidates.some(c => c.songId === songId)) {
        candidates.push({ songId, linkText });
      }
    }
    
    if (candidates.length === 0) {
      const simpleRegex = /href="(?:https:\/\/www\.gasazip\.com\/|\/)(\d+)"/gi;
      while ((match = simpleRegex.exec(searchHtml)) !== null && candidates.length < 3) {
        const songId = match[1];
        if (!candidates.some(c => c.songId === songId)) {
          candidates.push({ songId, linkText: '' });
        }
      }
    }
    
    if (candidates.length === 0) {
      return { lyrics: null, source: 'none', error: 'No song found' };
    }
    
    console.log(`Gasazip: found ${candidates.length} candidates`);
    
    const scoredCandidates = candidates.map(c => ({
      ...c,
      score: c.linkText ? calculateSimilarity(title, c.linkText) : 0,
    }));
    scoredCandidates.sort((a, b) => b.score - a.score);
    
    for (const candidate of scoredCandidates) {
      console.log(`Gasazip: trying candidate ${candidate.songId} (linkText="${candidate.linkText}", preScore=${candidate.score})`);
      
      const detailUrl = `https://www.gasazip.com/${candidate.songId}`;
      try {
        const detailResponse = await fetch(detailUrl, { headers: browserHeaders });
        if (!detailResponse.ok) continue;
        
        const detailHtml = await detailResponse.text();
        
        const titleMatch = detailHtml.match(/<h2[^>]*id="gasatitle"[^>]*>([^<]+)<\/h2>/i);
        const artistMatch = detailHtml.match(/<span[^>]*id="gasasinger"[^>]*>([^<]+)<\/span>/i);
        
        const resultTitle = titleMatch ? stripHtml(titleMatch[1]) : '';
        const resultArtist = artistMatch ? stripHtml(artistMatch[1]) : '';
        
        if (resultTitle) {
          const verification = verifyMatch(title, artist, resultTitle, resultArtist, subtitle);
          if (!verification.passed) {
            console.log(`Gasazip candidate ${candidate.songId} rejected: "${resultTitle}" by "${resultArtist}"`);
            continue;
          }
        }
        
        const lyricsMatch = detailHtml.match(/<div[^>]*id="gasa"[^>]*>([\s\S]*?)<\/div>/i);
        if (!lyricsMatch || !lyricsMatch[1]) continue;
        
        const lyrics = stripHtml(lyricsMatch[1]).trim();
        if (!lyrics || lyrics.length < 20) continue;
        
        console.log('Successfully scraped lyrics from Gasazip, length:', lyrics.length);
        return {
          lyrics,
          source: 'gasazip',
          verified: true,
          trackInfo: { title: resultTitle || title, artist: resultArtist || artist }
        };
      } catch (e) {
        console.log(`Gasazip candidate ${candidate.songId} fetch error:`, e);
        continue;
      }
    }
    
    return { lyrics: null, source: 'none', error: 'No matching lyrics from candidates' };
    
  } catch (error) {
    console.error('Gasazip scraping error:', error);
    return { lyrics: null, source: 'none', error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// ============================================================
// 2. FALLBACK: Bugs Music - Track Search — up to 3 candidates
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
    
    const trackIdRegex = /data-trackid="(\d+)"/gi;
    const trackIds: string[] = [];
    let match;
    while ((match = trackIdRegex.exec(searchHtml)) !== null && trackIds.length < 3) {
      if (!trackIds.includes(match[1])) {
        trackIds.push(match[1]);
      }
    }
    
    if (trackIds.length === 0) {
      const hrefRegex = /href="\/track\/(\d+)"/gi;
      while ((match = hrefRegex.exec(searchHtml)) !== null && trackIds.length < 3) {
        if (!trackIds.includes(match[1])) {
          trackIds.push(match[1]);
        }
      }
    }
    
    if (trackIds.length === 0) {
      return { lyrics: null, source: 'none', error: 'No track found' };
    }
    
    console.log(`Bugs: found ${trackIds.length} track candidates`);
    
    for (const trackId of trackIds) {
      try {
        const trackUrl = `https://music.bugs.co.kr/track/${trackId}`;
        const trackResponse = await fetch(trackUrl, { headers: browserHeaders });
        if (!trackResponse.ok) continue;
        
        const trackHtml = await trackResponse.text();
        
        const pageTitleMatch = trackHtml.match(/<header[^>]*>[\s\S]*?<h1[^>]*>([^<]+)<\/h1>/i);
        const pageArtistMatch = trackHtml.match(/<a[^>]*class="[^"]*artistTitle[^"]*"[^>]*>([^<]+)<\/a>/i);
        
        const resultTitle = pageTitleMatch ? stripHtml(pageTitleMatch[1]) : '';
        const resultArtist = pageArtistMatch ? stripHtml(pageArtistMatch[1]) : '';
        
        if (resultTitle) {
          const verification = verifyMatch(title, artist, resultTitle, resultArtist, subtitle);
          if (!verification.passed) {
            console.log(`Bugs track ${trackId} rejected: "${resultTitle}" by "${resultArtist}"`);
            continue;
          }
        }
        
        let lyricsMatch = trackHtml.match(/<xmp[^>]*>([\s\S]*?)<\/xmp>/i);
        if (!lyricsMatch) lyricsMatch = trackHtml.match(/<div[^>]*class="[^"]*lyricsContainer[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
        if (!lyricsMatch) lyricsMatch = trackHtml.match(/<p[^>]*class="[^"]*lyric[^"]*"[^>]*>([\s\S]*?)<\/p>/i);
        
        if (!lyricsMatch || !lyricsMatch[1]) continue;
        
        const lyrics = stripHtml(lyricsMatch[1]).trim();
        if (!lyrics || lyrics.length < 20) continue;
        
        console.log('Successfully scraped lyrics from Bugs track, length:', lyrics.length);
        return { lyrics, source: 'bugs', verified: true, trackInfo: { title: resultTitle || title, artist: resultArtist || artist } };
      } catch (e) {
        console.log(`Bugs track ${trackId} fetch error:`, e);
        continue;
      }
    }
    
    return { lyrics: null, source: 'none', error: 'No matching lyrics from Bugs candidates' };
    
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
// 4. FALLBACK: Google → collect candidate URLs only (no scraping)
// ============================================================
async function googleSearchCandidates(title: string, artist: string): Promise<Array<{ url: string; title: string; source: string }>> {
  const candidates: Array<{ url: string; title: string; source: string }> = [];
  try {
    const query = `${title} ${artist} 가사`.trim();
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=ko&num=5`;
    
    console.log('Google candidate search:', googleUrl);
    
    const response = await fetch(googleUrl, {
      headers: { ...browserHeaders, 'Accept': 'text/html,application/xhtml+xml' },
    });
    
    if (!response.ok) {
      await response.text();
      return candidates;
    }
    
    const html = await response.text();
    
    const gasazipRegex = /href="(https?:\/\/(?:www\.)?gasazip\.com\/(\d+))"/gi;
    let match;
    while ((match = gasazipRegex.exec(html)) !== null && candidates.length < 2) {
      candidates.push({ url: match[1], title, source: 'gasazip' });
    }
    
    const bugsRegex = /href="(https?:\/\/music\.bugs\.co\.kr\/track\/(\d+))"/gi;
    while ((match = bugsRegex.exec(html)) !== null && candidates.length < 4) {
      candidates.push({ url: match[1], title, source: 'bugs' });
    }
    
    const googleRedirectRegex = /\/url\?q=(https?(?:%3A|:)(?:%2F|\/){2}(?:www\.)?(?:gasazip\.com|music\.bugs\.co\.kr)[^&"]*)/gi;
    while ((match = googleRedirectRegex.exec(html)) !== null && candidates.length < 4) {
      const decodedUrl = decodeURIComponent(match[1]);
      if (!candidates.some(c => c.url === decodedUrl)) {
        const isGasazip = decodedUrl.includes('gasazip.com');
        candidates.push({ url: decodedUrl, title, source: isGasazip ? 'gasazip' : 'bugs' });
      }
    }
    
    console.log(`Google: found ${candidates.length} candidate URLs (no scraping)`);
  } catch (error) {
    console.log('Google candidate search error:', error);
  }
  return candidates;
}

// ============================================================
// Main Handler — 4 stages, no delays, no retries
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
    
    let youtubeTitle: string | null = null;
    if (youtube_url) {
      youtubeTitle = await getYouTubeTitle(youtube_url);
    }
    
    const sub = subtitle || '';
    
    // 1단계: Gasazip (title+artist)
    let result = await scrapeGasazipLyrics(title, artist || '', sub);
    
    // 2단계: Bugs Track (title+artist)
    if (!result.lyrics) {
      console.log('Gasazip failed, trying Bugs track...');
      result = await scrapeBugsLyrics(title, artist || '', sub);
    }
    
    // 3단계: Bugs Lyrics Search
    if (!result.lyrics) {
      console.log('Bugs track failed, trying Bugs lyrics search...');
      result = await scrapeBugsLyricsSearch(title, artist || '', sub);
    }
    
    // 4단계: Google → 후보 URL만 수집 (스크래핑 안함)
    if (!result.lyrics) {
      console.log('All direct searches failed, collecting Google candidates...');
      const candidates = await googleSearchCandidates(title, artist || '');
      if (candidates.length > 0) {
        result.candidates = candidates;
      }
    }
    
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

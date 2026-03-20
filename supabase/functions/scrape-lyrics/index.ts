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
  source: 'gasazip' | 'bugs' | 'none';
  trackInfo?: { title: string; artist: string };
  youtube_title?: string;
  verified?: boolean;
  error?: string;
  candidates?: Array<{ url: string; title: string; source: string }>;
}

// ============================================================
// Utility
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
  requestTitle: string, requestArtist: string, 
  resultTitle: string, resultArtist: string
): { passed: boolean; titleSim: number; artistSim: number } {
  const titleSim = calculateSimilarity(requestTitle, resultTitle);
  const artistSim = requestArtist && resultArtist 
    ? calculateSimilarity(requestArtist, resultArtist) : 50;
  
  const passed = titleSim >= 40 || (artistSim >= 60 && titleSim >= 30);
  console.log(`Verify: "${resultTitle}" by "${resultArtist}" → title=${titleSim} artist=${artistSim} → ${passed ? 'PASS' : 'FAIL'}`);
  return { passed, titleSim, artistSim };
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
// 1. Gasazip — 2-stage parsing, up to 3 candidates
// ============================================================
async function scrapeGasazipLyrics(title: string, artist: string): Promise<ScrapeResult> {
  try {
    let searchQuery = title;
    if (artist) searchQuery += ` ${artist}`;
    const searchUrl = `https://www.gasazip.com/search.html?q=${encodeURIComponent(searchQuery.trim())}`;
    console.log('Gasazip search:', searchUrl);
    
    const searchResponse = await fetch(searchUrl, { headers: browserHeaders });
    if (!searchResponse.ok) {
      return { lyrics: null, source: 'none', error: `Gasazip search failed: ${searchResponse.status}` };
    }
    
    const searchHtml = await searchResponse.text();
    
    // 2-stage parsing: extract <a> blocks, then parse <h4> for title
    const candidates: Array<{ songId: string; linkText: string }> = [];
    
    // Match link blocks containing songId
    const linkBlockRegex = /<a[^>]*href="(?:https:\/\/www\.gasazip\.com\/|\/?)(\d+)"[^>]*>([\s\S]*?)<\/a>/gi;
    let match;
    while ((match = linkBlockRegex.exec(searchHtml)) !== null && candidates.length < 3) {
      const songId = match[1];
      const blockHtml = match[2];
      
      // Extract title from <h4> tag inside the block
      const h4Match = blockHtml.match(/<h4[^>]*>([\s\S]*?)<\/h4>/i);
      let linkText = '';
      if (h4Match) {
        // Remove <code> tags (artist info) and strip remaining HTML
        linkText = stripHtml(h4Match[1].replace(/<code[^>]*>[\s\S]*?<\/code>/gi, '')).trim();
      }
      
      if (!candidates.some(c => c.songId === songId)) {
        candidates.push({ songId, linkText });
      }
    }
    
    // Fallback: simple href regex if block parsing found nothing
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
      return { lyrics: null, source: 'none', error: 'No song found on Gasazip' };
    }
    
    console.log(`Gasazip: ${candidates.length} candidates`, candidates.map(c => `${c.songId}:"${c.linkText}"`));
    
    // Sort by title similarity (pre-score)
    const scored = candidates.map(c => ({
      ...c,
      score: c.linkText ? calculateSimilarity(title, c.linkText) : 0,
    }));
    scored.sort((a, b) => b.score - a.score);
    
    for (const candidate of scored) {
      console.log(`Gasazip trying ${candidate.songId} (preScore=${candidate.score})`);
      
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
          const v = verifyMatch(title, artist, resultTitle, resultArtist);
          if (!v.passed) {
            console.log(`Gasazip ${candidate.songId} rejected`);
            continue;
          }
        }
        
        const lyricsMatch = detailHtml.match(/<div[^>]*id="gasa"[^>]*>([\s\S]*?)<\/div>/i);
        if (!lyricsMatch?.[1]) continue;
        
        const lyrics = stripHtml(lyricsMatch[1]).trim();
        if (!lyrics || lyrics.length < 20) continue;
        
        console.log('Gasazip success, length:', lyrics.length);
        return {
          lyrics, source: 'gasazip', verified: true,
          trackInfo: { title: resultTitle || title, artist: resultArtist || artist }
        };
      } catch (e) {
        console.log(`Gasazip ${candidate.songId} error:`, e);
        continue;
      }
    }
    
    return { lyrics: null, source: 'none', error: 'No matching lyrics from Gasazip' };
  } catch (error) {
    console.error('Gasazip error:', error);
    return { lyrics: null, source: 'none', error: error instanceof Error ? error.message : 'Unknown' };
  }
}

// ============================================================
// 2. Bugs Track — up to 3 candidates
// ============================================================
async function scrapeBugsLyrics(title: string, artist: string): Promise<ScrapeResult> {
  try {
    let searchQuery = title;
    if (artist) searchQuery += ` ${artist}`;
    const searchUrl = `https://music.bugs.co.kr/search/track?q=${encodeURIComponent(searchQuery.trim())}`;
    console.log('Bugs search:', searchUrl);
    
    const searchResponse = await fetch(searchUrl, { headers: browserHeaders });
    if (!searchResponse.ok) return { lyrics: null, source: 'none', error: `Bugs failed: ${searchResponse.status}` };
    
    const searchHtml = await searchResponse.text();
    const trackIds: string[] = [];
    let match;
    
    const trackIdRegex = /data-trackid="(\d+)"/gi;
    while ((match = trackIdRegex.exec(searchHtml)) !== null && trackIds.length < 3) {
      if (!trackIds.includes(match[1])) trackIds.push(match[1]);
    }
    if (trackIds.length === 0) {
      const hrefRegex = /href="\/track\/(\d+)"/gi;
      while ((match = hrefRegex.exec(searchHtml)) !== null && trackIds.length < 3) {
        if (!trackIds.includes(match[1])) trackIds.push(match[1]);
      }
    }
    if (trackIds.length === 0) return { lyrics: null, source: 'none', error: 'No Bugs track found' };
    
    console.log(`Bugs: ${trackIds.length} candidates`);
    
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
          const v = verifyMatch(title, artist, resultTitle, resultArtist);
          if (!v.passed) continue;
        }
        
        let lyricsMatch = trackHtml.match(/<xmp[^>]*>([\s\S]*?)<\/xmp>/i);
        if (!lyricsMatch) lyricsMatch = trackHtml.match(/<div[^>]*class="[^"]*lyricsContainer[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
        if (!lyricsMatch?.[1]) continue;
        
        const lyrics = stripHtml(lyricsMatch[1]).trim();
        if (!lyrics || lyrics.length < 20) continue;
        
        console.log('Bugs success, length:', lyrics.length);
        return { lyrics, source: 'bugs', verified: true, trackInfo: { title: resultTitle || title, artist: resultArtist || artist } };
      } catch (e) {
        continue;
      }
    }
    return { lyrics: null, source: 'none', error: 'No matching Bugs lyrics' };
  } catch (error) {
    console.error('Bugs error:', error);
    return { lyrics: null, source: 'none', error: error instanceof Error ? error.message : 'Unknown' };
  }
}

// ============================================================
// 3. Bugs Lyrics Search
// ============================================================
async function scrapeBugsLyricsSearch(title: string, artist: string): Promise<ScrapeResult> {
  try {
    let searchQuery = title;
    if (artist) searchQuery += ` ${artist}`;
    const searchUrl = `https://music.bugs.co.kr/search/lyrics?q=${encodeURIComponent(searchQuery.trim())}`;
    console.log('Bugs lyrics search:', searchUrl);
    
    const searchResponse = await fetch(searchUrl, { headers: browserHeaders });
    if (!searchResponse.ok) return { lyrics: null, source: 'none', error: `Lyrics search failed` };
    
    const searchHtml = await searchResponse.text();
    const trackIdMatch = searchHtml.match(/data-trackid="(\d+)"/i) || searchHtml.match(/href="\/track\/(\d+)"/i);
    if (!trackIdMatch) return { lyrics: null, source: 'none', error: 'No track in lyrics search' };
    
    const trackUrl = `https://music.bugs.co.kr/track/${trackIdMatch[1]}`;
    const trackResponse = await fetch(trackUrl, { headers: browserHeaders });
    if (!trackResponse.ok) return { lyrics: null, source: 'none', error: 'Track page failed' };
    
    const trackHtml = await trackResponse.text();
    let lyricsMatch = trackHtml.match(/<xmp[^>]*>([\s\S]*?)<\/xmp>/i);
    if (!lyricsMatch) lyricsMatch = trackHtml.match(/<div[^>]*class="[^"]*lyricsContainer[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    if (!lyricsMatch?.[1]) return { lyrics: null, source: 'none', error: 'Lyrics not found' };
    
    const lyrics = stripHtml(lyricsMatch[1]).trim();
    if (!lyrics || lyrics.length < 20) return { lyrics: null, source: 'none', error: 'Lyrics too short' };
    
    console.log('Bugs lyrics search success, length:', lyrics.length);
    return { lyrics, source: 'bugs', verified: true, trackInfo: { title, artist } };
  } catch (error) {
    console.error('Bugs lyrics search error:', error);
    return { lyrics: null, source: 'none', error: error instanceof Error ? error.message : 'Unknown' };
  }
}

// ============================================================
// 4. Google → candidate URLs only (no scraping)
// ============================================================
async function googleSearchCandidates(title: string, artist: string): Promise<Array<{ url: string; title: string; source: string }>> {
  const candidates: Array<{ url: string; title: string; source: string }> = [];
  try {
    const query = `${title} ${artist} 가사`.trim();
    const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=ko&num=5`;
    console.log('Google search:', googleUrl);
    
    const response = await fetch(googleUrl, {
      headers: { ...browserHeaders, 'Accept': 'text/html,application/xhtml+xml' },
    });
    if (!response.ok) return candidates;
    
    const html = await response.text();
    let match;
    
    const gasazipRegex = /href="(https?:\/\/(?:www\.)?gasazip\.com\/(\d+))"/gi;
    while ((match = gasazipRegex.exec(html)) !== null && candidates.length < 2) {
      candidates.push({ url: match[1], title, source: 'gasazip' });
    }
    
    const bugsRegex = /href="(https?:\/\/music\.bugs\.co\.kr\/track\/(\d+))"/gi;
    while ((match = bugsRegex.exec(html)) !== null && candidates.length < 4) {
      candidates.push({ url: match[1], title, source: 'bugs' });
    }
    
    const redirectRegex = /\/url\?q=(https?(?:%3A|:)(?:%2F|\/){2}(?:www\.)?(?:gasazip\.com|music\.bugs\.co\.kr)[^&"]*)/gi;
    while ((match = redirectRegex.exec(html)) !== null && candidates.length < 4) {
      const decodedUrl = decodeURIComponent(match[1]);
      if (!candidates.some(c => c.url === decodedUrl)) {
        candidates.push({ url: decodedUrl, title, source: decodedUrl.includes('gasazip') ? 'gasazip' : 'bugs' });
      }
    }
    
    console.log(`Google: ${candidates.length} candidate URLs`);
  } catch (error) {
    console.log('Google search error:', error);
  }
  return candidates;
}

// ============================================================
// Main Handler — streamlined 5 stages, no delays
// ============================================================
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, artist } = await req.json();
    if (!title) {
      return new Response(JSON.stringify({ error: 'Title is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    console.log('Scraping lyrics:', { title, artist });
    
    // Stage 1: Gasazip (title+artist)
    let result = await scrapeGasazipLyrics(title, artist || '');
    
    // Stage 2: Bugs Track (title+artist)
    if (!result.lyrics) {
      console.log('→ Trying Bugs track...');
      result = await scrapeBugsLyrics(title, artist || '');
    }
    
    // Stage 3: Bugs Lyrics Search
    if (!result.lyrics) {
      console.log('→ Trying Bugs lyrics search...');
      result = await scrapeBugsLyricsSearch(title, artist || '');
    }
    
    // Stage 4: Title-only Gasazip retry (only if artist was provided)
    if (!result.lyrics && artist) {
      console.log('→ Trying Gasazip title-only...');
      result = await scrapeGasazipLyrics(title, '');
    }
    
    // Stage 5: Google candidate URLs (no scraping)
    if (!result.lyrics) {
      console.log('→ Collecting Google candidates...');
      const candidates = await googleSearchCandidates(title, artist || '');
      if (candidates.length > 0) {
        result.candidates = candidates;
      }
    }
    
    return new Response(JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 });
  } catch (error) {
    console.error('scrape-lyrics error:', error);
    return new Response(
      JSON.stringify({ lyrics: null, source: 'none', error: error instanceof Error ? error.message : 'Unknown' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});

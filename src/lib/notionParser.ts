export interface ParsedNotionSet {
  serviceName: string;
  date: string;
  area?: string;
  songs: ParsedSong[];
  fileName: string;
  songsList?: string[]; // Expected songs from metadata
}

export interface ParsedSong {
  title: string;
  key?: string;
  languages?: string[];
  youtubeUrl?: string;
  scoreImageRef?: string;
  position: number;
}

/**
 * Normalize filename to handle URL encoding
 * Handles both single and double URL encoding for Korean characters
 */
export function normalizeFilename(filename: string): string {
  let decoded = filename;
  
  // Try decoding twice (handles double-encoded Korean filenames)
  try {
    decoded = decodeURIComponent(filename);
    // Try decoding again if still has % encoding
    if (decoded.includes('%')) {
      decoded = decodeURIComponent(decoded);
    }
  } catch (e) {
    // If decoding fails, use original
    decoded = filename;
  }
  
  // Normalize whitespace
  decoded = decoded.replace(/\s+/g, ' ').trim();
  
  return decoded;
}

/**
 * Match an image file by comparing normalized filenames
 */
export function matchImageFile(
  imageRef: string,
  imageFiles: File[]
): File | undefined {
  const normalizedRef = normalizeFilename(imageRef).toLowerCase();
  
  return imageFiles.find(file => {
    const normalizedFileName = normalizeFilename(file.name).toLowerCase();
    
    // Exact match
    if (normalizedFileName === normalizedRef) {
      return true;
    }
    
    // Match without path prefix (e.g., "folder/image.png" -> "image.png")
    const refBasename = normalizedRef.split('/').pop() || normalizedRef;
    const fileBasename = normalizedFileName.split('/').pop() || normalizedFileName;
    
    return fileBasename === refBasename;
  });
}

/**
 * Parse Notion markdown export into structured worship set data
 */
export function parseNotionMarkdown(
  mdContent: string,
  fileName: string
): ParsedNotionSet | null {
  try {
    const lines = mdContent.split('\n').map(line => line.trim());
    
    // Extract H1 title (first non-empty line starting with #)
    let titleLine = lines.find(line => line.startsWith('#'));
    const titleMatch = titleLine?.match(/^#+\s+(.+)$/);
    const serviceName = titleMatch?.[1] || fileName.replace('.md', '').replace(/_/g, ' ');
    
    // Extract metadata (Date, Area)
    const metadata = extractMetadata(lines);
    
    // Find where songs start (after metadata section)
    const contentStartIndex = lines.findIndex((line, idx) => {
      // Look for first line that looks like a song title after metadata
      return idx > 5 && (
        /^[가-힣a-zA-Z\s]+\s*\([A-G]#?\)/.test(line) ||
        /^[가-힣a-zA-Z\s]+$/.test(line) && line.length > 0 && !line.startsWith('-') && !line.startsWith('*')
      );
    });
    
    // Parse songs
    const songs = parseSongs(lines.slice(contentStartIndex >= 0 ? contentStartIndex : 7));
    
    // Validate song count matches metadata
    if (metadata.songsList && metadata.songsList.length !== songs.length) {
      console.warn(`⚠️ Song count mismatch in "${serviceName}":`);
      console.warn(`  Expected (from Songs field): ${metadata.songsList.length} songs`);
      console.warn(`  Found: ${songs.length} songs`);
      console.warn(`  Expected songs: ${metadata.songsList.join(', ')}`);
      console.warn(`  Found songs: ${songs.map(s => s.title).join(', ')}`);
    }
    
    return {
      serviceName,
      date: metadata.date || new Date().toISOString().split('T')[0],
      area: metadata.area,
      songs,
      fileName,
      songsList: metadata.songsList,
    };
  } catch (error) {
    console.error('Failed to parse markdown:', error);
    return null;
  }
}

function extractMetadata(lines: string[]): { date?: string; area?: string; songsList?: string[] } {
  const metadata: { date?: string; area?: string; songsList?: string[] } = {};
  
  for (const line of lines) {
    if (line.startsWith('Date:') || line.startsWith('날짜:')) {
      const dateStr = line.replace(/^(Date:|날짜:)/, '').trim();
      metadata.date = parseDate(dateStr);
    }
    if (line.startsWith('Area:') || line.startsWith('분야:')) {
      metadata.area = line.replace(/^(Area:|분야:)/, '').trim().replace('@', '');
    }
    // Extract Songs list
    if (line.startsWith('Songs:') || line.startsWith('노래:')) {
      const songsStr = line.replace(/^(Songs:|노래:)/, '').trim();
      metadata.songsList = songsStr.split(',').map(s => s.trim()).filter(s => s.length > 0);
    }
  }
  
  return metadata;
}

function parseSongs(lines: string[]): ParsedSong[] {
  const songs: ParsedSong[] = [];
  let currentSong: Partial<ParsedSong> | null = null;
  let position = 0;
  
  // Section headers to ignore (case-insensitive)
  const sectionHeaders = new Set([
    '기도찬양', '결단찬양', '찬양', '찬송', '경배와 찬양', '특송',
    'worship', 'praise', 'praise & worship', 'praise and worship'
  ]);
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    if (!line) continue;
    
    // Strip markdown bold early
    line = line.replace(/\*\*/g, '');
    
    // Try to match song patterns
    let songTitle: string | null = null;
    let songKey: string | undefined = undefined;
    
    // Pattern 0: Section header with colon-separated song
    // Format: "결단찬양 : 아무것도 두려워말라 (Bb)" or "결단찬양 아무것도 두려워말라 (Bb)"
    const sectionWithSong = line.match(/^(기도찬양|결단찬양|특송|찬양|경배와찬양|Praise & Worship|Praise and Worship|Worship)\s*[:：]?\s*(.+?)\s*\(([A-G]#?b?)\)$/i);
    if (sectionWithSong) {
      songTitle = sectionWithSong[2].trim();
      songKey = sectionWithSong[3];
      console.log(`✅ Found song after section header: "${songTitle}" (Key: ${songKey})`);
    }
    
    // Check if this is a standalone section header to skip
    if (!songTitle) {
      const cleanLine = line.trim().toLowerCase();
      if (sectionHeaders.has(cleanLine)) {
        console.log(`⏭️ Skipping section header: ${line}`);
        continue;
      }
    }
    
    // Pattern 1: Numbered song with key in parentheses (1. 왕되신 주께 (G))
    if (!songTitle) {
      const numberedWithParenKey = line.match(/^\d+\.\s*(.+?)\s*\(([A-G]#?b?)\)\s*$/);
      if (numberedWithParenKey) {
        songTitle = numberedWithParenKey[1].trim();
        songKey = numberedWithParenKey[2];
      }
    }
    
    // Pattern 2: Numbered song with space-separated key (1. 오늘 이곳에 계신 성령님 F)
    if (!songTitle) {
      const numberedWithSpaceKey = line.match(/^\d+\.\s*(.+?)\s+([A-G]#?b?)$/);
      if (numberedWithSpaceKey) {
        songTitle = numberedWithSpaceKey[1].trim();
        songKey = numberedWithSpaceKey[2];
      }
    }
    
    // Pattern 3: Numbered song without key (1. 오늘 이곳에 계신 성령님)
    if (!songTitle) {
      const numberedNoKey = line.match(/^\d+\.\s*(.+)$/);
      if (numberedNoKey && numberedNoKey[1].length > 2) {
        songTitle = numberedNoKey[1].trim();
      }
    }
    
    // Pattern 4: Song with parentheses key (왕되신 주께 (G))
    if (!songTitle) {
      const withParenKey = line.match(/^(.+?)\s*\(([A-G]#?b?)\)$/);
      if (withParenKey && !line.startsWith('!') && !line.startsWith('[')) {
        songTitle = withParenKey[1].trim();
        songKey = withParenKey[2];
      }
    }
    
    // Pattern 5: Song with space-separated key (왕되신 주께 G)
    if (!songTitle) {
      const withSpaceKey = line.match(/^(.+?)\s+([A-G]#?b?)$/);
      if (withSpaceKey && 
          !line.startsWith('-') && 
          !line.startsWith('*') &&
          !line.startsWith('[') &&
          !line.startsWith('!') &&
          !line.includes('http')) {
        const possibleTitle = withSpaceKey[1].trim();
        const possibleKey = withSpaceKey[2];
        
        // Validate it's actually a musical key
        if (/^[A-G]#?b?$/.test(possibleKey) && possibleTitle.length > 2) {
          songTitle = possibleTitle;
          songKey = possibleKey;
        }
      }
    }
    
    // Pattern 6: Title only (no key, no number)
    if (!songTitle) {
      const titleOnly = !line.startsWith('-') && 
                        !line.startsWith('*') &&
                        !line.startsWith('[') &&
                        !line.startsWith('!') &&
                        !line.includes('http') &&
                        /^[가-힣a-zA-Z\s\u3000]+$/.test(line.replace(/\*\*/g, ''));
      
      if (titleOnly && line.length > 2) {
        songTitle = line.trim();
      }
    }
    
    // If we found a song title, save previous and start new
    if (songTitle) {
      // Bold already stripped, just trim
      songTitle = songTitle.trim();
      
      // Save previous song if exists
      if (currentSong?.title) {
        songs.push(currentSong as ParsedSong);
      }
      
      currentSong = {
        title: songTitle,
        key: songKey,
        position: position++,
      };
      
      console.log(`✅ Found song: "${songTitle}"${songKey ? ` (Key: ${songKey})` : ''}`);
      continue;
    }
    
    // If we're inside a song, parse metadata
    if (currentSong) {
      // Languages (bullet list)
      if (line.startsWith('-') || line.startsWith('*')) {
        const lang = line.replace(/^[-*]\s*/, '').trim();
        if (lang && !lang.includes('http')) {
          currentSong.languages = currentSong.languages || [];
          currentSong.languages.push(lang);
        }
      }
      
      // YouTube URL (markdown link or plain URL)
      if (line.includes('youtu.be') || line.includes('youtube.com')) {
        const urlMatch = line.match(/https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
        if (urlMatch) {
          currentSong.youtubeUrl = urlMatch[0];
          console.log(`  📺 YouTube: ${urlMatch[0]}`);
        }
      }
      
      // Score image reference: ![...](filename)
      if (line.startsWith('![')) {
        const imgMatch = line.match(/!\[.*?\]\(([^)]+)\)/);
        if (imgMatch) {
          currentSong.scoreImageRef = normalizeFilename(imgMatch[1]);
          console.log(`  🖼️ Image: ${imgMatch[1]}`);
        }
      }
    }
  }
  
  // Don't forget the last song
  if (currentSong?.title) {
    songs.push(currentSong as ParsedSong);
  }
  
  return songs;
}

function parseDate(dateStr: string): string {
  try {
    // Handle various date formats
    // "October 12, 2025", "2025-10-12", "10/12/2025", "2025.10.12"
    const date = new Date(dateStr);
    
    if (isNaN(date.getTime())) {
      // If parsing fails, return today's date
      return new Date().toISOString().split('T')[0];
    }
    
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  } catch {
    return new Date().toISOString().split('T')[0];
  }
}

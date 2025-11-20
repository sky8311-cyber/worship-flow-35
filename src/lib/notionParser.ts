export interface ParsedNotionSet {
  serviceName: string;
  date: string;
  area?: string;
  songs: ParsedSong[];
  fileName: string;
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
    
    return {
      serviceName,
      date: metadata.date || new Date().toISOString().split('T')[0],
      area: metadata.area,
      songs,
      fileName,
    };
  } catch (error) {
    console.error('Failed to parse markdown:', error);
    return null;
  }
}

function extractMetadata(lines: string[]): { date?: string; area?: string } {
  const metadata: { date?: string; area?: string } = {};
  
  for (const line of lines) {
    if (line.startsWith('Date:') || line.startsWith('날짜:')) {
      const dateStr = line.replace(/^(Date:|날짜:)/, '').trim();
      metadata.date = parseDate(dateStr);
    }
    if (line.startsWith('Area:') || line.startsWith('분야:')) {
      metadata.area = line.replace(/^(Area:|분야:)/, '').trim().replace('@', '');
    }
  }
  
  return metadata;
}

function parseSongs(lines: string[]): ParsedSong[] {
  const songs: ParsedSong[] = [];
  let currentSong: Partial<ParsedSong> | null = null;
  let position = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    if (!line) continue;
    
    // Detect song title with key: "왕되신 주께 감사하며 (G)"
    const songWithKeyMatch = line.match(/^(.+?)\s*\(([A-G]#?b?)\)\s*$/);
    
    // Detect song title without key (but not a bullet or link line)
    const titleOnlyMatch = !line.startsWith('-') && 
                          !line.startsWith('*') &&
                          !line.startsWith('[') &&
                          !line.startsWith('!') &&
                          !line.includes('http') &&
                          /^[가-힣a-zA-Z\s\u3000]+$/.test(line);
    
    if (songWithKeyMatch) {
      // Save previous song if exists
      if (currentSong?.title) {
        songs.push(currentSong as ParsedSong);
      }
      
      currentSong = {
        title: songWithKeyMatch[1].trim(),
        key: songWithKeyMatch[2],
        position: position++,
      };
    } else if (titleOnlyMatch && line.length > 2) {
      // Save previous song if exists
      if (currentSong?.title) {
        songs.push(currentSong as ParsedSong);
      }
      
      currentSong = {
        title: line.trim(),
        position: position++,
      };
    } else if (currentSong) {
      // Parse metadata for current song
      
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
        }
      }
      
      // Score image reference: ![...](filename)
      if (line.startsWith('![')) {
        const imgMatch = line.match(/!\[.*?\]\(([^)]+)\)/);
        if (imgMatch) {
          currentSong.scoreImageRef = normalizeFilename(imgMatch[1]);
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

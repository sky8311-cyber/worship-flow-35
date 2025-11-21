import { levenshteinDistance, calculateSimilarity, normalizeForMatching } from "./levenshtein";
import { supabase } from "@/integrations/supabase/client";

export type MatchType = 'EXACT_URL_MATCH' | 'EXACT_METADATA_MATCH' | 'HIGH_SIMILARITY' | 'MEDIUM_SIMILARITY';

export interface DuplicateGroup {
  id: string;
  songs: any[];
  confidence: number;
  matchType: MatchType;
  matchReasons: string[];
}

export interface MergeDecision {
  groupId: string;
  masterSongId: string;
  duplicateIds: string[];
  action: 'merge' | 'skip';
}

const normalizeYoutubeUrl = (url: string | null): string | null => {
  if (!url) return null;
  
  try {
    // Extract video ID from various YouTube URL formats
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\?\/]+)/,
      /^([a-zA-Z0-9_-]{11})$/ // Direct video ID
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }
    
    return url.toLowerCase().trim();
  } catch {
    return url.toLowerCase().trim();
  }
};

const calculateMasterScore = (song: any, usageCount: number): number => {
  let score = 0;
  
  // Metadata completeness (40 points)
  if (song.youtube_url) score += 10;
  if (song.score_file_url) score += 10;
  if (song.artist) score += 5;
  if (song.tags) score += 5;
  if (song.category) score += 5;
  if (song.interpretation) score += 5;
  
  // Usage frequency (30 points - capped at 30)
  score += Math.min(usageCount * 3, 30);
  
  // Recency (20 points)
  const daysSinceUpdate = (Date.now() - new Date(song.updated_at).getTime()) / (1000 * 60 * 60 * 24);
  if (daysSinceUpdate < 30) score += 20;
  else if (daysSinceUpdate < 90) score += 10;
  else if (daysSinceUpdate < 180) score += 5;
  
  // Title length (10 points - longer titles often have more detail)
  if (song.title.length > 20) score += 10;
  else if (song.title.length > 10) score += 5;
  
  return score;
};

export const findDuplicates = async (songs: any[]): Promise<DuplicateGroup[]> => {
  const groups: DuplicateGroup[] = [];
  const processed = new Set<string>();
  
  // Fetch usage counts for all songs
  const songIds = songs.map(s => s.id);
  const { data: usageData } = await supabase
    .from("set_songs")
    .select("song_id")
    .in("song_id", songIds);
  
  const usageCounts = new Map<string, number>();
  usageData?.forEach(row => {
    usageCounts.set(row.song_id, (usageCounts.get(row.song_id) || 0) + 1);
  });

  // Build YouTube URL index
  const youtubeIndex = new Map<string, any[]>();
  songs.forEach(song => {
    const normalizedUrl = normalizeYoutubeUrl(song.youtube_url);
    if (normalizedUrl) {
      if (!youtubeIndex.has(normalizedUrl)) {
        youtubeIndex.set(normalizedUrl, []);
      }
      youtubeIndex.get(normalizedUrl)!.push(song);
    }
  });

  // Phase 1: Find YouTube URL duplicates
  youtubeIndex.forEach((duplicateSongs, url) => {
    if (duplicateSongs.length > 1) {
      const unprocessed = duplicateSongs.filter(s => !processed.has(s.id));
      if (unprocessed.length > 1) {
        // Calculate master song
        const scores = unprocessed.map(s => ({
          song: s,
          score: calculateMasterScore(s, usageCounts.get(s.id) || 0)
        }));
        scores.sort((a, b) => b.score - a.score);
        
        groups.push({
          id: `youtube-${unprocessed[0].id}`,
          songs: unprocessed,
          confidence: 100,
          matchType: 'EXACT_URL_MATCH',
          matchReasons: ['Same YouTube URL']
        });
        unprocessed.forEach(s => processed.add(s.id));
      }
    }
  });

  // Phase 2: Find title + artist exact matches
  songs.forEach((song, i) => {
    if (processed.has(song.id)) return;

    const normalizedTitle = normalizeForMatching(song.title);
    const normalizedArtist = song.artist ? normalizeForMatching(song.artist) : '';

    const duplicates: any[] = [song];

    for (let j = i + 1; j < songs.length; j++) {
      const other = songs[j];
      if (processed.has(other.id)) continue;

      const otherTitle = normalizeForMatching(other.title);
      const otherArtist = other.artist ? normalizeForMatching(other.artist) : '';

      if (normalizedTitle === otherTitle && normalizedArtist === otherArtist) {
        duplicates.push(other);
        processed.add(other.id);
      }
    }

    if (duplicates.length > 1) {
      const scores = duplicates.map(s => ({
        song: s,
        score: calculateMasterScore(s, usageCounts.get(s.id) || 0)
      }));
      scores.sort((a, b) => b.score - a.score);
      
      groups.push({
        id: `exact-${song.id}`,
        songs: duplicates,
        confidence: 95,
        matchType: 'EXACT_METADATA_MATCH',
        matchReasons: ['Exact title and artist match']
      });
      processed.add(song.id);
    }
  });

  // Phase 3: Find high similarity matches (90%+ title, 80%+ artist)
  songs.forEach((song, i) => {
    if (processed.has(song.id)) return;

    const duplicates: any[] = [song];
    const similarities: number[] = [];
    const reasons: string[] = [];

    for (let j = i + 1; j < songs.length; j++) {
      const other = songs[j];
      if (processed.has(other.id)) continue;

      const titleSim = calculateSimilarity(
        normalizeForMatching(song.title),
        normalizeForMatching(other.title)
      );

      const artistSim = song.artist && other.artist
        ? calculateSimilarity(
            normalizeForMatching(song.artist),
            normalizeForMatching(other.artist)
          )
        : 100; // If no artist, don't penalize

      if (titleSim >= 90 && artistSim >= 80) {
        duplicates.push(other);
        similarities.push((titleSim + artistSim) / 2);
        processed.add(other.id);
      }
    }

    if (duplicates.length > 1) {
      const avgSimilarity = Math.round(similarities.reduce((a, b) => a + b, 0) / similarities.length);
      const scores = duplicates.map(s => ({
        song: s,
        score: calculateMasterScore(s, usageCounts.get(s.id) || 0)
      }));
      scores.sort((a, b) => b.score - a.score);
      
      groups.push({
        id: `high-${song.id}`,
        songs: duplicates,
        confidence: avgSimilarity,
        matchType: 'HIGH_SIMILARITY',
        matchReasons: [`${avgSimilarity}% title and artist similarity`]
      });
      processed.add(song.id);
    }
  });

  // Phase 4: Find medium similarity matches (85%+ title, 70%+ artist)
  songs.forEach((song, i) => {
    if (processed.has(song.id)) return;

    const duplicates: any[] = [song];
    const similarities: number[] = [];

    for (let j = i + 1; j < songs.length; j++) {
      const other = songs[j];
      if (processed.has(other.id)) continue;

      const titleSim = calculateSimilarity(
        normalizeForMatching(song.title),
        normalizeForMatching(other.title)
      );

      const artistSim = song.artist && other.artist
        ? calculateSimilarity(
            normalizeForMatching(song.artist),
            normalizeForMatching(other.artist)
          )
        : 100;

      if (titleSim >= 85 && artistSim >= 70) {
        duplicates.push(other);
        similarities.push((titleSim + artistSim) / 2);
        processed.add(other.id);
      }
    }

    if (duplicates.length > 1) {
      const avgSimilarity = Math.round(similarities.reduce((a, b) => a + b, 0) / similarities.length);
      const scores = duplicates.map(s => ({
        song: s,
        score: calculateMasterScore(s, usageCounts.get(s.id) || 0)
      }));
      scores.sort((a, b) => b.score - a.score);
      
      groups.push({
        id: `medium-${song.id}`,
        songs: duplicates,
        confidence: avgSimilarity,
        matchType: 'MEDIUM_SIMILARITY',
        matchReasons: [`${avgSimilarity}% title and artist similarity`]
      });
      processed.add(song.id);
    }
  });

  // Sort groups by confidence (highest first)
  groups.sort((a, b) => b.confidence - a.confidence);

  return groups;
};

export const executeMerge = async (
  decisions: MergeDecision[]
): Promise<{ merged: number; skipped: number; errors: string[] }> => {
  const errors: string[] = [];
  let merged = 0;
  let skipped = 0;

  for (const decision of decisions) {
    if (decision.action === 'skip') {
      skipped++;
      continue;
    }

    try {
      // 1. Update set_songs to point to master song
      for (const dupId of decision.duplicateIds) {
        const { error: updateError } = await supabase
          .from("set_songs")
          .update({ song_id: decision.masterSongId })
          .eq("song_id", dupId);

        if (updateError) {
          errors.push(`Failed to update set_songs for ${dupId}: ${updateError.message}`);
        }
      }

      // 2. Delete duplicate songs
      const { error: deleteError } = await supabase
        .from("songs")
        .delete()
        .in("id", decision.duplicateIds);

      if (deleteError) {
        errors.push(`Failed to delete duplicates: ${deleteError.message}`);
      } else {
        merged++;
      }
    } catch (error) {
      errors.push(`Unexpected error: ${error}`);
    }
  }

  return { merged, skipped, errors };
};

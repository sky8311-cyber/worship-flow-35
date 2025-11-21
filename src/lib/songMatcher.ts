import { calculateSimilarity, normalizeForMatching } from "./levenshtein";
import { ParsedSong } from "./csvSetParser";

export enum MatchType {
  EXACT = "exact",
  FUZZY_HIGH = "fuzzy_high",
  FUZZY_MID = "fuzzy_mid",
  MULTIPLE = "multiple",
  NOT_FOUND = "not_found",
}

export interface Song {
  id: string;
  title: string;
  artist?: string;
  category?: string;
  language?: string;
  default_key?: string;
}

export interface MatchResult {
  parsedSong: ParsedSong;
  matchType: MatchType;
  confidence: number;
  matchedSong?: Song;
  candidates?: Song[];
}

export async function matchSongToLibrary(
  parsedSong: ParsedSong,
  songLibrary: Song[]
): Promise<MatchResult> {
  const normalizedTitle = normalizeForMatching(parsedSong.title);

  // Step 1: Exact Match
  const exactMatch = songLibrary.find(
    (song) => normalizeForMatching(song.title) === normalizedTitle
  );

  if (exactMatch) {
    return {
      parsedSong,
      matchType: MatchType.EXACT,
      confidence: 100,
      matchedSong: exactMatch,
    };
  }

  // Step 2: Fuzzy Match
  const fuzzyResults = songLibrary
    .map((song) => ({
      song,
      similarity: calculateSimilarity(
        normalizedTitle,
        normalizeForMatching(song.title)
      ),
    }))
    .filter((r) => r.similarity >= 70)
    .sort((a, b) => b.similarity - a.similarity);

  if (fuzzyResults.length === 0) {
    return {
      parsedSong,
      matchType: MatchType.NOT_FOUND,
      confidence: 0,
    };
  }

  if (fuzzyResults.length === 1) {
    const match = fuzzyResults[0];
    return {
      parsedSong,
      matchType: match.similarity >= 90 ? MatchType.FUZZY_HIGH : MatchType.FUZZY_MID,
      confidence: match.similarity,
      matchedSong: match.song,
    };
  }

  // Multiple candidates with similar scores
  const topSimilarity = fuzzyResults[0].similarity;
  const similarCandidates = fuzzyResults.filter(
    (r) => r.similarity >= topSimilarity - 10
  );

  if (similarCandidates.length > 1) {
    return {
      parsedSong,
      matchType: MatchType.MULTIPLE,
      confidence: topSimilarity,
      candidates: similarCandidates.slice(0, 5).map((r) => r.song),
    };
  }

  return {
    parsedSong,
    matchType: fuzzyResults[0].similarity >= 90 ? MatchType.FUZZY_HIGH : MatchType.FUZZY_MID,
    confidence: fuzzyResults[0].similarity,
    matchedSong: fuzzyResults[0].song,
  };
}

export async function matchAllSongs(
  parsedSongs: ParsedSong[],
  songLibrary: Song[]
): Promise<Map<string, MatchResult>> {
  const results = new Map<string, MatchResult>();

  for (const parsedSong of parsedSongs) {
    const matchResult = await matchSongToLibrary(parsedSong, songLibrary);
    results.set(parsedSong.originalText, matchResult);
  }

  return results;
}

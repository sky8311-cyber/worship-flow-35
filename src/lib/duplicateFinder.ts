import { levenshteinDistance, calculateSimilarity, normalizeForMatching } from "./levenshtein";
import { supabase } from "@/integrations/supabase/client";

export interface DuplicateGroup {
  id: string;
  songs: any[];
  confidence: number;
}

export interface MergeDecision {
  groupId: string;
  masterSongId: string;
  duplicateIds: string[];
  action: 'merge' | 'skip';
}

export const findDuplicates = (songs: any[]): DuplicateGroup[] => {
  const groups: DuplicateGroup[] = [];
  const processed = new Set<string>();

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
        : 0;

      // Title이 85% 이상 유사하고, Artist가 있다면 70% 이상 유사
      const isDuplicate = titleSim >= 85 && (
        !song.artist || !other.artist || artistSim >= 70
      );

      if (isDuplicate) {
        duplicates.push(other);
        similarities.push(titleSim);
        processed.add(other.id);
      }
    }

    if (duplicates.length > 1) {
      groups.push({
        id: `group-${song.id}`,
        songs: duplicates,
        confidence: Math.round(similarities.reduce((a, b) => a + b, 0) / similarities.length)
      });
      processed.add(song.id);
    }
  });

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

// Musical key utilities for computing transpose amount between two keys.
// Treats enharmonic equivalents (e.g. C# ↔ Db) as the same pitch class.

const PITCH_CLASS: Record<string, number> = {
  C: 0,
  "B#": 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  Fb: 4,
  F: 5,
  "E#": 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
  Cb: 11,
};

export function getPitchClass(key: string | null | undefined): number | null {
  if (!key) return null;
  const k = key.trim();
  if (k in PITCH_CLASS) return PITCH_CLASS[k];
  return null;
}

/**
 * Compute the smallest signed semitone difference from `fromKey` to `toKey`
 * in the range [-6, +6]. Returns null if either key is invalid.
 *
 * Examples:
 *   computeTranspose("C", "D")  => +2
 *   computeTranspose("D", "C")  => -2
 *   computeTranspose("C", "F#") => +6
 */
export function computeTranspose(
  fromKey: string | null | undefined,
  toKey: string | null | undefined
): number | null {
  const a = getPitchClass(fromKey);
  const b = getPitchClass(toKey);
  if (a === null || b === null) return null;
  let diff = (b - a) % 12;
  if (diff > 6) diff -= 12;
  if (diff < -6) diff += 12;
  return diff;
}

/**
 * Format the transpose amount for display.
 *   0  => "0" (same key)
 *   +2 => "+2"
 *   -3 => "-3"
 */
export function formatTranspose(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return "";
  if (amount === 0) return "0";
  return amount > 0 ? `+${amount}` : `${amount}`;
}

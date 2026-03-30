/**
 * Determines if it's currently nighttime (19:00–06:00) in the given timezone.
 * Falls back to Asia/Seoul if no timezone provided.
 */
export function isNightTime(timezone: string | null): boolean {
  try {
    const tz = timezone || "Asia/Seoul";
    const hour = parseInt(
      new Intl.DateTimeFormat("en-US", {
        timeZone: tz,
        hour: "numeric",
        hour12: false,
      }).format(new Date())
    );
    return hour >= 19 || hour < 6;
  } catch {
    return false;
  }
}

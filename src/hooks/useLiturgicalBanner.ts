import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface LiturgicalItem {
  id: string;
  year: number;
  date_start: string;
  date_end: string;
  title_ko: string;
  title_en: string | null;
  type: string;
}

export interface LiturgicalBannerResult {
  mode: "active" | "reminder" | "none";
  item: LiturgicalItem | null;
  daysUntil?: number;
  daysLeft?: number;
}

// Helper: Get today's date in user timezone (YYYY-MM-DD)
function getTodayInTimezone(timezone: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(now); // Returns YYYY-MM-DD format
  } catch {
    // Fallback to local date
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }
}

// Helper: Add days to date string
function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr + "T00:00:00");
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// Helper: Calculate days between two date strings
function diffDays(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1 + "T00:00:00");
  const d2 = new Date(dateStr2 + "T00:00:00");
  return Math.round((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
}

// Helper: Calculate duration of an item
function getDuration(item: LiturgicalItem): number {
  return diffDays(item.date_end, item.date_start);
}

export function useLiturgicalBanner() {
  const { profile, user } = useAuth();
  const timezone = profile?.timezone || "America/Vancouver";

  return useQuery<LiturgicalBannerResult>({
    queryKey: ["liturgical-banner", timezone, user?.id],
    queryFn: async (): Promise<LiturgicalBannerResult> => {
      const today = getTodayInTimezone(timezone);

      // Step A: Find active items (date_start <= today <= date_end)
      const { data: activeItems, error: activeError } = await supabase
        .from("liturgical_calendar_items")
        .select("*")
        .lte("date_start", today)
        .gte("date_end", today)
        .order("date_start", { ascending: true });

      if (activeError) {
        console.error("Error fetching active liturgical items:", activeError);
        return { mode: "none", item: null };
      }

      if (activeItems && activeItems.length > 0) {
        // Pick most specific (shortest duration)
        const sorted = [...activeItems].sort((a, b) => {
          const durationA = getDuration(a);
          const durationB = getDuration(b);
          if (durationA !== durationB) return durationA - durationB;
          // Tie: earlier start date wins
          return a.date_start.localeCompare(b.date_start);
        });

        const item = sorted[0];
        const daysLeft = diffDays(item.date_end, today);

        return {
          mode: "active",
          item,
          daysLeft: daysLeft > 0 ? daysLeft : undefined,
        };
      }

      // Step B: Find upcoming items within 30 days
      const thirtyDaysLater = addDays(today, 30);

      const { data: upcomingItems, error: upcomingError } = await supabase
        .from("liturgical_calendar_items")
        .select("*")
        .gt("date_start", today)
        .lte("date_start", thirtyDaysLater)
        .order("date_start", { ascending: true })
        .limit(1);

      if (upcomingError) {
        console.error("Error fetching upcoming liturgical items:", upcomingError);
        return { mode: "none", item: null };
      }

      if (upcomingItems && upcomingItems.length > 0) {
        const item = upcomingItems[0];
        const daysUntil = diffDays(item.date_start, today);

        return {
          mode: "reminder",
          item,
          daysUntil,
        };
      }

      // Step C: No match
      return { mode: "none", item: null };
    },
    enabled: !!user,
    staleTime: 6 * 60 * 60 * 1000, // 6 hours cache
    gcTime: 24 * 60 * 60 * 1000, // 24 hours garbage collection
  });
}

import { format } from "date-fns";

export interface ParsedSong {
  originalText: string;
  title: string;
  key?: string;
  keyTransition?: string;
  notes?: string;
}

export interface ParsedWorshipSet {
  title: string;
  date: string;
  passage?: string;
  series?: string;
  keywords?: string;
  parsedSongs: ParsedSong[];
  rowIndex: number;
}

export function parseDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error("Invalid date");
    }
    return format(date, "yyyy-MM-dd");
  } catch {
    return dateStr;
  }
}

export function parseSongsColumn(songsText: string): ParsedSong[] {
  if (!songsText || songsText.trim() === "") return [];

  // Handle multi-line entries
  const normalized = songsText.replace(/\n/g, " / ");

  // Split by "/" or ","
  const songParts = normalized
    .split(/[\/,]/)
    .map((s) => s.trim())
    .filter(Boolean);

  return songParts.map((part) => {
    const parsed: ParsedSong = { originalText: part, title: "" };

    // Extract key information: (D), (G), (D→E), (D->E), (F/G), etc.
    const keyMatch = part.match(/\(([A-G#b→\-\/]+)\)/);
    if (keyMatch) {
      const keyInfo = keyMatch[1];
      if (keyInfo.includes("→") || keyInfo.includes("->")) {
        parsed.keyTransition = keyInfo.replace("->", "→");
        parsed.key = keyInfo.split(/→|->/).map(k => k.trim())[0];
      } else {
        parsed.key = keyInfo;
      }
      part = part.replace(keyMatch[0], "").trim();
    }

    // Extract notes: "후렴만", "후렴", "intro", "outro", etc.
    const noteMatch = part.match(/(후렴만|후렴|intro|outro|간주)/i);
    if (noteMatch) {
      parsed.notes = noteMatch[1];
      part = part.replace(noteMatch[0], "").trim();
    }

    // Remaining is the title
    parsed.title = part.trim();

    return parsed;
  });
}

export function parseWorshipSetCSV(csvData: any[]): ParsedWorshipSet[] {
  return csvData.map((row, index) => {
    const parsedSet: ParsedWorshipSet = {
      title: row.Title || "",
      date: parseDate(row.Date || ""),
      passage: row.Passage || undefined,
      series: row.Series || undefined,
      keywords: row.Keywords || undefined,
      parsedSongs: parseSongsColumn(row.Songs || ""),
      rowIndex: index + 1,
    };

    return parsedSet;
  });
}

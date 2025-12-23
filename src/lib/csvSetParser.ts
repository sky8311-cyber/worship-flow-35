import { format } from "date-fns";

export interface ParsedSong {
  originalText: string;
  title: string;
  key?: string;
  keyTransition?: string;
  notes?: string;
  bpm?: number;
  artist?: string;
}

export interface ParsedComponent {
  type: string;
  label: string;
  assignedTo?: string;
  durationMinutes?: number;
  content?: string;
}

export interface ParsedWorshipSet {
  title: string;
  date: string;
  worshipLeader?: string;
  bandName?: string;
  theme?: string;
  passage?: string;
  targetAudience?: string;
  serviceTime?: string;
  worshipDuration?: number;
  notes?: string;
  parsedSongs: ParsedSong[];
  parsedComponents: ParsedComponent[];
  rowIndex: number;
  // Legacy field for compatibility
  series?: string;
  keywords?: string;
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

export function parseSongsColumn(songsText: string, keysText?: string, bpmsText?: string, notesText?: string): ParsedSong[] {
  if (!songsText || songsText.trim() === "") return [];

  // Handle multi-line entries
  const normalized = songsText.replace(/\n/g, " / ");

  // Split by "/" or ","
  const songParts = normalized
    .split(/[\/]/)
    .map((s) => s.trim())
    .filter(Boolean);

  // Parse corresponding keys, bpms, notes if provided
  const keys = keysText?.split(/[\/]/).map(s => s.trim()) || [];
  const bpms = bpmsText?.split(/[\/]/).map(s => s.trim()) || [];
  const notes = notesText?.split(/[\/]/).map(s => s.trim()) || [];

  return songParts.map((part, index) => {
    const parsed: ParsedSong = { originalText: part, title: "" };

    // Use provided key from separate column if available
    if (keys[index]) {
      const keyInfo = keys[index];
      if (keyInfo.includes("→") || keyInfo.includes("->")) {
        parsed.keyTransition = keyInfo.replace("->", "→");
        parsed.key = keyInfo.split(/→|->/).map(k => k.trim())[0];
      } else {
        parsed.key = keyInfo;
      }
    } else {
      // Extract key information from title: (D), (G), (D→E), (D->E), (F/G), etc.
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
    }

    // Use provided BPM from separate column if available
    if (bpms[index] && bpms[index] !== "") {
      parsed.bpm = parseInt(bpms[index]) || undefined;
    }

    // Use provided notes from separate column if available
    if (notes[index] && notes[index] !== "") {
      parsed.notes = notes[index];
    } else {
      // Extract notes from title: "후렴만", "후렴", "intro", "outro", etc.
      const noteMatch = part.match(/(후렴만|후렴|intro|outro|간주)/i);
      if (noteMatch) {
        parsed.notes = noteMatch[1];
        part = part.replace(noteMatch[0], "").trim();
      }
    }

    // Remaining is the title
    parsed.title = part.trim();

    return parsed;
  });
}

// Map label to component type
function mapLabelToType(label: string): string {
  const lowerLabel = label?.toLowerCase() || "";
  if (lowerLabel.includes("찬양") || lowerLabel.includes("worship") || lowerLabel.includes("praise")) return "worship";
  if (lowerLabel.includes("기도") || lowerLabel.includes("prayer")) return "prayer";
  if (lowerLabel.includes("설교") || lowerLabel.includes("sermon") || lowerLabel.includes("message")) return "sermon";
  if (lowerLabel.includes("환영") || lowerLabel.includes("welcome")) return "welcome";
  if (lowerLabel.includes("축도") || lowerLabel.includes("benediction") || lowerLabel.includes("blessing")) return "benediction";
  if (lowerLabel.includes("카운트") || lowerLabel.includes("countdown")) return "countdown";
  if (lowerLabel.includes("봉헌") || lowerLabel.includes("offering")) return "offering";
  if (lowerLabel.includes("광고") || lowerLabel.includes("announce")) return "announcement";
  if (lowerLabel.includes("성경") || lowerLabel.includes("scripture") || lowerLabel.includes("reading")) return "scripture";
  if (lowerLabel.includes("특송") || lowerLabel.includes("special")) return "special";
  return "custom";
}

// Parse worship order format: "카운트다운::10 | 환영:담당자:3 | 찬양::18"
export function parseWorshipOrder(orderText: string): ParsedComponent[] {
  if (!orderText?.trim()) return [];
  
  return orderText.split('|').map(part => {
    const trimmed = part.trim();
    const segments = trimmed.split(':');
    
    const label = segments[0]?.trim() || '';
    const assignedTo = segments[1]?.trim() || undefined;
    const duration = segments[2]?.trim();
    
    return {
      type: mapLabelToType(label),
      label,
      assignedTo: assignedTo || undefined,
      durationMinutes: duration ? parseInt(duration) : undefined
    };
  }).filter(c => c.label);
}

export function parseWorshipSetCSV(csvData: any[]): ParsedWorshipSet[] {
  return csvData.map((row, index) => {
    // Support both old format (Title, Date, Passage, Series, Songs) 
    // and new format (Date, ServiceName, WorshipLeader, etc.)
    const isNewFormat = 'ServiceName' in row;
    
    const parsedSet: ParsedWorshipSet = {
      title: isNewFormat ? (row.ServiceName || "") : (row.Title || ""),
      date: parseDate(row.Date || ""),
      worshipLeader: row.WorshipLeader || undefined,
      bandName: row.BandName || undefined,
      theme: isNewFormat ? (row.Theme || undefined) : (row.Series || undefined),
      passage: isNewFormat ? (row.ScriptureReference || undefined) : (row.Passage || undefined),
      targetAudience: row.TargetAudience || undefined,
      serviceTime: row.ServiceTime || undefined,
      worshipDuration: row.WorshipDuration ? parseInt(row.WorshipDuration) : undefined,
      notes: row.Notes || undefined,
      parsedSongs: parseSongsColumn(
        row.Songs || "",
        row.SongKeys || "",
        row.SongBPMs || "",
        row.SongNotes || ""
      ),
      parsedComponents: parseWorshipOrder(row.WorshipOrder || ""),
      rowIndex: index + 1,
      // Legacy
      series: row.Series || undefined,
      keywords: row.Keywords || undefined,
    };

    return parsedSet;
  });
}

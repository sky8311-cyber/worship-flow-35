export interface GeneratedSong {
  song_id: string;
  song_title: string;
  artist: string;
  key: string;
  order_position: number;
  role: string;
  tempo: string;
  transition_note: string;
  rationale: string;
}

export interface WorshipArc {
  theologicalProposition: string;
  emotionalJourney: string;
  tempoPattern: string;
  conductorNote: string;
}

export const MUSICAL_KEYS = [
  "A", "A#/Bb", "B", "C", "C#/Db", "D", "D#/Eb", "E", "F", "F#/Gb", "G", "G#/Ab",
  "Am", "A#m/Bbm", "Bm", "Cm", "C#m/Dbm", "Dm", "D#m/Ebm", "Em", "Fm", "F#m/Gbm", "Gm", "G#m/Abm",
];

export const ROLE_COLORS: Record<string, string> = {
  '나아감': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  '마음열기': 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  '선포': 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  '고백': 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  '경배': 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
};

export const TEMPO_COLORS: Record<string, string> = {
  '느림': 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  '보통': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  '빠름': 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};

export const SERVICE_TYPES = [
  { value: "sunday_morning", label: "주일 낮예배" },
  { value: "praise_worship", label: "찬양예배" },
  { value: "retreat", label: "수련회" },
  { value: "special", label: "특별집회" },
];

export const TEMPO_PATTERNS = [
  { value: "slow-fast-slow-slow", label: "느→빠→느→느", description: "기본 권장" },
  { value: "fast-fast-slow-slow", label: "빠→빠→느→느", description: "" },
  { value: "slow-fast-fast-slow", label: "느→빠→빠→느", description: "" },
  { value: "auto", label: "AI 자동 선택", description: "" },
];

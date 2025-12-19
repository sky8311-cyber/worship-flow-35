// Predefined worship service components with bilingual labels

export type WorshipComponentType =
  | "prayer"
  | "decision_hymn"
  | "welcome"
  | "bible_reading"
  | "small_group"
  | "benediction"
  | "announcement"
  | "countdown"
  | "lords_prayer"
  | "apostles_creed"
  | "offering"
  | "sermon"
  | "special_song"
  | "testimony"
  | "communion"
  | "baptism"
  | "responsive_reading"
  | "custom";

export interface WorshipComponentDef {
  type: WorshipComponentType;
  labelEn: string;
  labelKo: string;
  icon: string; // Lucide icon name
}

export const WORSHIP_COMPONENTS: WorshipComponentDef[] = [
  { type: "countdown", labelEn: "Countdown", labelKo: "카운트다운", icon: "Timer" },
  { type: "welcome", labelEn: "Welcome", labelKo: "환영", icon: "HandMetal" },
  { type: "prayer", labelEn: "Prayer", labelKo: "기도", icon: "HandHeart" },
  { type: "decision_hymn", labelEn: "Decision Hymn", labelKo: "결단찬양", icon: "Music" },
  { type: "bible_reading", labelEn: "Bible Reading", labelKo: "성경봉독", icon: "BookOpen" },
  { type: "sermon", labelEn: "Sermon", labelKo: "설교", icon: "Mic" },
  { type: "offering", labelEn: "Offering", labelKo: "헌금", icon: "Heart" },
  { type: "announcement", labelEn: "Announcement", labelKo: "광고", icon: "Megaphone" },
  { type: "lords_prayer", labelEn: "Lord's Prayer", labelKo: "주기도문", icon: "ScrollText" },
  { type: "apostles_creed", labelEn: "Apostles' Creed", labelKo: "사도신경", icon: "ScrollText" },
  { type: "benediction", labelEn: "Benediction", labelKo: "축도", icon: "Sparkles" },
  { type: "special_song", labelEn: "Special Song", labelKo: "특송", icon: "Music2" },
  { type: "testimony", labelEn: "Testimony", labelKo: "간증", icon: "MessageCircle" },
  { type: "communion", labelEn: "Communion", labelKo: "성찬식", icon: "Wine" },
  { type: "baptism", labelEn: "Baptism", labelKo: "세례식", icon: "Droplets" },
  { type: "small_group", labelEn: "Small Group", labelKo: "스몰그룹", icon: "Users" },
  { type: "responsive_reading", labelEn: "Responsive Reading", labelKo: "교독문", icon: "MessagesSquare" },
];

export function getComponentLabel(type: WorshipComponentType, language: "en" | "ko"): string {
  const component = WORSHIP_COMPONENTS.find((c) => c.type === type);
  if (!component) return type;
  return language === "ko" ? component.labelKo : component.labelEn;
}

export function getComponentIcon(type: WorshipComponentType): string {
  const component = WORSHIP_COMPONENTS.find((c) => c.type === type);
  return component?.icon || "Circle";
}

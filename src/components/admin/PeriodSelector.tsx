import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/hooks/useTranslation";

export type Period = "today" | "7days" | "month" | "yoy";

export interface PeriodRange {
  current: { start: Date; end: Date };
  previous: { start: Date; end: Date };
  label: string;
  compareLabel: string;
}

interface PeriodSelectorProps {
  value: Period;
  onChange: (value: Period) => void;
}

export function getPeriodRange(period: Period): PeriodRange {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  switch (period) {
    case "today": {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayEnd = new Date(yesterday);
      yesterdayEnd.setHours(23, 59, 59, 999);
      return {
        current: { start: today, end: now },
        previous: { start: yesterday, end: yesterdayEnd },
        label: "오늘",
        compareLabel: "어제 대비",
      };
    }
    case "7days": {
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const fourteenDaysAgo = new Date(today);
      fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
      const sevenDaysAgoEnd = new Date(sevenDaysAgo);
      sevenDaysAgoEnd.setMilliseconds(-1);
      return {
        current: { start: sevenDaysAgo, end: now },
        previous: { start: fourteenDaysAgo, end: sevenDaysAgoEnd },
        label: "최근 7일",
        compareLabel: "이전 7일 대비",
      };
    }
    case "month": {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const dayOfMonth = now.getDate();
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevMonthSameDay = new Date(now.getFullYear(), now.getMonth() - 1, Math.min(dayOfMonth, new Date(now.getFullYear(), now.getMonth(), 0).getDate()));
      return {
        current: { start: monthStart, end: now },
        previous: { start: prevMonthStart, end: prevMonthSameDay },
        label: "이번 달",
        compareLabel: "지난달 대비",
      };
    }
    case "yoy": {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const lastYearStart = new Date(now.getFullYear() - 1, 0, 1);
      const lastYearSameDay = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      return {
        current: { start: yearStart, end: now },
        previous: { start: lastYearStart, end: lastYearSameDay },
        label: "올해",
        compareLabel: "작년 동기 대비",
      };
    }
    default:
      return getPeriodRange("today");
  }
}

export function PeriodSelector({ value, onChange }: PeriodSelectorProps) {
  const { language } = useTranslation();

  const periods: { value: Period; labelKo: string; labelEn: string }[] = [
    { value: "today", labelKo: "오늘", labelEn: "Today" },
    { value: "7days", labelKo: "최근 7일", labelEn: "Last 7 Days" },
    { value: "month", labelKo: "이번 달", labelEn: "This Month" },
    { value: "yoy", labelKo: "올해 (YoY)", labelEn: "Year over Year" },
  ];

  return (
    <Select value={value} onValueChange={(v) => onChange(v as Period)}>
      <SelectTrigger className="w-[140px] h-8">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {periods.map((p) => (
          <SelectItem key={p.value} value={p.value}>
            {language === "ko" ? p.labelKo : p.labelEn}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

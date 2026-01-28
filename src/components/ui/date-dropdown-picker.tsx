import * as React from "react";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface DateDropdownPickerProps {
  value: string; // YYYY-MM-DD format
  onChange: (date: string) => void;
  minYear?: number;
  maxYear?: number;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month, 0).getDate();
};

const parseInitialValue = (value: string): { year: string; month: string; day: string } => {
  if (!value) return { year: "", month: "", day: "" };
  const parts = value.split("-");
  return {
    year: parts[0] || "",
    month: parts[1] || "",
    day: parts[2] || "",
  };
};

export function DateDropdownPicker({
  value,
  onChange,
  minYear = 1900,
  maxYear = new Date().getFullYear(),
  required = false,
  disabled = false,
  className,
}: DateDropdownPickerProps) {
  const { language } = useTranslation();

  // Local state for partial selections
  const [selectedYear, setSelectedYear] = React.useState<string>("");
  const [selectedMonth, setSelectedMonth] = React.useState<string>("");
  const [selectedDay, setSelectedDay] = React.useState<string>("");

  // Initialize local state from value prop on mount or when value changes externally
  React.useEffect(() => {
    const parsed = parseInitialValue(value);
    setSelectedYear(parsed.year);
    setSelectedMonth(parsed.month);
    setSelectedDay(parsed.day);
  }, [value]);

  // Generate year options (descending order - newest first)
  const yearOptions = React.useMemo(() => {
    const years: number[] = [];
    for (let y = maxYear; y >= minYear; y--) {
      years.push(y);
    }
    return years;
  }, [minYear, maxYear]);

  // Month names
  const monthOptions = React.useMemo(() => {
    const koMonths = ["1월", "2월", "3월", "4월", "5월", "6월", "7월", "8월", "9월", "10월", "11월", "12월"];
    const enMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    return (language === "ko" ? koMonths : enMonths).map((name, index) => ({
      value: String(index + 1).padStart(2, "0"),
      label: name,
    }));
  }, [language]);

  // Day options based on selected year and month
  const dayOptions = React.useMemo(() => {
    const yearNum = selectedYear ? parseInt(selectedYear) : new Date().getFullYear();
    const monthNum = selectedMonth ? parseInt(selectedMonth) : 1;
    const daysInMonth = getDaysInMonth(yearNum, monthNum);
    
    const days: { value: string; label: string }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        value: String(d).padStart(2, "0"),
        label: language === "ko" ? `${d}일` : String(d),
      });
    }
    return days;
  }, [selectedYear, selectedMonth, language]);

  // Validate and adjust day when year/month changes
  const validateDay = (year: string, month: string, day: string): string => {
    if (!year || !month || !day) return day;
    const maxDays = getDaysInMonth(parseInt(year), parseInt(month));
    const currentDay = parseInt(day);
    if (currentDay > maxDays) {
      return String(maxDays).padStart(2, "0");
    }
    return day;
  };

  // Build YYYY-MM-DD string and call onChange only when complete
  const notifyIfComplete = (year: string, month: string, day: string) => {
    if (year && month && day) {
      onChange(`${year}-${month}-${day}`);
    }
  };

  const handleYearChange = (newYear: string) => {
    setSelectedYear(newYear);
    const adjustedDay = validateDay(newYear, selectedMonth, selectedDay);
    if (adjustedDay !== selectedDay) {
      setSelectedDay(adjustedDay);
    }
    notifyIfComplete(newYear, selectedMonth, adjustedDay || selectedDay);
  };

  const handleMonthChange = (newMonth: string) => {
    setSelectedMonth(newMonth);
    const adjustedDay = validateDay(selectedYear, newMonth, selectedDay);
    if (adjustedDay !== selectedDay) {
      setSelectedDay(adjustedDay);
    }
    notifyIfComplete(selectedYear, newMonth, adjustedDay || selectedDay);
  };

  const handleDayChange = (newDay: string) => {
    setSelectedDay(newDay);
    notifyIfComplete(selectedYear, selectedMonth, newDay);
  };

  // Complete date string for hidden input
  const completeDate = selectedYear && selectedMonth && selectedDay
    ? `${selectedYear}-${selectedMonth}-${selectedDay}`
    : "";

  return (
    <div className={cn("flex gap-2", className)}>
      {/* Hidden input for form validation */}
      {required && (
        <input
          type="hidden"
          name="birthDate"
          value={completeDate}
          required
        />
      )}

      {/* Year */}
      <Select
        value={selectedYear}
        onValueChange={handleYearChange}
        disabled={disabled}
      >
        <SelectTrigger className="flex-1 min-w-[90px]">
          <SelectValue placeholder={language === "ko" ? "연도" : "Year"} />
        </SelectTrigger>
        <SelectContent className="max-h-[280px] overflow-y-auto">
          {yearOptions.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {language === "ko" ? `${y}년` : y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Month */}
      <Select
        value={selectedMonth}
        onValueChange={handleMonthChange}
        disabled={disabled || !selectedYear}
      >
        <SelectTrigger className="flex-1 min-w-[80px]">
          <SelectValue placeholder={language === "ko" ? "월" : "Month"} />
        </SelectTrigger>
        <SelectContent className="max-h-[280px] overflow-y-auto">
          {monthOptions.map((m) => (
            <SelectItem key={m.value} value={m.value}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Day */}
      <Select
        value={selectedDay}
        onValueChange={handleDayChange}
        disabled={disabled || !selectedYear || !selectedMonth}
      >
        <SelectTrigger className="flex-1 min-w-[70px]">
          <SelectValue placeholder={language === "ko" ? "일" : "Day"} />
        </SelectTrigger>
        <SelectContent className="max-h-[280px] overflow-y-auto">
          {dayOptions.map((d) => (
            <SelectItem key={d.value} value={d.value}>
              {d.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

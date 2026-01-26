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

  // Parse the current value
  const [year, month, day] = React.useMemo(() => {
    if (!value) return ["", "", ""];
    const parts = value.split("-");
    return [parts[0] || "", parts[1] || "", parts[2] || ""];
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
    const selectedYear = year ? parseInt(year) : new Date().getFullYear();
    const selectedMonth = month ? parseInt(month) : 1;
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    
    const days: { value: string; label: string }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      days.push({
        value: String(d).padStart(2, "0"),
        label: language === "ko" ? `${d}일` : String(d),
      });
    }
    return days;
  }, [year, month, language]);

  // Update the combined date when any part changes
  const handleYearChange = (newYear: string) => {
    const newDay = validateDay(newYear, month, day);
    onChange(buildDateString(newYear, month, newDay));
  };

  const handleMonthChange = (newMonth: string) => {
    const newDay = validateDay(year, newMonth, day);
    onChange(buildDateString(year, newMonth, newDay));
  };

  const handleDayChange = (newDay: string) => {
    onChange(buildDateString(year, month, newDay));
  };

  // Validate day when year/month changes (e.g., Feb 30 -> Feb 28)
  const validateDay = (y: string, m: string, d: string): string => {
    if (!y || !m || !d) return d;
    const maxDays = getDaysInMonth(parseInt(y), parseInt(m));
    const currentDay = parseInt(d);
    if (currentDay > maxDays) {
      return String(maxDays).padStart(2, "0");
    }
    return d;
  };

  // Build YYYY-MM-DD string
  const buildDateString = (y: string, m: string, d: string): string => {
    if (!y || !m || !d) return "";
    return `${y}-${m}-${d}`;
  };

  return (
    <div className={cn("flex gap-2", className)}>
      {/* Year */}
      <Select
        value={year}
        onValueChange={handleYearChange}
        disabled={disabled}
        required={required}
      >
        <SelectTrigger className="flex-1 min-w-[90px]">
          <SelectValue placeholder={language === "ko" ? "연도" : "Year"} />
        </SelectTrigger>
        <SelectContent className="max-h-[200px]">
          {yearOptions.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {language === "ko" ? `${y}년` : y}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Month */}
      <Select
        value={month}
        onValueChange={handleMonthChange}
        disabled={disabled || !year}
        required={required}
      >
        <SelectTrigger className="flex-1 min-w-[80px]">
          <SelectValue placeholder={language === "ko" ? "월" : "Month"} />
        </SelectTrigger>
        <SelectContent>
          {monthOptions.map((m) => (
            <SelectItem key={m.value} value={m.value}>
              {m.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Day */}
      <Select
        value={day}
        onValueChange={handleDayChange}
        disabled={disabled || !year || !month}
        required={required}
      >
        <SelectTrigger className="flex-1 min-w-[70px]">
          <SelectValue placeholder={language === "ko" ? "일" : "Day"} />
        </SelectTrigger>
        <SelectContent className="max-h-[200px]">
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

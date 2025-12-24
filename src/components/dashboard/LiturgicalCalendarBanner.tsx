import { CalendarDays, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useLiturgicalBanner } from "@/hooks/useLiturgicalBanner";
import { useTranslation } from "@/hooks/useTranslation";
import { format } from "date-fns";
import { ko, enUS } from "date-fns/locale";

export function LiturgicalCalendarBanner() {
  const { data, isLoading } = useLiturgicalBanner();
  const { t, language } = useTranslation();
  const dateLocale = language === "ko" ? ko : enUS;

  if (isLoading || !data || data.mode === "none") {
    return null;
  }

  const { mode, item, daysUntil, daysLeft } = data;

  if (!item) return null;

  // Format display
  const title = language === "en" && item.title_en ? item.title_en : item.title_ko;
  const isRange = item.date_start !== item.date_end;

  // Format dates
  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return format(date, language === "ko" ? "M월 d일" : "MMM d", { locale: dateLocale });
  };

  const dateDisplay = isRange
    ? `${formatDateDisplay(item.date_start)} ~ ${formatDateDisplay(item.date_end)}`
    : formatDateDisplay(item.date_start);

  // Main text based on mode
  const mainText =
    mode === "active"
      ? language === "ko"
        ? `오늘 교회력: ${title}`
        : `Today: ${title}`
      : language === "ko"
        ? `교회력 리마인더: ${title}`
        : `Reminder: ${title}`;

  // D-day badge text
  const dDayText =
    mode === "active"
      ? daysLeft && daysLeft > 0
        ? language === "ko"
          ? `${daysLeft}일 남음`
          : `${daysLeft} days left`
        : language === "ko"
          ? "오늘"
          : "Today"
      : daysUntil !== undefined
        ? `D-${daysUntil}`
        : null;

  // Tooltip text
  const tooltipText =
    language === "ko"
      ? "교회력 안내는 예배 준비를 돕기 위한 참고 정보입니다."
      : "This is a planning aid for worship preparation.";

  return (
    <div className="mb-4 p-3 rounded-lg bg-accent/10 border border-accent/20">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
            <CalendarDays className="w-4 h-4 text-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-foreground truncate">
                {mainText}
              </span>
              {dDayText && (
                <Badge
                  variant={mode === "active" ? "default" : "secondary"}
                  className={`text-xs flex-shrink-0 ${
                    mode === "active" ? "bg-accent hover:bg-accent" : ""
                  }`}
                >
                  {dDayText}
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{dateDisplay}</p>
          </div>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button className="flex-shrink-0 p-1 rounded hover:bg-muted transition-colors">
                <Info className="w-4 h-4 text-muted-foreground" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="left" className="max-w-[200px]">
              <p className="text-xs">{tooltipText}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

import { CalendarDays, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLiturgicalBanner, UpcomingItem } from "@/hooks/useLiturgicalBanner";
import { useTranslation } from "@/hooks/useTranslation";
import { format } from "date-fns";
import { ko, enUS } from "date-fns/locale";

export function LiturgicalCalendarBanner() {
  const { data, isLoading } = useLiturgicalBanner();
  const { t, language } = useTranslation();
  const dateLocale = language === "ko" ? ko : enUS;

  if (isLoading || !data) {
    return null;
  }

  const { mode, item, daysUntil, daysLeft, upcomingItems } = data;

  // Format dates
  const formatDateDisplay = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    return format(date, language === "ko" ? "M월 d일" : "MMM d", { locale: dateLocale });
  };

  const getTitle = (item: { title_ko: string; title_en: string | null }) => {
    return language === "en" && item.title_en ? item.title_en : item.title_ko;
  };

  // Tooltip text
  const tooltipText =
    language === "ko"
      ? "교회력 안내는 예배 준비를 돕기 위한 참고 정보입니다."
      : "This is a planning aid for worship preparation.";

  // Upcoming items list component
  const UpcomingItemsList = () => (
    <div className="w-72">
      <div className="px-3 py-2 border-b border-border">
        <h4 className="font-medium text-sm">
          {language === "ko" ? "다가오는 교회력" : "Upcoming Church Calendar"}
        </h4>
      </div>
      <ScrollArea className="h-64">
        <div className="p-2 space-y-1">
          {upcomingItems.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {language === "ko" ? "예정된 일정이 없습니다" : "No upcoming events"}
            </p>
          ) : (
            upcomingItems.map((upcomingItem) => (
              <UpcomingItemRow key={upcomingItem.id} item={upcomingItem} />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );

  const UpcomingItemRow = ({ item: upcomingItem }: { item: UpcomingItem }) => {
    const isRange = upcomingItem.date_start !== upcomingItem.date_end;
    const dateDisplay = isRange
      ? `${formatDateDisplay(upcomingItem.date_start)} ~ ${formatDateDisplay(upcomingItem.date_end)}`
      : formatDateDisplay(upcomingItem.date_start);

    return (
      <div className="flex items-start justify-between gap-2 p-2 rounded-md hover:bg-muted/50 transition-colors">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{getTitle(upcomingItem)}</p>
          {language === "en" && upcomingItem.title_en && (
            <p className="text-xs text-muted-foreground truncate">{upcomingItem.title_ko}</p>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">{dateDisplay}</p>
        </div>
        <Badge
          variant={upcomingItem.daysUntil === 0 ? "default" : "secondary"}
          className={`text-xs flex-shrink-0 ${
            upcomingItem.daysUntil === 0 ? "bg-accent hover:bg-accent" : ""
          }`}
        >
          {upcomingItem.daysUntil === 0
            ? language === "ko"
              ? "오늘"
              : "Today"
            : `D-${upcomingItem.daysUntil}`}
        </Badge>
      </div>
    );
  };

  // If no active/reminder item but we have upcoming items, show just the calendar icon
  if (mode === "none") {
    if (upcomingItems.length === 0) return null;
    
    return (
      <div className="mb-4">
        <Popover>
          <PopoverTrigger asChild>
            <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
              <CalendarDays className="w-4 h-4" />
              <span className="text-xs">
                {language === "ko" ? "교회력 보기" : "View Church Calendar"}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="p-0">
            <UpcomingItemsList />
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  if (!item) return null;

  // Format display for current item
  const title = getTitle(item);
  const isRange = item.date_start !== item.date_end;
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

  return (
    <div className="mb-4 p-3 rounded-lg bg-accent/10 border border-accent/20">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Popover>
            <PopoverTrigger asChild>
              <button className="flex-shrink-0 w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center hover:bg-accent/30 transition-colors cursor-pointer">
                <CalendarDays className="w-4 h-4 text-accent" />
              </button>
            </PopoverTrigger>
            <PopoverContent align="start" className="p-0">
              <UpcomingItemsList />
            </PopoverContent>
          </Popover>
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

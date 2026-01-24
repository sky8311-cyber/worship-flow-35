import { useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Users } from "lucide-react";
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, 
  subMonths, addWeeks, subWeeks 
} from "date-fns";
import { ko, enUS } from "date-fns/locale";

interface CalendarEvent {
  id: string;
  title: string;
  event_date: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  rsvp_enabled?: boolean;
}

interface CommunityCalendarViewProps {
  communityId: string;
  events: CalendarEvent[];
  onEventClick?: (event: CalendarEvent) => void;
  canManage: boolean;
}

export function CommunityCalendarView({ 
  communityId, 
  events, 
  onEventClick,
  canManage 
}: CommunityCalendarViewProps) {
  const { t, language } = useTranslation();
  const dateLocale = language === "ko" ? ko : enUS;
  const [viewMode, setViewMode] = useState<"month" | "week">("month");
  const [currentDate, setCurrentDate] = useState(new Date());

  // Parse date string as local date
  const parseLocalDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Monthly view: all days of the month grid
  const getMonthDays = () => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  };

  // Weekly view: all days of the week
  const getWeekDays = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    const end = endOfWeek(currentDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  };

  const days = viewMode === "month" ? getMonthDays() : getWeekDays();

  // Filter events for a specific day
  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventDate = parseLocalDate(event.event_date);
      return isSameDay(eventDate, day);
    });
  };

  const handlePrev = () => {
    if (viewMode === "month") {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      setCurrentDate(subWeeks(currentDate, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === "month") {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      setCurrentDate(addWeeks(currentDate, 1));
    }
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const weekDayLabels = language === "ko" 
    ? ["일", "월", "화", "수", "목", "금", "토"]
    : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            {t("calendarEvent.calendarView" as any) || "Calendar View"}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "month" | "week")}>
              <TabsList className="h-8">
                <TabsTrigger value="month" className="text-xs px-2">
                  {t("calendarEvent.monthView" as any) || "Monthly"}
                </TabsTrigger>
                <TabsTrigger value="week" className="text-xs px-2">
                  {t("calendarEvent.weekView" as any) || "Weekly"}
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
        
        {/* Navigation */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleToday}>
              {t("calendarEvent.today" as any) || "Today"}
            </Button>
            <Button variant="outline" size="sm" onClick={handleNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <span className="font-medium">
            {format(currentDate, viewMode === "month" ? "yyyy년 M월" : "yyyy년 M월 d일", { locale: dateLocale })}
          </span>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Day headers */}
        <div className="grid grid-cols-7 mb-2">
          {weekDayLabels.map((day, i) => (
            <div 
              key={day} 
              className={`text-center text-sm font-medium py-2 
                ${i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-muted-foreground"}`}
            >
              {day}
            </div>
          ))}
        </div>
        
        {/* Date grid */}
        <div className={`grid grid-cols-7 gap-1 ${viewMode === "week" ? "min-h-[200px]" : ""}`}>
          {days.map((day, i) => {
            const dayEvents = getEventsForDay(day);
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, currentDate);
            const dayOfWeek = day.getDay();
            
            return (
              <div
                key={i}
                className={`
                  ${viewMode === "month" ? "min-h-[80px]" : "min-h-[150px]"}
                  p-1 border rounded-md
                  ${!isCurrentMonth && viewMode === "month" ? "bg-muted/30 opacity-50" : ""}
                  ${isToday ? "border-primary border-2" : "border-border"}
                `}
              >
                <div className={`text-sm mb-1 
                  ${dayOfWeek === 0 ? "text-red-500" : dayOfWeek === 6 ? "text-blue-500" : ""}
                  ${isToday ? "font-bold" : ""}`}
                >
                  {format(day, "d")}
                </div>
                
                {/* Events */}
                <div className="space-y-1">
                  {dayEvents.slice(0, viewMode === "month" ? 2 : 5).map((event) => (
                    <div
                      key={event.id}
                      onClick={() => onEventClick?.(event)}
                      className="text-xs p-1 rounded bg-primary/10 text-primary truncate cursor-pointer hover:bg-primary/20 flex items-center gap-1"
                    >
                      {event.rsvp_enabled && (
                        <Users className="h-3 w-3 flex-shrink-0" />
                      )}
                      <span className="truncate">
                        {event.start_time && (
                          <span className="font-medium">{event.start_time.slice(0, 5)} </span>
                        )}
                        {event.title}
                      </span>
                    </div>
                  ))}
                  {dayEvents.length > (viewMode === "month" ? 2 : 5) && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{dayEvents.length - (viewMode === "month" ? 2 : 5)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

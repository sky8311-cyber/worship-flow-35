import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Calendar, Music, Users, Church, MoreHorizontal } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "@/hooks/useTranslation";
import { CalendarEventDialog } from "@/components/CalendarEventDialog";
import { Badge } from "@/components/ui/badge";

interface ServiceSet {
  id: string;
  date: string;
  service_name: string;
  worship_leader?: string | null;
}

interface CalendarEvent {
  id: string;
  title: string;
  event_type: "rehearsal" | "meeting" | "worship_service" | "other";
  event_date: string;
  start_time?: string | null;
  end_time?: string | null;
  location?: string | null;
  community_id: string;
}

interface UnifiedEvent {
  id: string;
  type: "service_set" | "calendar_event";
  date: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  linkTo?: string;
  badgeLabel?: string;
  onClick?: () => void;
}

interface UpcomingEventsWidgetProps {
  sets?: ServiceSet[];
  maxVisible?: number;
}

export function UpcomingEventsWidget({ sets = [], maxVisible = 5 }: UpcomingEventsWidgetProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>();
  const [eventDialogOpen, setEventDialogOpen] = useState(false);

  // Fetch calendar events
  const { data: calendarEvents } = useQuery({
    queryKey: ["calendar-events", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get user's communities
      const { data: memberData } = await supabase
        .from("community_members")
        .select("community_id")
        .eq("user_id", user.id);

      const communityIds = memberData?.map((m) => m.community_id) || [];
      if (communityIds.length === 0) return [];

      // Get upcoming calendar events
      const today = new Date().toISOString().split("T")[0];
      const { data: events } = await supabase
        .from("calendar_events")
        .select("*")
        .in("community_id", communityIds)
        .gte("event_date", today)
        .order("event_date", { ascending: true })
        .limit(20);

      return events || [];
    },
    enabled: !!user,
  });

  // Combine and sort events
  const unifiedEvents: UnifiedEvent[] = [
    ...(sets?.map((set) => ({
      id: set.id,
      type: "service_set" as const,
      date: set.date,
      title: set.service_name,
      subtitle: set.worship_leader || undefined,
      icon: <Church className="w-4 h-4" />,
      linkTo: `/set-builder/${set.id}`,
      badgeLabel: t("calendarEvent.types.worship_service"),
    })) || []),
    ...(calendarEvents?.map((event) => {
      const iconMap = {
        rehearsal: <Music className="w-4 h-4" />,
        meeting: <Users className="w-4 h-4" />,
        worship_service: <Church className="w-4 h-4" />,
        other: <MoreHorizontal className="w-4 h-4" />,
      };

      return {
        id: event.id,
        type: "calendar_event" as const,
        date: event.event_date,
        title: event.title,
        subtitle: event.location || undefined,
        icon: iconMap[event.event_type],
        badgeLabel: t(`calendarEvent.types.${event.event_type}` as any),
        onClick: () => {
          setSelectedEventId(event.id);
          setEventDialogOpen(true);
        },
      };
    }) || []),
  ]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, maxVisible);

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CalendarDays className="w-4 h-4" />
            {t("dashboard.upcomingEvents")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {unifiedEvents.length > 0 ? (
            <div className="space-y-2">
              {unifiedEvents.map((event) => {
                return event.linkTo ? (
                  <Link
                    key={`${event.type}-${event.id}`}
                    to={event.linkTo}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer"
                  >
                    <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary shrink-0">
                      <span className="text-xs font-medium">
                        {format(new Date(event.date), "MMM")}
                      </span>
                      <span className="text-lg font-bold">
                        {format(new Date(event.date), "d")}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {event.icon}
                        <p className="text-sm font-medium truncate">{event.title}</p>
                      </div>
                      {event.subtitle && (
                        <p className="text-xs text-muted-foreground truncate">
                          {event.subtitle}
                        </p>
                      )}
                      {event.badgeLabel && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          {event.badgeLabel}
                        </Badge>
                      )}
                    </div>
                  </Link>
                ) : (
                  <div
                    key={`${event.type}-${event.id}`}
                    onClick={event.onClick}
                    className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent transition-colors cursor-pointer"
                  >
                    <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary shrink-0">
                      <span className="text-xs font-medium">
                        {format(new Date(event.date), "MMM")}
                      </span>
                      <span className="text-lg font-bold">
                        {format(new Date(event.date), "d")}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        {event.icon}
                        <p className="text-sm font-medium truncate">{event.title}</p>
                      </div>
                      {event.subtitle && (
                        <p className="text-xs text-muted-foreground truncate">
                          {event.subtitle}
                        </p>
                      )}
                      {event.badgeLabel && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          {event.badgeLabel}
                        </Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">{t("dashboard.noUpcoming")}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <CalendarEventDialog
        open={eventDialogOpen}
        onOpenChange={setEventDialogOpen}
        eventId={selectedEventId}
        onSuccess={() => {
          setEventDialogOpen(false);
          setSelectedEventId(undefined);
        }}
      />
    </>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CalendarClock, FileText, Play, Pause, ExternalLink, Calendar, Plus, MoreHorizontal, Pencil, Trash2, Users } from "lucide-react";
import { format } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import { CalendarEventDialog } from "@/components/CalendarEventDialog";
import { CommunityCalendarView } from "./CommunityCalendarView";
import { EventRsvpListDialog } from "./EventRsvpListDialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface CommunityRecurringCalendarTabProps {
  communityId: string;
  canManage?: boolean;
}

export function CommunityRecurringCalendarTab({ communityId, canManage = false }: CommunityRecurringCalendarTabProps) {
  const { t, language } = useTranslation();
  const queryClient = useQueryClient();
  
  // View mode state
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  
  // Event dialog state
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>();
  
  // RSVP list dialog state
  const [rsvpListOpen, setRsvpListOpen] = useState(false);
  const [selectedEventForRsvp, setSelectedEventForRsvp] = useState<any>(null);

  // Fetch calendar events for this community
  const { data: calendarEvents = [], isLoading: eventsLoading } = useQuery({
    queryKey: ["community-calendar-events", communityId],
    queryFn: async () => {
      const now = new Date();
      const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("community_id", communityId)
        .gte("event_date", localToday)
        .order("event_date", { ascending: true });
      
      if (error) throw error;
      return data || [];
    },
  });

  // Delete calendar event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from("calendar_events")
        .delete()
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-calendar-events", communityId] });
      toast({ title: t("calendarEvent.deleted") });
    },
    onError: (error: any) => {
      toast({
        title: t("common.error"),
        description: error?.message,
        variant: "destructive",
      });
    },
  });

  // Fetch recurring schedules for this community's templates
  const { data: schedules, isLoading: schedulesLoading } = useQuery({
    queryKey: ["community-recurring-schedules", communityId],
    queryFn: async () => {
      // First get templates for this community
      const { data: templates, error: templateError } = await supabase
        .from("worship_set_templates")
        .select("id, name")
        .eq("community_id", communityId);

      if (templateError) throw templateError;
      if (!templates || templates.length === 0) return [];

      const templateIds = templates.map((t) => t.id);

      // Get recurring schedules for these templates
      const { data: schedulesData, error: schedulesError } = await supabase
        .from("recurring_schedules")
        .select("*")
        .in("template_id", templateIds)
        .order("created_at", { ascending: false });

      if (schedulesError) throw schedulesError;

      // Merge template names
      return (schedulesData || []).map((schedule) => ({
        ...schedule,
        template_name: templates.find((t) => t.id === schedule.template_id)?.name || "Unknown",
      }));
    },
  });

  const toggleScheduleMutation = useMutation({
    mutationFn: async ({ scheduleId, isActive }: { scheduleId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("recurring_schedules")
        .update({ is_active: isActive })
        .eq("id", scheduleId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["community-recurring-schedules", communityId] });
      toast({ title: t("recurringCalendar.toggleSuccess") });
    },
    onError: (error: any) => {
      toast({
        title: t("recurringCalendar.toggleError"),
        description: error?.message,
        variant: "destructive",
      });
    },
  });

  const getPatternLabel = (pattern: string) => {
    switch (pattern) {
      case "weekly":
        return language === "ko" ? "매주" : "Weekly";
      case "biweekly":
        return language === "ko" ? "격주" : "Biweekly";
      case "monthly":
        return language === "ko" ? "매월" : "Monthly";
      default:
        return pattern;
    }
  };

  const getDaysOfWeekLabel = (days: number[] | null) => {
    if (!days || days.length === 0) return "";
    const dayNames = language === "ko"
      ? ["일", "월", "화", "수", "목", "금", "토"]
      : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    return days.map((d) => dayNames[d]).join(", ");
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "-";
    return format(new Date(dateString), "PPP", { locale: language === "ko" ? ko : enUS });
  };

  const parseEventDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const handleEditEvent = (eventId: string) => {
    setSelectedEventId(eventId);
    setEventDialogOpen(true);
  };

  const handleDeleteEvent = (eventId: string) => {
    if (confirm(t("common.confirmDelete"))) {
      deleteEventMutation.mutate(eventId);
    }
  };

  const handleAddEvent = () => {
    setSelectedEventId(undefined);
    setEventDialogOpen(true);
  };

  // Handle event click based on permissions
  const handleEventClick = (event: any) => {
    if (canManage) {
      // Managers can edit
      handleEditEvent(event.id);
    } else if (event.rsvp_enabled) {
      // Regular members can view RSVP list
      setSelectedEventForRsvp(event);
      setRsvpListOpen(true);
    }
  };

  const isLoading = eventsLoading || schedulesLoading;

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          {t("common.loading")}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* View mode toggle + Add button */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as "list" | "calendar")}>
          <TabsList className="h-9">
            <TabsTrigger value="list">{t("calendarEvent.listView" as any) || "List View"}</TabsTrigger>
            <TabsTrigger value="calendar">{t("calendarEvent.calendarView" as any) || "Calendar View"}</TabsTrigger>
          </TabsList>
        </Tabs>
        
        {canManage && (
          <Button size="sm" onClick={handleAddEvent}>
            <Plus className="h-4 w-4 mr-2" />
            {t("calendarEvent.addEvent")}
          </Button>
        )}
      </div>

      {viewMode === "calendar" ? (
        <CommunityCalendarView
          communityId={communityId}
          events={calendarEvents}
          onEventClick={handleEventClick}
          canManage={canManage}
        />
      ) : (
        <>
          {/* One-time events section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t("dashboard.upcomingEvents")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {calendarEvents.length > 0 ? (
                <div className="space-y-3">
                  {calendarEvents.map((event: any) => (
                    <div
                      key={event.id}
                      className="flex items-center justify-between p-3 border rounded-lg cursor-pointer hover:bg-muted/50"
                      onClick={() => handleEventClick(event)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium truncate">{event.title}</p>
                          {event.rsvp_enabled && (
                            <Badge variant="outline" className="text-xs">
                              <Users className="h-3 w-3 mr-1" />
                              RSVP
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(parseEventDate(event.event_date), language === "ko" ? "yyyy년 M월 d일" : "PPP", { locale: language === "ko" ? ko : enUS })}
                          {event.start_time && ` ${event.start_time}`}
                        </p>
                        {event.location && (
                          <p className="text-xs text-muted-foreground truncate">
                            📍 {event.location}
                          </p>
                        )}
                      </div>
                      {canManage && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEditEvent(event.id); }}>
                              <Pencil className="h-4 w-4 mr-2" />
                              {t("calendarEvent.edit")}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event.id); }}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              {t("common.delete")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-4">
                  {t("dashboard.noUpcoming")}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recurring schedules section - only for managers */}
          {canManage && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarClock className="h-5 w-5" />
                  {t("recurringCalendar.title")}
                </CardTitle>
                <CardDescription>{t("recurringCalendar.subtitle")}</CardDescription>
              </CardHeader>
              <CardContent>
                {!schedules || schedules.length === 0 ? (
                  <div className="py-4 text-center">
                    <p className="text-muted-foreground mb-4">{t("recurringCalendar.noSchedules")}</p>
                    <Button asChild variant="outline">
                      <Link to="/templates">
                        <FileText className="h-4 w-4 mr-2" />
                        {t("recurringCalendar.goToTemplates")}
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {schedules.map((schedule: any) => (
                      <div
                        key={schedule.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border rounded-lg"
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium">{schedule.template_name}</p>
                            <Badge variant={schedule.is_active ? "default" : "secondary"}>
                              {schedule.is_active
                                ? t("recurringCalendar.active")
                                : t("recurringCalendar.inactive")}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground space-y-0.5">
                            <p>
                              <span className="font-medium">{t("recurringCalendar.pattern")}:</span>{" "}
                              {getPatternLabel(schedule.pattern)}
                              {schedule.days_of_week && schedule.days_of_week.length > 0 && (
                                <> ({getDaysOfWeekLabel(schedule.days_of_week)})</>
                              )}
                            </p>
                            <p>
                              <span className="font-medium">{t("recurringCalendar.nextGeneration")}:</span>{" "}
                              {formatDate(schedule.next_generation_date)}
                            </p>
                            {schedule.create_days_before && (
                              <p>
                                <span className="font-medium">{t("recurringCalendar.createBefore")}:</span>{" "}
                                {schedule.create_days_before} {t("recurringCalendar.daysBefore")}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            {schedule.is_active ? (
                              <Pause className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Play className="h-4 w-4 text-muted-foreground" />
                            )}
                            <Switch
                              checked={schedule.is_active}
                              onCheckedChange={(checked) =>
                                toggleScheduleMutation.mutate({
                                  scheduleId: schedule.id,
                                  isActive: checked,
                                })
                              }
                              disabled={toggleScheduleMutation.isPending}
                            />
                          </div>
                          <Button asChild variant="ghost" size="sm">
                            <Link to="/templates">
                              <ExternalLink className="h-4 w-4" />
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Calendar Event Dialog */}
      <CalendarEventDialog
        open={eventDialogOpen}
        onOpenChange={setEventDialogOpen}
        communityId={communityId}
        eventId={selectedEventId}
      />

      {/* RSVP List Dialog */}
      <EventRsvpListDialog
        open={rsvpListOpen}
        onOpenChange={setRsvpListOpen}
        event={selectedEventForRsvp}
      />
    </div>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { CalendarDays, Calendar, Music, Users, Church, MoreHorizontal, Trash2, Upload, Lock, Link as LinkIcon, Pencil } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "@/hooks/useTranslation";
import { CalendarEventDialog } from "@/components/CalendarEventDialog";
import { EventDetailDialog } from "@/components/community/EventDetailDialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useUserCommunities } from "@/hooks/useUserCommunities";
import { getCountdown } from "@/lib/countdownHelper";
import { cn } from "@/lib/utils";

interface ServiceSet {
  id: string;
  date: string;
  service_name: string;
  worship_leader?: string | null;
  status: "draft" | "published";
  created_by: string;
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
  created_by: string;
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
  created_by?: string;
  status?: "draft" | "published";
  rsvp_enabled?: boolean;
  rawEvent?: any;
}

interface UpcomingEventsWidgetProps {
  sets?: ServiceSet[];
  maxVisible?: number;
  currentUserId?: string;
  isAdmin?: boolean;
  isCommunityLeader?: boolean;
}

export function UpcomingEventsWidget({ 
  sets = [], 
  maxVisible = 5,
  currentUserId,
  isAdmin = false,
  isCommunityLeader = false
}: UpcomingEventsWidgetProps) {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>();
  const [eventDialogOpen, setEventDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedEventForDetail, setSelectedEventForDetail] = useState<any>(null);
  
  const { data: communitiesData } = useUserCommunities();
  const communityIds = communitiesData?.communityIds || [];

  const deleteMutation = useMutation({
    mutationFn: async (setId: string) => {
      const { error } = await supabase
        .from("service_sets")
        .delete()
        .eq("id", setId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("워십세트가 삭제되었습니다");
      queryClient.invalidateQueries({ queryKey: ["upcoming-sets"] });
      queryClient.invalidateQueries({ queryKey: ["unified-community-feed"] });
    },
    onError: (error) => {
      console.error("Delete error:", error);
      toast.error("워십세트 삭제에 실패했습니다");
    },
  });

  const deleteCalendarEventMutation = useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase
        .from("calendar_events")
        .delete()
        .eq("id", eventId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("캘린더 일정이 삭제되었습니다");
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      queryClient.invalidateQueries({ queryKey: ["unified-community-feed"] });
    },
    onError: (error) => {
      console.error("Delete calendar event error:", error);
      toast.error("캘린더 일정 삭제에 실패했습니다");
    },
  });

  const publishMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "draft" | "published" }) => {
      const newStatus = status === "draft" ? "published" : "draft";
      const { error } = await supabase
        .from("service_sets")
        .update({ status: newStatus })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("워십세트 상태가 변경되었습니다");
      queryClient.invalidateQueries({ queryKey: ["upcoming-sets"] });
      queryClient.invalidateQueries({ queryKey: ["unified-community-feed"] });
      queryClient.invalidateQueries({ queryKey: ["worship-sets"] });
    },
    onError: () => {
      toast.error("상태 변경에 실패했습니다");
    },
  });

  const handleTogglePublish = (event: UnifiedEvent, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!event.status) return;
    publishMutation.mutate({ id: event.id, status: event.status });
  };

  const handleShareLink = (event: UnifiedEvent, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const url = `${window.location.origin}/band-view/${event.id}`;
    
    if (navigator.share) {
      navigator.share({ title: event.title, url }).catch(() => {});
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url);
      toast.success("링크가 클립보드에 복사되었습니다");
    } else {
      window.prompt("아래 링크를 복사하세요", url);
    }
  };

  const handleDelete = (setId: string, serviceName: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`"${serviceName}" 워십세트를 삭제하시겠습니까?`)) {
      deleteMutation.mutate(setId);
    }
  };

  const handleDeleteCalendarEvent = (eventId: string, eventTitle: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (window.confirm(`"${eventTitle}" 일정을 삭제하시겠습니까?`)) {
      deleteCalendarEventMutation.mutate(eventId);
    }
  };

  const handleEditCalendarEvent = (eventId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedEventId(eventId);
    setEventDialogOpen(true);
  };

  const isPastDate = (dateString: string) => {
    const setDate = parseLocalDate(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return setDate < today;
  };

  // Parse date string as local date to avoid timezone issues
  const parseLocalDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  const getDayOfWeek = (dateString: string) => {
    const date = parseLocalDate(dateString);
    const dayIndex = date.getDay();
    const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    return t(`common.dayOfWeek.${days[dayIndex]}` as any);
  };

  // Fetch calendar events using shared community IDs
  const { data: calendarEvents } = useQuery({
    queryKey: ["calendar-events", user?.id, communityIds],
    queryFn: async () => {
      if (!user || communityIds.length === 0) return [];

      // Use local date to keep events visible until end of day
      const now = new Date();
      const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const { data: events } = await supabase
        .from("calendar_events")
        .select("*")
        .in("community_id", communityIds)
        .gte("event_date", localToday)
        .order("event_date", { ascending: true })
        .limit(20);

      return events || [];
    },
    enabled: !!user && communityIds.length > 0,
  });


  // Filter sets to show only today and future events (safeguard using local date)
  const now = new Date();
  const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const futureSets = sets?.filter(set => set.date >= localToday) || [];

  // Handle calendar event click - all users view details
  const handleCalendarEventClick = (event: any) => {
    // 모든 사용자: 일정 상세 및 참석자 명단 보기
    setSelectedEventForDetail(event);
    setDetailDialogOpen(true);
  };

  // Combine and sort events
  const unifiedEvents: UnifiedEvent[] = [
    ...futureSets.map((set: any) => ({
      id: set.id,
      type: "service_set" as const,
      date: set.date,
      title: set.service_name,
      subtitle: set.worship_leader || undefined,
      icon: <Church className="w-4 h-4" />,
      linkTo: set.status === "published" ? `/band-view/${set.id}` : `/set-builder/${set.id}`,
      badgeLabel: set.status === "published" ? (language === "ko" ? "게시됨" : "Published") : (language === "ko" ? "임시저장" : "Draft"),
      created_by: set.created_by,
      status: set.status,
    })),
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
        created_by: event.created_by,
        rsvp_enabled: event.rsvp_enabled,
        rawEvent: event,
        onClick: () => handleCalendarEventClick(event),
      };
    }) || []),
  ]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, maxVisible);

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              {t("dashboard.upcomingEvents")}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {unifiedEvents.length > 0 ? (
            <div className="space-y-2">
              {unifiedEvents.map((event) => {
                const isPast = isPastDate(event.date);
                const countdown = getCountdown(event.date);
                const canManage = (event.type === "service_set" && 
                  (isAdmin || (isCommunityLeader && event.created_by === currentUserId))) ||
                  (event.type === "calendar_event" && 
                  (isAdmin || (isCommunityLeader && event.created_by === currentUserId)));

                return event.linkTo ? (
                  <div key={`${event.type}-${event.id}`} className="relative group">
                    <Link
                      to={event.linkTo}
                      className="block p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary shrink-0">
                          <span className="text-xs font-medium">
                            {format(new Date(event.date), "MMM")}
                          </span>
                          <span className="text-lg font-bold">
                            {format(new Date(event.date), "d")}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          {/* Line 1: Icon + Title */}
                          <div className="flex items-center gap-1.5">
                            {event.icon}
                            <p className={cn(
                              "text-sm font-medium truncate flex-1",
                              isPast && "text-muted-foreground"
                            )}>
                              {event.title}
                            </p>
                          </div>
                          {/* Line 2: Subtitle + Badge + Countdown */}
                          <div className="flex items-center justify-between gap-2 mt-0.5">
                            <p className={cn(
                              "text-xs truncate",
                              isPast ? "text-muted-foreground/70" : "text-muted-foreground"
                            )}>
                              {[event.subtitle, event.badgeLabel].filter(Boolean).join(" • ")}
                            </p>
                            {!isPast && countdown.text && (
                              <Badge className="shrink-0 h-5 px-1.5 text-[10px] bg-accent text-accent-foreground hover:bg-accent">
                                {countdown.text}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                    {canManage && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8 md:opacity-0 md:group-hover:opacity-100"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => handleTogglePublish(event, e)}>
                            {event.status === "draft" ? (
                              <>
                                <Upload className="w-4 h-4 mr-2" /> 게시하기
                              </>
                            ) : (
                              <>
                                <Lock className="w-4 h-4 mr-2" /> 비공개로 전환
                              </>
                            )}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => handleShareLink(event, e)}>
                            <LinkIcon className="w-4 h-4 mr-2" />
                            링크 복사
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => handleDelete(event.id, event.title, e)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            삭제
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                ) : (
                  <div key={`${event.type}-${event.id}`} className="relative group">
                    <div
                      onClick={event.onClick}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
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
                        {/* Line 1: Icon + Title + RSVP */}
                        <div className="flex items-center gap-1.5">
                          {event.icon}
                          <p className={cn(
                            "text-sm font-medium truncate flex-1",
                            isPast && "text-muted-foreground"
                          )}>
                            {event.title}
                          </p>
                          {event.rsvp_enabled && (
                            <Badge variant="outline" className="shrink-0 h-5 px-1.5 text-[10px]">
                              RSVP
                            </Badge>
                          )}
                        </div>
                        {/* Line 2: Subtitle + Badge + Countdown */}
                        <div className="flex items-center justify-between gap-2 mt-0.5">
                          <p className={cn(
                            "text-xs truncate",
                            isPast ? "text-muted-foreground/70" : "text-muted-foreground"
                          )}>
                            {[event.subtitle, event.badgeLabel].filter(Boolean).join(" • ")}
                          </p>
                          {!isPast && countdown.text && (
                            <Badge className="shrink-0 h-5 px-1.5 text-[10px] bg-accent text-accent-foreground hover:bg-accent">
                              {countdown.text}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {canManage && event.type === "calendar_event" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 h-8 w-8 md:opacity-0 md:group-hover:opacity-100"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => handleEditCalendarEvent(event.id, e)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            {language === "ko" ? "수정" : "Edit"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => handleDeleteCalendarEvent(event.id, event.title, e)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {language === "ko" ? "삭제" : "Delete"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
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
          queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
          queryClient.invalidateQueries({ queryKey: ["unified-community-feed"] });
        }}
      />

      <EventDetailDialog
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        event={selectedEventForDetail}
      />
    </>
  );
}

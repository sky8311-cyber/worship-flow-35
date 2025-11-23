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
import { CalendarDays, Calendar, Music, Users, Church, MoreHorizontal, Trash2, Upload, Lock, Link as LinkIcon } from "lucide-react";
import { format } from "date-fns";
import { useTranslation } from "@/hooks/useTranslation";
import { CalendarEventDialog } from "@/components/CalendarEventDialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface ServiceSet {
  id: string;
  date: string;
  service_name: string;
  worship_leader?: string | null;
  status: "draft" | "published";
  created_by: string;
  theme?: string | null;
  scripture_reference?: string | null;
  songs?: Array<{
    id: string;
    position: number;
    key?: string | null;
    song: {
      title: string;
    };
  }>;
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
  worshipLeader?: string | null;
  scriptureTheme?: string | null;
  songs?: Array<{
    position: number;
    title: string;
    key?: string | null;
  }>;
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
  const { t } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>();
  const [eventDialogOpen, setEventDialogOpen] = useState(false);

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
    const setDate = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return setDate < today;
  };

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
    ...(sets?.map((set: ServiceSet) => ({
      id: set.id,
      type: "service_set" as const,
      date: set.date,
      title: set.service_name,
      subtitle: set.worship_leader || undefined,
      icon: <Church className="w-4 h-4" />,
      linkTo: set.status === "published" ? `/band-view/${set.id}` : `/set-builder/${set.id}`,
      badgeLabel: set.status === "published" ? "게시됨" : "임시저장",
      created_by: set.created_by,
      status: set.status,
      worshipLeader: set.worship_leader,
      scriptureTheme: set.scripture_reference || set.theme,
      songs: set.songs?.sort((a, b) => a.position - b.position).map(s => ({
        position: s.position,
        title: s.song.title,
        key: s.key
      })),
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
        created_by: event.created_by,
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
                const isPast = isPastDate(event.date);
            const canManage = (event.type === "service_set" && 
              (isAdmin || (isCommunityLeader && event.created_by === currentUserId))) ||
              (event.type === "calendar_event" && 
              (isAdmin || (isCommunityLeader && event.created_by === currentUserId)));

                return event.linkTo ? (
                  <div key={`${event.type}-${event.id}`} className="relative group">
                    <Link
                      to={event.linkTo}
                      className="block p-4 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    >
                      <div className="space-y-2">
                        {/* Header with date */}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>{format(new Date(event.date), "yyyy년 M월 d일")}</span>
                        </div>
                        
                        {/* Service name */}
                        <h3 className={`text-base font-semibold ${isPast ? 'text-muted-foreground' : ''}`}>
                          {event.title}
                        </h3>

                        {/* Worship leader */}
                        {event.worshipLeader && (
                          <p className="text-sm text-muted-foreground">
                            예배인도자: {event.worshipLeader}
                          </p>
                        )}

                        {/* Scripture/Theme */}
                        {event.scriptureTheme && (
                          <p className="text-sm text-muted-foreground">
                            본문/설교제목: {event.scriptureTheme}
                          </p>
                        )}

                        {/* Song list */}
                        {event.songs && event.songs.length > 0 && (
                          <div className="space-y-1 pt-2">
                            <p className="text-xs font-medium text-muted-foreground">곡 목록:</p>
                            {event.songs.slice(0, 3).map((song, idx) => (
                              <p key={idx} className="text-sm text-muted-foreground">
                                {song.position}. {song.title} {song.key ? `(${song.key})` : ''}
                              </p>
                            ))}
                            {event.songs.length > 3 && (
                              <p className="text-xs text-muted-foreground italic">
                                +{event.songs.length - 3}곡 더보기
                              </p>
                            )}
                          </div>
                        )}

                        {/* Status badge */}
                        {event.badgeLabel && (
                          <Badge variant="secondary" className="text-xs mt-2">
                            {event.badgeLabel}
                          </Badge>
                        )}
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
                        <div className="flex items-center gap-2 mb-1">
                          {event.icon}
                          <p className={`text-sm font-medium truncate ${isPast ? 'text-muted-foreground' : ''}`}>
                            {event.title}
                          </p>
                        </div>
                        {event.subtitle && (
                          <p className={`text-xs truncate ${isPast ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}>
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
                            <Calendar className="w-4 h-4 mr-2" />
                            수정
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => handleDeleteCalendarEvent(event.id, event.title, e)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            삭제
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
    </>
  );
}

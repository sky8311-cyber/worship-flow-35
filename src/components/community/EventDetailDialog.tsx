import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CalendarDays, Clock, MapPin, FileText, Users, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { toast } from "sonner";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string | null;
  event_type: "rehearsal" | "meeting" | "worship_service" | "other";
  event_date: string;
  start_time?: string | null;
  end_time?: string | null;
  location?: string | null;
  rsvp_enabled?: boolean;
  community_id: string;
}

interface EventDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: CalendarEvent | null;
}

interface RsvpResponse {
  id: string;
  response: string;
  user_id: string;
  profiles: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

export function EventDetailDialog({ open, onOpenChange, event }: EventDetailDialogProps) {
  const { t, language } = useTranslation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const dateLocale = language === "ko" ? ko : enUS;

  // Parse date string as local date
  const parseLocalDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Fetch RSVP responses
  const { data: rsvpResponses = [], isLoading: rsvpLoading } = useQuery({
    queryKey: ["event-rsvp-responses", event?.id],
    queryFn: async () => {
      if (!event?.id) return [];
      
      const { data, error } = await supabase
        .from("event_rsvp_responses")
        .select(`
          id,
          response,
          user_id,
          profiles:user_id (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq("event_id", event.id);
      
      if (error) throw error;
      return (data || []) as RsvpResponse[];
    },
    enabled: open && !!event?.id && event?.rsvp_enabled,
  });

  // Get current user's response
  const myResponse = rsvpResponses.find(r => r.user_id === user?.id)?.response;

  // RSVP mutation
  const rsvpMutation = useMutation({
    mutationFn: async (response: "attending" | "not_attending") => {
      if (!event?.id || !user?.id) throw new Error("Missing data");

      const { error } = await supabase
        .from("event_rsvp_responses")
        .upsert({
          event_id: event.id,
          user_id: user.id,
          response,
        }, {
          onConflict: "event_id,user_id",
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(t("rsvp.responseSaved"));
      queryClient.invalidateQueries({ queryKey: ["event-rsvp-responses", event?.id] });
    },
    onError: () => {
      toast.error(t("common.error"));
    },
  });

  // Group by response type
  const attending = rsvpResponses.filter(r => r.response === "attending");
  const notAttending = rsvpResponses.filter(r => r.response === "not_attending");

  if (!event) return null;

  const eventTypeLabels: Record<string, string> = {
    rehearsal: t("calendarEvent.types.rehearsal"),
    meeting: t("calendarEvent.types.meeting"),
    worship_service: t("calendarEvent.types.worship_service"),
    other: t("calendarEvent.types.other"),
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {eventTypeLabels[event.event_type] || event.event_type}
            </Badge>
          </div>
          <DialogTitle className="text-xl">{event.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date & Time */}
          <div className="flex items-start gap-3">
            <CalendarDays className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">
                {format(parseLocalDate(event.event_date), language === "ko" ? "yyyy년 M월 d일 (eee)" : "PPP (eee)", { locale: dateLocale })}
              </p>
              {(event.start_time || event.end_time) && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {event.start_time?.slice(0, 5)}
                  {event.end_time && ` - ${event.end_time.slice(0, 5)}`}
                </p>
              )}
            </div>
          </div>

          {/* Location */}
          {event.location && (
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <p>{event.location}</p>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-muted-foreground whitespace-pre-wrap">{event.description}</p>
            </div>
          )}

          {/* RSVP Section */}
          {event.rsvp_enabled && (
            <>
              <Separator />
              
              {/* My Response Buttons */}
              <div className="space-y-3">
                <h4 className="font-medium flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {t("rsvp.title")}
                </h4>
                
                <div className="flex gap-2">
                  <Button
                    variant={myResponse === "attending" ? "default" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => rsvpMutation.mutate("attending")}
                    disabled={rsvpMutation.isPending}
                  >
                    {rsvpMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-1.5" />
                        {t("rsvp.attending")}
                      </>
                    )}
                  </Button>
                  <Button
                    variant={myResponse === "not_attending" ? "destructive" : "outline"}
                    size="sm"
                    className="flex-1"
                    onClick={() => rsvpMutation.mutate("not_attending")}
                    disabled={rsvpMutation.isPending}
                  >
                    {rsvpMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <XCircle className="h-4 w-4 mr-1.5" />
                        {t("rsvp.notAttending")}
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* Attendees List */}
              {rsvpLoading ? (
                <div className="py-4 text-center text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Attending */}
                  <div>
                    <h5 className="text-sm font-medium flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      {t("rsvp.attending")} ({attending.length})
                    </h5>
                    {attending.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {attending.map(r => (
                          <div key={r.id} className="flex items-center gap-2 bg-muted/50 rounded-full pl-1 pr-3 py-1">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={r.profiles?.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {r.profiles?.full_name?.[0] || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs">{r.profiles?.full_name || t("common.deletedUser")}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {language === "ko" ? "아직 참석자가 없습니다" : "No attendees yet"}
                      </p>
                    )}
                  </div>

                  {/* Not Attending */}
                  <div>
                    <h5 className="text-sm font-medium flex items-center gap-2 mb-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      {t("rsvp.notAttending")} ({notAttending.length})
                    </h5>
                    {notAttending.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {notAttending.map(r => (
                          <div key={r.id} className="flex items-center gap-2 bg-muted/50 rounded-full pl-1 pr-3 py-1">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={r.profiles?.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {r.profiles?.full_name?.[0] || "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs">{r.profiles?.full_name || t("common.deletedUser")}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {language === "ko" ? "불참자가 없습니다" : "No one declined"}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

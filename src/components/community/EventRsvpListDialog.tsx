import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "@/hooks/useTranslation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { CheckCircle, XCircle, Users } from "lucide-react";
import { format } from "date-fns";
import { ko, enUS } from "date-fns/locale";

interface CalendarEvent {
  id: string;
  title: string;
  event_date: string;
  start_time?: string;
  location?: string;
}

interface EventRsvpListDialogProps {
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

export function EventRsvpListDialog({ open, onOpenChange, event }: EventRsvpListDialogProps) {
  const { t, language } = useTranslation();
  const dateLocale = language === "ko" ? ko : enUS;

  // Parse date string as local date
  const parseLocalDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Fetch RSVP responses
  const { data: rsvpResponses = [], isLoading } = useQuery({
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
    enabled: open && !!event?.id,
  });

  // Group by response type
  const attending = rsvpResponses.filter(r => r.response === "attending");
  const notAttending = rsvpResponses.filter(r => r.response === "not_attending");

  if (!event) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {event.title}
          </DialogTitle>
          <DialogDescription>
            {format(parseLocalDate(event.event_date), language === "ko" ? "yyyy년 M월 d일 (eee)" : "PPP (eee)", { locale: dateLocale })}
            {event.start_time && ` ${event.start_time.slice(0, 5)}`}
            {event.location && ` • 📍 ${event.location}`}
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            {t("common.loading")}
          </div>
        ) : (
          <div className="space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Attending */}
            <div>
              <h4 className="font-medium flex items-center gap-2 mb-3">
                <CheckCircle className="h-4 w-4 text-green-500" />
                {t("rsvp.attending" as any) || "Attending"} ({attending.length})
              </h4>
              {attending.length > 0 ? (
                <div className="space-y-2">
                  {attending.map(r => (
                    <div key={r.id} className="flex items-center gap-3 py-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={r.profiles?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {r.profiles?.full_name?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{r.profiles?.full_name || t("common.deletedUser")}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-2">
                  {language === "ko" ? "아직 참석자가 없습니다" : "No attendees yet"}
                </p>
              )}
            </div>

            {/* Not Attending */}
            <div>
              <h4 className="font-medium flex items-center gap-2 mb-3">
                <XCircle className="h-4 w-4 text-red-500" />
                {t("rsvp.notAttending" as any) || "Not Attending"} ({notAttending.length})
              </h4>
              {notAttending.length > 0 ? (
                <div className="space-y-2">
                  {notAttending.map(r => (
                    <div key={r.id} className="flex items-center gap-3 py-2">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={r.profiles?.avatar_url || undefined} />
                        <AvatarFallback className="text-xs">
                          {r.profiles?.full_name?.[0] || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{r.profiles?.full_name || t("common.deletedUser")}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-2">
                  {language === "ko" ? "불참자가 없습니다" : "No one declined"}
                </p>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

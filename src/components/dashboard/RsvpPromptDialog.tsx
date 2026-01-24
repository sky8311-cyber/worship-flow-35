import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle, XCircle, Clock } from "lucide-react";
import { format } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { toast } from "sonner";

interface RsvpPromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CalendarEvent {
  id: string;
  title: string;
  event_date: string;
  start_time: string | null;
  location: string | null;
  community_id: string;
  rsvp_enabled: boolean;
}

export function RsvpPromptDialog({ open, onOpenChange }: RsvpPromptDialogProps) {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const queryClient = useQueryClient();
  const dateLocale = language === "ko" ? ko : enUS;
  
  // Session-based dismiss state (resets on page refresh)
  const [dismissedEventIds, setDismissedEventIds] = useState<Set<string>>(new Set());

  // Parse date string as local date
  const parseLocalDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Fetch pending RSVP events
  const { data: pendingRsvpEvents = [] } = useQuery({
    queryKey: ["pending-rsvp-events", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Get user's communities
      const { data: memberships } = await supabase
        .from("community_members")
        .select("community_id")
        .eq("user_id", user.id);

      if (!memberships || memberships.length === 0) return [];
      const communityIds = memberships.map(m => m.community_id);

      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      // Fetch RSVP-enabled future events
      const { data: events } = await supabase
        .from("calendar_events")
        .select("*")
        .in("community_id", communityIds)
        .eq("rsvp_enabled", true)
        .gte("event_date", today)
        .order("event_date", { ascending: true });

      if (!events || events.length === 0) return [];

      // Get already responded events
      const { data: responses } = await supabase
        .from("event_rsvp_responses")
        .select("event_id")
        .eq("user_id", user.id)
        .in("event_id", events.map(e => e.id));

      const respondedEventIds = new Set(responses?.map(r => r.event_id) || []);

      // Return only unanswered events
      return events.filter(event => !respondedEventIds.has(event.id)) as CalendarEvent[];
    },
    enabled: !!user && open,
  });

  // Filter out session-dismissed events
  const eventsToShow = pendingRsvpEvents.filter(e => !dismissedEventIds.has(e.id));

  const rsvpMutation = useMutation({
    mutationFn: async ({ eventId, response }: { eventId: string; response: string }) => {
      const { error } = await supabase
        .from("event_rsvp_responses")
        .upsert({
          event_id: eventId,
          user_id: user!.id,
          response,
          responded_at: new Date().toISOString(),
        }, {
          onConflict: "event_id,user_id",
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-rsvp-events"] });
      queryClient.invalidateQueries({ queryKey: ["event-rsvp-responses"] });
      queryClient.invalidateQueries({ queryKey: ["event-rsvp-stats"] });
      toast.success(t("rsvp.responseSaved" as any) || "Response saved");
    },
    onError: () => {
      toast.error(t("common.error"));
    },
  });

  const handleResponse = (eventId: string, response: string) => {
    rsvpMutation.mutate({ eventId, response });
  };

  const handleRemindLater = (eventId: string) => {
    // Only dismiss for this session
    setDismissedEventIds(prev => new Set([...prev, eventId]));
  };

  // Auto-close when all events are handled
  if (open && eventsToShow.length === 0) {
    onOpenChange(false);
    return null;
  }

  return (
    <Dialog open={open && eventsToShow.length > 0} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t("rsvp.title" as any) || "Attendance Check"}
          </DialogTitle>
          <DialogDescription>
            {t("rsvp.description" as any) || "Please respond to the following upcoming events"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {eventsToShow.map((event) => (
            <RsvpEventCard 
              key={event.id}
              event={event}
              onResponse={handleResponse}
              onRemindLater={handleRemindLater}
              isPending={rsvpMutation.isPending}
              language={language}
              dateLocale={dateLocale}
              parseLocalDate={parseLocalDate}
            />
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Individual event card with RSVP stats
interface RsvpEventCardProps {
  event: CalendarEvent;
  onResponse: (eventId: string, response: string) => void;
  onRemindLater: (eventId: string) => void;
  isPending: boolean;
  language: string;
  dateLocale: typeof ko | typeof enUS;
  parseLocalDate: (dateString: string) => Date;
}

function RsvpEventCard({ event, onResponse, onRemindLater, isPending, language, dateLocale, parseLocalDate }: RsvpEventCardProps) {
  const { t } = useTranslation();
  
  // Fetch current RSVP stats
  const { data: rsvpStats } = useQuery({
    queryKey: ["event-rsvp-stats", event.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("event_rsvp_responses")
        .select("response")
        .eq("event_id", event.id);
      
      const attending = data?.filter(r => r.response === "attending").length || 0;
      const notAttending = data?.filter(r => r.response === "not_attending").length || 0;
      
      return { attending, notAttending };
    },
  });

  return (
    <div className="p-4 border rounded-lg space-y-3">
      <div>
        <h4 className="font-medium">{event.title}</h4>
        <p className="text-sm text-muted-foreground">
          {format(parseLocalDate(event.event_date), language === "ko" ? "yyyy년 M월 d일 (eee)" : "PPP", { locale: dateLocale })}
          {event.start_time && ` ${event.start_time.slice(0, 5)}`}
        </p>
        {event.location && (
          <p className="text-xs text-muted-foreground">📍 {event.location}</p>
        )}
      </div>
      
      {/* Current response stats */}
      {rsvpStats && (rsvpStats.attending > 0 || rsvpStats.notAttending > 0) && (
        <div className="flex gap-4 text-sm">
          <span className="text-green-600 flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            {t("rsvp.attending" as any) || "Attending"}: {rsvpStats.attending}
          </span>
          <span className="text-red-600 flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            {t("rsvp.notAttending" as any) || "Not Attending"}: {rsvpStats.notAttending}
          </span>
        </div>
      )}
      
      <div className="flex gap-2 flex-wrap">
        <Button
          size="sm"
          onClick={() => onResponse(event.id, "attending")}
          disabled={isPending}
          className="flex-1"
        >
          <CheckCircle className="h-4 w-4 mr-1" />
          {t("rsvp.attending" as any) || "Attending"}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onResponse(event.id, "not_attending")}
          disabled={isPending}
          className="flex-1"
        >
          <XCircle className="h-4 w-4 mr-1" />
          {t("rsvp.notAttending" as any) || "Not Attending"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => onRemindLater(event.id)}
          disabled={isPending}
          className="flex-1"
        >
          <Clock className="h-4 w-4 mr-1" />
          {t("rsvp.remindLater" as any) || "Remind Later"}
        </Button>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar, CheckCircle, XCircle, Clock, CalendarOff } from "lucide-react";
import { format } from "date-fns";
import { ko, enUS } from "date-fns/locale";
import { toast } from "sonner";

const RSVP_DISMISS_KEY = "rsvp_dismissed_date";

interface CalendarEvent {
  id: string;
  title: string;
  event_date: string;
  start_time: string | null;
  location: string | null;
  community_id: string;
  rsvp_enabled: boolean;
}

// Check if dismissed today
const isDismissedToday = (): boolean => {
  const dismissed = localStorage.getItem(RSVP_DISMISS_KEY);
  if (!dismissed) return false;
  return dismissed === new Date().toISOString().split("T")[0];
};

// Dismiss for today
const dismissForToday = () => {
  localStorage.setItem(RSVP_DISMISS_KEY, new Date().toISOString().split("T")[0]);
};

// Parse date string as local date
const parseLocalDate = (dateString: string) => {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
};

export function GlobalRsvpPrompt() {
  const { user } = useAuth();
  const { t, language } = useTranslation();
  const queryClient = useQueryClient();
  const dateLocale = language === "ko" ? ko : enUS;
  
  const [open, setOpen] = useState(false);
  const [dismissedEventIds, setDismissedEventIds] = useState<Set<string>>(new Set());

  // Fetch user's community IDs
  const { data: communityIds = [] } = useQuery({
    queryKey: ["user-community-ids", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: memberships } = await supabase
        .from("community_members")
        .select("community_id")
        .eq("user_id", user.id);
      return memberships?.map(m => m.community_id) || [];
    },
    enabled: !!user,
  });

  // Fetch pending RSVP events
  const { data: pendingRsvpEvents = [] } = useQuery({
    queryKey: ["pending-rsvp-events-global", user?.id, communityIds],
    queryFn: async () => {
      if (!user || communityIds.length === 0) return [];

      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

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
    enabled: !!user && communityIds.length > 0,
  });

  // Filter out session-dismissed events
  const eventsToShow = pendingRsvpEvents.filter(e => !dismissedEventIds.has(e.id));

  // Auto-open when there are pending events and not dismissed today
  useEffect(() => {
    if (eventsToShow.length > 0 && !isDismissedToday()) {
      setOpen(true);
    }
  }, [eventsToShow.length]);

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
      queryClient.invalidateQueries({ queryKey: ["pending-rsvp-events-global"] });
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

  const handleDismissForToday = () => {
    dismissForToday();
    setOpen(false);
  };

  // Auto-close when all events are handled
  useEffect(() => {
    if (open && eventsToShow.length === 0) {
      setOpen(false);
    }
  }, [open, eventsToShow.length]);

  // Don't render if no events or dismissed today
  if (isDismissedToday() || eventsToShow.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
            />
          ))}
        </div>

        {/* Hide for today button */}
        <div className="pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={handleDismissForToday}
          >
            <CalendarOff className="h-4 w-4 mr-2" />
            {t("rsvp.hideForToday" as any) || "Hide for today"}
          </Button>
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
}

function RsvpEventCard({ event, onResponse, onRemindLater, isPending, language, dateLocale }: RsvpEventCardProps) {
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
          {t("rsvp.remindLater" as any) || "Later"}
        </Button>
      </div>
    </div>
  );
}
